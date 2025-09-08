'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockLogs } from '@/lib/mock-data';
import { SecurityLog, LogFilter } from '@/lib/types';
import { Search, Filter, Download, Eye, AlertTriangle, Shield, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function LogsPage() {
  const [logs] = useState<SecurityLog[]>(mockLogs);
  const [filters, setFilters] = useState<LogFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = searchTerm === '' || 
        log.sourceIP.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.requestURL.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.threatType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
      const matchesAction = selectedAction === 'all' || log.action === selectedAction;

      return matchesSearch && matchesSeverity && matchesAction;
    });
  }, [logs, searchTerm, selectedSeverity, selectedAction]);

  const stats = useMemo(() => {
    const totalLogs = filteredLogs.length;
    const blockedLogs = filteredLogs.filter(log => log.action === 'blocked').length;
    const detectedLogs = filteredLogs.filter(log => log.action === 'detected').length;
    const criticalLogs = filteredLogs.filter(log => log.severity === 'critical').length;

    return { totalLogs, blockedLogs, detectedLogs, criticalLogs };
  }, [filteredLogs]);

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
    return action === 'blocked' 
      ? 'bg-red-100 text-red-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSeverity('all');
    setSelectedAction('all');
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Security Logs</h1>
          <p className="text-slate-600 mt-1">
            Monitor and analyze security events detected by your WAF
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Events</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Blocked</p>
                <p className="text-2xl font-bold text-slate-900">{stats.blockedLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Eye className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Detected</p>
                <p className="text-2xl font-bold text-slate-900">{stats.detectedLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Critical</p>
                <p className="text-2xl font-bold text-slate-900">{stats.criticalLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <CardTitle className="text-lg text-slate-900">Filters</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search IP, URL, or threat type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="detected">Detected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900">Security Events</CardTitle>
              <CardDescription>
                Showing {filteredLogs.length} of {logs.length} events
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No security events found matching your criteria.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-slate-900">{log.threatType}</h4>
                        <Badge
                          variant="outline"
                          className={getSeverityColor(log.severity)}
                        >
                          {log.severity.toUpperCase()}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={getActionColor(log.action)}
                        >
                          {log.action.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Source IP:</span> {log.sourceIP}
                        </div>
                        <div>
                          <span className="font-medium">Method:</span> {log.requestMethod}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium">URL:</span>
                          <code className="ml-2 px-2 py-1 bg-slate-100 rounded text-xs">
                            {log.requestURL}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Rule ID:</span> {log.ruleId}
                        </div>
                        <div>
                          <span className="font-medium">Response:</span> {log.responseCode}
                        </div>
                      </div>
                      {log.userAgent && (
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">User Agent:</span>
                          <div className="mt-1 text-xs text-slate-500 break-all">
                            {log.userAgent}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm text-slate-500">
                        {format(log.timestamp, 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(log.timestamp, 'HH:mm:ss')}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}