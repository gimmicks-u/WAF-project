import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsIP,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class LogsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 50;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsIP()
  ip?: string;

  @IsOptional()
  uri?: string;

  @IsOptional()
  method?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  status?: number;

  @IsOptional()
  @IsEnum(['allowed', 'detected', 'blocked'])
  action?: 'allowed' | 'detected' | 'blocked';

  @IsOptional()
  @IsEnum(['access', 'waf'])
  source?: 'access' | 'waf';

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  rule_id?: number;
}
