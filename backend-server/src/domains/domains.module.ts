import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { NginxService } from './nginx.service';
import { Domain } from './entities/domain.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Domain])],
  controllers: [DomainsController],
  providers: [DomainsService, NginxService],
  exports: [DomainsService],
})
export class DomainsModule {}
