import { IsString, IsOptional, IsIP, IsEnum } from 'class-validator';
import { DomainStatus } from '../entities/domain.entity';

export class UpdateDomainDto {
  @IsString()
  @IsOptional()
  @IsIP()
  origin_ip?: string;

  @IsEnum(DomainStatus)
  @IsOptional()
  status?: DomainStatus;
}
