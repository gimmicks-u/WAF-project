import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Rule } from './entities/rule.entity';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { PerUserMutex } from './utils/per-user-mutex.service';
import { NginxService } from '../domains/nginx.service';
import {
  calculateUserIdBlock,
  extractRuleId,
  findNextAvailableId,
  injectRuleId,
  validateIdInRange,
} from './utils/rule-id.utils';

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(Rule)
    private readonly ruleRepo: Repository<Rule>,
    private readonly dataSource: DataSource,
    private readonly mutex: PerUserMutex,
    private readonly nginxService: NginxService,
  ) {}

  async list(userId: string) {
    const rules = await this.ruleRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
    return rules.map(this.toResponse);
  }

  async create(userId: string, dto: CreateRuleDto) {
    const release = await this.mutex.acquire(userId);
    try {
      const [minId, maxId] = calculateUserIdBlock(userId);
      let content = dto.content.trim();
      if (!this.isLikelyModSecRule(content)) {
        throw new BadRequestException('유효한 ModSecurity 규칙 형식이 아닙니다. SecRule 또는 SecAction 포함 필요');
      }

      const existing = await this.ruleRepo.find({ where: { user_id: userId } });
      let idFromContent = extractRuleId(content);
      if (idFromContent == null || !validateIdInRange(idFromContent, [minId, maxId])) {
        const nextId = findNextAvailableId(existing, [minId, maxId]);
        if (nextId == null) {
          throw new BadRequestException('할당 가능한 규칙 ID가 부족합니다. 관리자에게 문의하세요.');
        }
        content = injectRuleId(content, nextId);
        idFromContent = nextId;
      }

      // Transaction begin
      const qr = this.dataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        const entity = qr.manager.create(Rule, {
          user_id: userId,
          name: dto.name,
          description: dto.description ?? null,
          content,
          is_active: dto.is_active ?? true,
          rule_type: 'custom',
        });
        const saved = await qr.manager.save(entity);

        // Sync file from active rules
        const allRules = await qr.manager.find(Rule, {
          where: { user_id: userId, is_active: true },
          order: { created_at: 'ASC' },
        });
        await this.syncAndValidate(userId, allRules.map(r => r.content));

        await qr.commitTransaction();
        return this.toResponse(saved);
      } catch (e) {
        await this.nginxService.restoreUserRulesBackup(userId).catch(() => undefined);
        await qr.rollbackTransaction();
        throw e;
      } finally {
        await qr.release();
      }
    } finally {
      release();
    }
  }

  async update(userId: string, id: string, dto: UpdateRuleDto) {
    const release = await this.mutex.acquire(userId);
    try {
      const rule = await this.ruleRepo.findOne({ where: { id, user_id: userId } });
      if (!rule) throw new NotFoundException('규칙을 찾을 수 없습니다');

      let content = rule.content;
      const [minId, maxId] = calculateUserIdBlock(userId);

      if (dto.content !== undefined) {
        const nextContent = dto.content.trim();
        if (!this.isLikelyModSecRule(nextContent)) {
          throw new BadRequestException('유효한 ModSecurity 규칙 형식이 아닙니다. SecRule 또는 SecAction 포함 필요');
        }
        let found = extractRuleId(nextContent);
        if (found == null || !validateIdInRange(found, [minId, maxId])) {
          const existing = await this.ruleRepo.find({ where: { user_id: userId } });
          const nextId = findNextAvailableId(existing, [minId, maxId]);
          if (nextId == null) {
            throw new BadRequestException('할당 가능한 규칙 ID가 부족합니다. 관리자에게 문의하세요.');
          }
          content = injectRuleId(nextContent, nextId);
        } else {
          content = nextContent;
        }
      }

      // Transaction
      const qr = this.dataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        if (dto.name !== undefined) rule.name = dto.name;
        if (dto.description !== undefined) rule.description = dto.description;
        if (dto.is_active !== undefined) rule.is_active = dto.is_active;
        rule.content = content;

        const saved = await qr.manager.save(Rule, rule);

        const allRules = await qr.manager.find(Rule, {
          where: { user_id: userId, is_active: true },
          order: { created_at: 'ASC' },
        });
        await this.syncAndValidate(userId, allRules.map(r => r.content));

        await qr.commitTransaction();
        return this.toResponse(saved);
      } catch (e) {
        await this.nginxService.restoreUserRulesBackup(userId).catch(() => undefined);
        await qr.rollbackTransaction();
        throw e;
      } finally {
        await qr.release();
      }
    } finally {
      release();
    }
  }

  async remove(userId: string, id: string) {
    const release = await this.mutex.acquire(userId);
    try {
      const rule = await this.ruleRepo.findOne({ where: { id, user_id: userId } });
      if (!rule) return;

      const qr = this.dataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        await qr.manager.delete(Rule, { id: rule.id, user_id: userId });

        const allRules = await qr.manager.find(Rule, {
          where: { user_id: userId, is_active: true },
          order: { created_at: 'ASC' },
        });
        await this.syncAndValidate(userId, allRules.map(r => r.content));

        await qr.commitTransaction();
      } catch (e) {
        await this.nginxService.restoreUserRulesBackup(userId).catch(() => undefined);
        await qr.rollbackTransaction();
        throw e;
      } finally {
        await qr.release();
      }
    } finally {
      release();
    }
  }

  private async syncAndValidate(userId: string, contents: string[]) {
    // Update file with backup/atomic write
    await this.nginxService.updateUserCustomRules(userId, contents.join('\n\n'));

    // Validate nginx
    const ok = await this.nginxService.validateAndReloadNginx();
    if (!ok) {
      // On failure, restore backup and throw
      await this.nginxService.restoreUserRulesBackup(userId).catch(() => undefined);
      throw new BadRequestException('nginx -t 검증에 실패했습니다. 규칙 내용을 확인하세요.');
    }
  }

  private toResponse(rule: Rule) {
    return {
      id: rule.id,
      userId: rule.user_id,
      name: rule.name,
      description: rule.description,
      content: rule.content,
      isActive: rule.is_active,
      ruleType: rule.rule_type,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
    };
  }

  private isLikelyModSecRule(content: string) {
    return /\bSecRule\b|\bSecAction\b/.test(content);
  }
}
