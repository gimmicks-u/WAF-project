'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchRecentLogs, fetchDashboardStats } from '@/lib/api/logs';
import { rulesService, RuleDTO } from '@/services/rules';
import { MappedSecurityLog } from '@/lib/api/types';
import { Shield, Activity, AlertTriangle, CheckCircle, Plus, Eye, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function Dashboard() {
  const [recentLogs, setRecentLogs] = useState<MappedSecurityLog[]>([]);
  const [recentRules, setRecentRules] = useState<RuleDTO[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalRequests: 0,
    blockedRequests: 0,
    detectedThreats: 0,
    allowedRequests: 0,
  });
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);

  // Load recent logs
  const loadRecentLogs = async () => {
    setIsLoadingLogs(true);
    setLogsError(null);
    try {
      const logs = await fetchRecentLogs(5);
      setRecentLogs(logs);
    } catch (error) {
      setLogsError('Failed to load recent activity');
      console.error('Error loading recent logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Load dashboard stats
  const loadDashboardStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await fetchDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Load recent rules
  const loadRecentRules = async () => {
    setIsLoadingRules(true);
    setRulesError(null);
    try {
      const rules = await rulesService.list();
      // Sort by updatedAt and take the first 4
      const sortedRules = rules.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setRecentRules(sortedRules.slice(0, 4));
    } catch (error) {
      setRulesError('Failed to load recent rules');
      console.error('Error loading recent rules:', error);
    } finally {
      setIsLoadingRules(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadRecentLogs();
    loadDashboardStats();
    loadRecentRules();
  }, []);

  const stats = [
    {
      title: 'Total Requests',
      value: isLoadingStats ? '...' : dashboardStats.totalRequests.toLocaleString(),
      description: 'All time',
      icon: Activity,
      trend: null,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Blocked Threats',
      value: isLoadingStats ? '...' : dashboardStats.blockedRequests.toLocaleString(),
      description: 'All time',
      icon: Shield,
      trend: null,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Detected Threats',
      value: isLoadingStats ? '...' : dashboardStats.detectedThreats.toLocaleString(),
      description: 'All time',
      icon: AlertTriangle,
      trend: null,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Allowed Requests',
      value: isLoadingStats ? '...' : dashboardStats.allowedRequests.toLocaleString(),
      description: 'All time',
      icon: CheckCircle,
      trend: null,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Rules',
      value: isLoadingRules ? '...' : recentRules.filter(r => r.isActive).length.toString(),
      description: 'Currently enabled',
      icon: CheckCircle,
      trend: null,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Monitor your web application security and manage protection rules
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-600">{stat.description}</p>
                {stat.trend && (
                  <span className="text-xs font-medium text-green-600">
                    {stat.trend}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Rules */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900">Recent Rules</CardTitle>
                <CardDescription>Your latest security rules</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/rules" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Manage Rules
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingRules ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <span className="ml-2 text-sm text-slate-500">Loading recent rules...</span>
              </div>
            ) : rulesError ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600 mb-2">{rulesError}</p>
                <Button onClick={loadRecentRules} variant="outline" size="sm">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            ) : recentRules.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                No rules created yet
              </div>
            ) : (
              recentRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900">{rule.name}</h4>
                      <Badge
                        variant={rule.isActive ? 'default' : 'secondary'}
                        className={rule.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{rule.description || 'No description'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Updated {format(new Date(rule.updatedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900">Recent Activity</CardTitle>
                <CardDescription>
                  {isLoadingLogs ? 'Loading...' : logsError ? 'Error loading events' : 'Latest security events'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadRecentLogs}
                  disabled={isLoadingLogs}
                  className="gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/logs" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View All
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <span className="ml-2 text-sm text-slate-500">Loading recent activity...</span>
              </div>
            ) : logsError ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600 mb-2">{logsError}</p>
                <Button onClick={loadRecentLogs} variant="outline" size="sm">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                No recent security events
              </div>
            ) : (
              recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-900">{log.threatType}</h4>
                    <Badge
                      variant={log.action === 'blocked' ? 'destructive' : 'secondary'}
                      className={
                        log.action === 'blocked'
                          ? 'bg-red-100 text-red-800'
                          : log.action === 'detected'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {log.action}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {log.sourceIP} → {log.requestURL}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(log.timestamp, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`ml-2 ${
                    log.severity === 'critical'
                      ? 'border-red-200 text-red-700'
                      : log.severity === 'high'
                      ? 'border-orange-200 text-orange-700'
                      : log.severity === 'medium'
                      ? 'border-yellow-200 text-yellow-700'
                      : 'border-blue-200 text-blue-700'
                  }`}
                >
                  {log.severity}
                </Badge>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}