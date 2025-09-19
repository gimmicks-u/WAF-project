'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchLogs, buildLogsQueryParams } from '@/lib/api/logs';
import { MappedSecurityLog } from '@/lib/api/types';
import {
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  Shield,
  Activity,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

export default function LogsPage() {
  const [logs, setLogs] = useState<MappedSecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const itemsPerPage = 50;

  // Load logs from API
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = buildLogsQueryParams(
        {
          searchTerm,
          selectedAction,
          selectedSource,
        },
        currentPage,
        itemsPerPage
      );

      const response = await fetchLogs(queryParams);

      // Apply client-side severity filter (since backend doesn't have severity)
      let filteredLogs = response.logs;
      if (selectedSeverity !== 'all') {
        filteredLogs = filteredLogs.filter(
          (log) => log.severity === selectedSeverity
        );
      }

      setLogs(filteredLogs);
      setTotalLogs(response.total);
      setHasNextPage(response.hasNext);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
      console.error('Error loading logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchTerm,
    selectedAction,
    selectedSource,
    selectedSeverity,
    currentPage,
  ]);

  // Load logs on component mount and when filters change
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Calculate stats from current logs
  const stats = {
    totalLogs: totalLogs,
    blockedLogs: logs.filter((log) => log.action === 'blocked').length,
    detectedLogs: logs.filter((log) => log.action === 'detected').length,
    allowedLogs: logs.filter((log) => log.action === 'allowed').length,
    criticalLogs: logs.filter((log) => log.severity === 'critical').length,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 text-red-700 bg-red-50';
      case 'high':
        return 'border-orange-200 text-orange-700 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 text-yellow-700 bg-yellow-50';
      case 'low':
        return 'border-blue-200 text-blue-700 bg-blue-50';
      default:
        return 'border-slate-200 text-slate-700 bg-slate-50';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'detected':
        return 'bg-yellow-100 text-yellow-800';
      case 'allowed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSeverity('all');
    setSelectedAction('all');
    setSelectedSource('all');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadLogs();
  };

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>Security Logs</h1>
          <p className='text-slate-600 mt-1'>
            Monitor and analyze security events detected by your WAF
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            className='gap-2'
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
        <Card className='border-slate-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center'>
                <Activity className='w-4 h-4 text-blue-600' />
              </div>
              <div>
                <p className='text-sm text-slate-600'>Total Events</p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.totalLogs}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-slate-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center'>
                <Shield className='w-4 h-4 text-red-600' />
              </div>
              <div>
                <p className='text-sm text-slate-600'>Blocked</p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.blockedLogs}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-slate-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center'>
                <Eye className='w-4 h-4 text-yellow-600' />
              </div>
              <div>
                <p className='text-sm text-slate-600'>Detected</p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.detectedLogs}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-slate-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center'>
                <Shield className='w-4 h-4 text-green-600' />
              </div>
              <div>
                <p className='text-sm text-slate-600'>Allowed</p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.allowedLogs}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-slate-200'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center'>
                <AlertTriangle className='w-4 h-4 text-red-600' />
              </div>
              <div>
                <p className='text-sm text-slate-600'>Critical</p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.criticalLogs}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className='border-slate-200'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Filter className='w-4 h-4 text-slate-600' />
              <CardTitle className='text-lg text-slate-900'>Filters</CardTitle>
            </div>
            <Button variant='ghost' size='sm' onClick={handleClearFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4'>
            <div className='relative min-w-64'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400' />
              <Input
                placeholder='Search IP, URL, or threat type...'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className='pl-10'
              />
            </div>
            <Select
              value={selectedSeverity}
              onValueChange={(value) => {
                setSelectedSeverity(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Severity' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Severities</SelectItem>
                <SelectItem value='critical'>Critical</SelectItem>
                <SelectItem value='high'>High</SelectItem>
                <SelectItem value='medium'>Medium</SelectItem>
                <SelectItem value='low'>Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedAction}
              onValueChange={(value) => {
                setSelectedAction(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Action' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Actions</SelectItem>
                <SelectItem value='blocked'>Blocked</SelectItem>
                <SelectItem value='detected'>Detected</SelectItem>
                <SelectItem value='allowed'>Allowed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedSource}
              onValueChange={(value) => {
                setSelectedSource(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Source' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Sources</SelectItem>
                <SelectItem value='waf'>WAF</SelectItem>
                <SelectItem value='access'>Access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className='border-slate-200'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-slate-900'>Security Events</CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Loading events...'
                  : error
                  ? 'Error loading events'
                  : `Showing ${logs.length} of ${totalLogs} events (Page ${currentPage})`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className='text-center py-8'>
              <p className='text-red-600 mb-4'>{error}</p>
              <Button onClick={handleRefresh} variant='outline'>
                <RefreshCw className='w-4 h-4 mr-2' />
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-8 h-8 animate-spin text-slate-600' />
              <span className='ml-2 text-slate-600'>Loading logs...</span>
            </div>
          ) : (
            <div className='space-y-3'>
              {logs.length === 0 ? (
                <div className='text-center py-8 text-slate-500'>
                  No security events found matching your criteria.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className='p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1 space-y-2'>
                        <div className='flex items-center gap-3'>
                          <h4 className='font-medium text-slate-900'>
                            {log.threatType}
                          </h4>
                          <Badge
                            variant='outline'
                            className={getSeverityColor(log.severity)}
                          >
                            {log.severity.toUpperCase()}
                          </Badge>
                          <Badge
                            variant='secondary'
                            className={getActionColor(log.action)}
                          >
                            {log.action.toUpperCase()}
                          </Badge>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600'>
                          <div>
                            <span className='font-medium'>Source IP:</span>{' '}
                            {log.sourceIP}
                          </div>
                          <div>
                            <span className='font-medium'>Method:</span>{' '}
                            {log.requestMethod}
                          </div>
                          <div className='md:col-span-2'>
                            <span className='font-medium'>URL:</span>
                            <code className='ml-2 px-2 py-1 bg-slate-100 rounded text-xs'>
                              {log.requestURL}
                            </code>
                          </div>
                          <div>
                            <span className='font-medium'>Rule ID:</span>{' '}
                            {log.ruleId}
                          </div>
                          <div>
                            <span className='font-medium'>Response:</span>{' '}
                            {log.responseCode}
                          </div>
                        </div>
                        {log.userAgent && (
                          <div className='text-sm text-slate-600'>
                            <span className='font-medium'>User Agent:</span>
                            <div className='mt-1 text-xs text-slate-500 break-all'>
                              {log.userAgent}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className='flex flex-col items-end gap-2'>
                        <div className='text-sm text-slate-500'>
                          {format(log.timestamp, 'MMM d, yyyy')}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {format(log.timestamp, 'HH:mm:ss')}
                        </div>
                        <Button variant='ghost' size='sm' className='h-8 px-2'>
                          <Eye className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && !error && totalLogs > itemsPerPage && (
            <div className='flex items-center justify-between mt-6 pt-4 border-t'>
              <div className='text-sm text-slate-600'>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalLogs)} of {totalLogs}{' '}
                events
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className='flex items-center gap-1'>
                  <span className='text-sm text-slate-600'>Page</span>
                  <Input
                    type='number'
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value) || 1;
                      setCurrentPage(
                        Math.max(
                          1,
                          Math.min(page, Math.ceil(totalLogs / itemsPerPage))
                        )
                      );
                    }}
                    className='w-16 h-8 text-center'
                    min={1}
                    max={Math.ceil(totalLogs / itemsPerPage)}
                  />
                  <span className='text-sm text-slate-600'>
                    of {Math.ceil(totalLogs / itemsPerPage)}
                  </span>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
