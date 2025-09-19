import api from '../api';
import {
  BackendLog,
  PaginatedLogsResponse,
  LogsQueryParams,
  MappedSecurityLog,
  LogAction,
} from './types';

/**
 * Maps backend log data to frontend SecurityLog format
 */
export function mapBackendLogToSecurityLog(log: BackendLog): MappedSecurityLog {
  // Determine threat type based on rule IDs and action
  let threatType = 'Unknown Threat';
  if (log.rule_ids && log.rule_ids.length > 0) {
    // Map common ModSecurity rule ID ranges to threat types
    const ruleId = log.rule_ids[0];
    threatType =
      log.action === 'allowed'
        ? `Rule ${ruleId}`
        : log.raw.transaction?.messages[0]?.message ?? `Rule ${ruleId}`;

    if (threatType.includes('tenant')) {
      threatType = `Rule ${ruleId}`;
    }
  } else if (log.source === 'waf') {
    threatType = 'WAF Detection';
  } else if (log.source === 'access') {
    threatType = 'Access Log';
  }

  // Determine severity based on action and status
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (log.action === 'blocked') {
    severity = log.status && log.status >= 500 ? 'critical' : 'high';
  } else if (log.action === 'detected') {
    severity = 'medium';
  } else if (log.status && log.status >= 400) {
    severity = 'medium';
  }

  // Extract user agent from request headers if available
  const userAgent =
    log.request_headers?.['User-Agent'] ||
    log.request_headers?.['user-agent'] ||
    undefined;

  // Map action to frontend format (exclude 'unknown')
  const mappedAction =
    log.action === 'unknown'
      ? 'detected'
      : (log.action as 'detected' | 'blocked' | 'allowed');

  return {
    id: log.id,
    timestamp: new Date(log.ts),
    sourceIP: log.ip || 'Unknown',
    requestURL: log.uri || '/',
    threatType,
    ruleId: log.rule_ids?.join(', ') || 'N/A',
    action: mappedAction,
    severity,
    userAgent,
    requestMethod: log.method || 'GET',
    responseCode: log.status || 0,
    source: log.source,
    requestBody: log.request_body || undefined,
    responseBody: log.response_body || undefined,
    requestHeaders: log.request_headers || undefined,
    responseHeaders: log.response_headers || undefined,
  };
}

/**
 * Fetches logs from the backend API
 */
export async function fetchLogs(params: LogsQueryParams = {}): Promise<{
  logs: MappedSecurityLog[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}> {
  try {
    // Build query parameters, filtering out undefined values
    const queryParams = new URLSearchParams();

    if (params.page !== undefined)
      queryParams.append('page', params.page.toString());
    if (params.limit !== undefined)
      queryParams.append('limit', params.limit.toString());
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.ip) queryParams.append('ip', params.ip);
    if (params.uri) queryParams.append('uri', params.uri);
    if (params.method) queryParams.append('method', params.method);
    if (params.status !== undefined)
      queryParams.append('status', params.status.toString());
    if (params.action) queryParams.append('action', params.action);
    if (params.source) queryParams.append('source', params.source);
    if (params.rule_id !== undefined)
      queryParams.append('rule_id', params.rule_id.toString());

    const response = await api.get<PaginatedLogsResponse>(
      `/logs?${queryParams.toString()}`
    );

    // Map backend logs to frontend format
    const mappedLogs = response.data.items.map(mapBackendLogToSecurityLog);

    return {
      logs: mappedLogs,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      hasNext: response.data.hasNext,
    };
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw new Error('Failed to fetch logs. Please try again later.');
  }
}

/**
 * Helper function to build query params from filter state
 */
export function buildLogsQueryParams(
  filters: {
    searchTerm?: string;
    selectedSeverity?: string;
    selectedAction?: string;
    selectedSource?: string;
    dateFrom?: Date;
    dateTo?: Date;
  },
  page: number = 1,
  limit: number = 50
): LogsQueryParams {
  const params: LogsQueryParams = {
    page,
    limit,
  };

  // Handle search term - could be IP or URI
  if (filters.searchTerm) {
    // Simple IP regex check
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (ipRegex.test(filters.searchTerm)) {
      params.ip = filters.searchTerm;
    } else {
      params.uri = filters.searchTerm;
    }
  }

  // Map action filter
  if (filters.selectedAction && filters.selectedAction !== 'all') {
    params.action = filters.selectedAction as LogAction;
  }

  // Map source filter
  if (filters.selectedSource && filters.selectedSource !== 'all') {
    params.source = filters.selectedSource as 'access' | 'waf';
  }

  // Date range filters
  if (filters.dateFrom) {
    params.from = filters.dateFrom.toISOString();
  }
  if (filters.dateTo) {
    params.to = filters.dateTo.toISOString();
  }

  return params;
}

/**
 * Fetches recent logs for the dashboard
 */
export async function fetchRecentLogs(
  limit: number = 5
): Promise<MappedSecurityLog[]> {
  try {
    const response = await api.get<PaginatedLogsResponse>(
      `/logs?limit=${limit}&page=1`
    );
    return response.data.items.map(mapBackendLogToSecurityLog);
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    return [];
  }
}

/**
 * Fetches statistics for the dashboard
 */
export async function fetchDashboardStats(): Promise<{
  totalRequests: number;
  blockedRequests: number;
  detectedThreats: number;
  allowedRequests: number;
}> {
  try {
    // Fetch different types of logs to get statistics
    // In a production environment, you might want to create a dedicated stats endpoint
    const [allLogs, blockedLogs, detectedLogs, allowedLogs] = await Promise.all(
      [
        api.get<PaginatedLogsResponse>('/logs?limit=1'), // Just to get total count
        api.get<PaginatedLogsResponse>('/logs?action=blocked&limit=1'),
        api.get<PaginatedLogsResponse>('/logs?action=detected&limit=1'),
        api.get<PaginatedLogsResponse>('/logs?action=allowed&limit=1'),
      ]
    );

    return {
      totalRequests: allLogs.data.total,
      blockedRequests: blockedLogs.data.total,
      detectedThreats: detectedLogs.data.total,
      allowedRequests: allowedLogs.data.total,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalRequests: 0,
      blockedRequests: 0,
      detectedThreats: 0,
      allowedRequests: 0,
    };
  }
}
