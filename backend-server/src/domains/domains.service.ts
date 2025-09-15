import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain, DomainStatus } from './entities/domain.entity';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { NginxService } from './nginx.service';

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    private readonly nginxService: NginxService,
  ) {}

  async create(
    userId: string,
    createDomainDto: CreateDomainDto,
  ): Promise<Domain> {
    // Enforce single domain per user
    const userDomainCount = await this.domainRepository.count({
      where: { user_id: userId },
    });
    if (userDomainCount >= 1) {
      throw new BadRequestException('Each user can register only one domain');
    }

    // Check if domain already exists globally
    const existingDomain = await this.domainRepository.findOne({
      where: { domain: createDomainDto.domain },
    });

    if (existingDomain) {
      throw new ConflictException('Domain already registered');
    }

    // Create domain entity
    const domain = this.domainRepository.create({
      ...createDomainDto,
      user_id: userId,
      status: DomainStatus.PENDING,
    });

    // Save to database
    const savedDomain = await this.domainRepository.save(domain);

    try {
      // Generate ModSecurity custom rules file for the user
      await this.nginxService.createUserModSecurityRules(userId);

      // Generate Nginx configuration for the domain
      await this.nginxService.generateNginxConfig(savedDomain);

      // Validate and reload Nginx
      const isValid = await this.nginxService.validateAndReloadNginx();

      if (isValid) {
        // Update status to enabled
        savedDomain.status = DomainStatus.ENABLED;
        await this.domainRepository.save(savedDomain);
      } else {
        throw new BadRequestException('Failed to validate Nginx configuration');
      }
    } catch (error) {
      // If configuration fails, remove the domain
      await this.domainRepository.remove(savedDomain);

      // Clean up configuration files
      await this.nginxService.removeNginxConfig(userId);

      throw new BadRequestException(
        `Failed to configure domain: ${error.message}`,
      );
    }

    return savedDomain;
  }

  async findAllByUser(userId: string): Promise<Domain[]> {
    return this.domainRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Domain> {
    const domain = await this.domainRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    return domain;
  }

  async update(
    id: string,
    userId: string,
    updateDomainDto: UpdateDomainDto,
  ): Promise<Domain> {
    const domain = await this.findOne(id, userId);

    // Store old origin_ip in case we need to rollback
    const oldOriginIp = domain.origin_ip;

    // Update domain
    Object.assign(domain, updateDomainDto);

    // If origin_ip changed, regenerate configuration
    if (
      updateDomainDto.origin_ip &&
      updateDomainDto.origin_ip !== oldOriginIp
    ) {
      try {
        // Generate new configuration
        await this.nginxService.generateNginxConfig(domain);

        // Validate and reload
        const isValid = await this.nginxService.validateAndReloadNginx();

        if (!isValid) {
          // Rollback to old configuration
          domain.origin_ip = oldOriginIp;
          await this.nginxService.generateNginxConfig(domain);
          await this.nginxService.validateAndReloadNginx();

          throw new BadRequestException(
            'Failed to update domain configuration',
          );
        }

        domain.status = DomainStatus.ENABLED;
      } catch (error) {
        throw new BadRequestException(
          `Failed to update domain: ${error.message}`,
        );
      }
    }

    return this.domainRepository.save(domain);
  }

  async remove(id: string, userId: string): Promise<void> {
    const domain = await this.findOne(id, userId);

    // Remove Nginx configuration
    await this.nginxService.removeNginxConfig(userId);

    // Check if user has other domains
    const otherDomains = await this.domainRepository.find({
      where: { user_id: userId },
    });

    // If this is the user's last domain, remove ModSecurity rules file
    if (otherDomains.length === 1) {
      await this.nginxService.removeUserModSecurityRules(userId);
    }

    // Reload Nginx
    await this.nginxService.validateAndReloadNginx();

    // Remove from database
    await this.domainRepository.remove(domain);
  }

  async getStatus(
    id: string,
    userId: string,
  ): Promise<{ status: DomainStatus; message: string }> {
    const domain = await this.findOne(id, userId);

    let message = '';
    switch (domain.status) {
      case DomainStatus.ENABLED:
        message = 'Domain is active and receiving traffic';
        break;
      case DomainStatus.PENDING:
        message = 'Domain configuration is being processed';
        break;
      case DomainStatus.DISABLED:
        message = 'Domain is disabled and not receiving traffic';
        break;
    }

    return {
      status: domain.status,
      message,
    };
  }
}
