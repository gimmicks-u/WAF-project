export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface WAFRule {
  id: string;
  name: string;
  description: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  ruleType: 'custom' | 'owasp';
}

export interface SecurityLog {
  id: string;
  timestamp: Date;
  sourceIP: string;
  requestURL: string;
  threatType: string;
  ruleId: string;
  action: 'detected' | 'blocked';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent?: string;
  requestMethod: string;
  responseCode: number;
}

export interface LogFilter {
  dateFrom?: Date;
  dateTo?: Date;
  sourceIP?: string;
  requestURL?: string;
  threatType?: string;
  action?: 'detected' | 'blocked';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DashboardStats {
  totalRequests: number;
  blockedRequests: number;
  detectedThreats: number;
  activeRules: number;
}