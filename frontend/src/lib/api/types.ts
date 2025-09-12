// API Response Types

export type LogSource = 'access' | 'waf';
export type LogAction = 'allowed' | 'detected' | 'blocked' | 'unknown';

// Backend Log entity structure
export interface BackendLog {
  id: string;
  ts: string; // ISO timestamp
  source: LogSource;
  action: LogAction;
  ip: string | null;
  method: string | null;
  uri: string | null;
  status: number | null;
  rule_ids: number[] | null;
  request_headers: Record<string, string> | null;
  response_headers: Record<string, string> | null;
  request_body: string | null;
  response_body: string | null;
  raw: any;
}

// Paginated response from the API
export interface PaginatedLogsResponse {
  items: BackendLog[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

// Query parameters for logs API
export interface LogsQueryParams {
  page?: number;
  limit?: number;
  from?: string; // ISO date string
  to?: string; // ISO date string
  ip?: string;
  uri?: string;
  method?: string;
  status?: number;
  action?: LogAction;
  source?: LogSource;
  rule_id?: number;
}

// Mapped to existing frontend SecurityLog type
export interface MappedSecurityLog {
  id: string;
  timestamp: Date;
  sourceIP: string;
  requestURL: string;
  threatType: string;
  ruleId: string;
  action: 'detected' | 'blocked' | 'allowed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent?: string;
  requestMethod: string;
  responseCode: number;
  source: LogSource;
  requestBody?: string;
  responseBody?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}
