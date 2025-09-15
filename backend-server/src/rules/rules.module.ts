import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rule } from './entities/rule.entity';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { PerUserMutex } from './utils/per-user-mutex.service';
import { NginxService } from '../domains/nginx.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rule])],
  controllers: [RulesController],
  providers: [RulesService, PerUserMutex, NginxService],
  exports: [RulesService],
})
export class RulesModule {}
