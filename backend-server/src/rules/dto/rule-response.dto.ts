export interface RuleResponseDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  content: string;
  isActive: boolean;
  ruleType: string;
  createdAt: Date;
  updatedAt: Date;
}
