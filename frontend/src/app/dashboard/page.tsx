'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockStats, mockRules, mockLogs } from '@/lib/mock-data';
import { Shield, Activity, AlertTriangle, CheckCircle, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Requests',
      value: mockStats.totalRequests.toLocaleString(),
      description: 'Last 30 days',
      icon: Activity,
      trend: '+12%',
    },
    {
      title: 'Blocked Threats',
      value: mockStats.blockedRequests.toLocaleString(),
      description: 'Last 30 days',
      icon: Shield,
      trend: '+8%',
    },
    {
      title: 'Detected Threats',
      value: mockStats.detectedThreats.toLocaleString(),
      description: 'Last 30 days',
      icon: AlertTriangle,
      trend: '+15%',
    },
    {
      title: 'Active Rules',
      value: mockStats.activeRules.toString(),
      description: 'Currently enabled',
      icon: CheckCircle,
      trend: null,
    },
  ];

  const recentLogs = mockLogs.slice(0, 5);
  const recentRules = mockRules.slice(0, 4);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-slate-600" />
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
            {recentRules.map((rule) => (
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
                  <p className="text-sm text-slate-600">{rule.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Updated {format(rule.updatedAt, 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900">Recent Activity</CardTitle>
                <CardDescription>Latest security events</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/logs" className="gap-2">
                  <Eye className="w-4 h-4" />
                  View All Logs
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLogs.map((log) => (
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
                          : 'bg-yellow-100 text-yellow-800'
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
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}