import { WafLog } from '../entities/waf-log.entity';

export class LogResponseDto {
  id: string;
  timestamp: Date;
  clientIp: string;
  method: string;
  requestUri: string;
  statusCode: number;
  action: string;
  blocked: boolean;
  ruleId?: number;
  ruleMessage?: string;
  threatType?: string;
  requestTime?: number;
  userAgent?: string;
  responseSize: number;
  requestSize: number;

  // Risk level based on various factors
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  constructor(wafLog: WafLog) {
    this.id = wafLog.id;
    this.timestamp = wafLog.timestamp;
    this.clientIp = wafLog.clientIp;
    this.method = wafLog.method;
    this.requestUri = this.truncateUri(wafLog.requestUri);
    this.statusCode = wafLog.statusCode;
    this.action = wafLog.action;
    this.blocked = wafLog.blocked;
    this.ruleId = wafLog.ruleId;
    this.ruleMessage = wafLog.ruleMessage;
    this.threatType = wafLog.threatType;
    this.requestTime = wafLog.requestTime
      ? Number(wafLog.requestTime)
      : undefined;
    this.userAgent = wafLog.userAgent;
    this.responseSize = Number(wafLog.responseSize);
    this.requestSize = Number(wafLog.requestSize);
    this.riskLevel = this.calculateRiskLevel(wafLog);
  }

  private truncateUri(uri: string): string {
    if (uri && uri.length > 100) {
      return uri.substring(0, 97) + '...';
    }
    return uri;
  }

  private calculateRiskLevel(
    log: WafLog,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (log.blocked) {
      // Critical threats based on rule ID or threat type
      if (
        log.threatType?.includes('SQL_INJECTION') ||
        log.threatType?.includes('XSS') ||
        log.threatType?.includes('RCE')
      ) {
        return 'CRITICAL';
      }
      return 'HIGH';
    }

    if (log.statusCode >= 500) {
      return 'MEDIUM';
    }

    if (log.statusCode >= 400) {
      return 'LOW';
    }

    return 'LOW';
  }
}

export class PaginatedLogsResponseDto {
  data: LogResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  stats: {
    blockedCount: number;
    allowedCount: number;
    errorCount: number;
    avgResponseTime?: number;
  };

  constructor(
    logs: WafLog[],
    total: number,
    page: number,
    limit: number,
    stats: {
      blockedCount: number;
      allowedCount: number;
      errorCount: number;
      avgResponseTime?: number;
    },
  ) {
    this.data = logs.map((log) => new LogResponseDto(log));

    const totalPages = Math.ceil(total / limit);

    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    this.stats = stats;
  }
}

export class LogDetailResponseDto extends LogResponseDto {
  // Additional fields for detailed view
  requestUrl?: string;
  referer?: string;
  upstreamAddr?: string;
  upstreamStatus?: number;
  upstreamResponseTime?: number;
  modsecTransactionId?: string;
  modsecAuditLogParts?: string;
  rawLog: any;
  metadata: any;
  createdAt: Date;
  processedAt: Date;

  constructor(wafLog: WafLog) {
    super(wafLog);

    this.requestUrl = wafLog.requestUrl;
    this.referer = wafLog.referer;
    this.upstreamAddr = wafLog.upstreamAddr;
    this.upstreamStatus = wafLog.upstreamStatus;
    this.upstreamResponseTime = wafLog.upstreamResponseTime
      ? Number(wafLog.upstreamResponseTime)
      : undefined;
    this.modsecTransactionId = wafLog.modsecTransactionId;
    this.modsecAuditLogParts = wafLog.modsecAuditLogParts;
    this.rawLog = wafLog.rawLog;
    this.metadata = wafLog.metadata;
    this.createdAt = wafLog.createdAt;
    this.processedAt = wafLog.processedAt;
  }
}
