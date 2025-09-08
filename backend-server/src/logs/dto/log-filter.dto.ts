import { IsOptional, IsString, IsInt, IsBoolean, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { LogAction, RequestMethod } from '../entities/waf-log.entity';

export class LogFilterDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Date filtering
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Request information filtering
  @IsOptional()
  @IsString()
  clientIp?: string;

  @IsOptional()
  @IsEnum(RequestMethod)
  method?: RequestMethod;

  @IsOptional()
  @IsString()
  requestUri?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusCode?: number;

  // Security filtering
  @IsOptional()
  @IsEnum(LogAction)
  action?: LogAction;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  blocked?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ruleId?: number;

  @IsOptional()
  @IsString()
  threatType?: string;

  // Search
  @IsOptional()
  @IsString()
  search?: string; // General search across multiple fields

  // Sorting
  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}