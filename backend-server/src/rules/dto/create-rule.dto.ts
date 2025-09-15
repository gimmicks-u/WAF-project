import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRuleDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
