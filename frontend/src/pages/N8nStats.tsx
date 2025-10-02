import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { apiService } from '../services/api';
import { formatDateTime, formatDuration } from '../lib/utils';
import type { N8nStats } from '../types';

const COLORS = ['#10b981', '#ef4444'];

export const N8nStats: React.FC = () => {
  const [stats, setStats] = useState<N8nStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiService.getN8nStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch n8n stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading n8n stats...</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Successful', value: stats?.executions.successful || 0 },
    { name: 'Failed', value: stats?.executions.failed || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">n8n Statistics</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your workflow executions and performance
        </p>
      </div>

      {stats?.error && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-3 rounded-lg">
          <p className="font-semibold">Connection Issue</p>
          <p className="text-sm mt-1">{stats.error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.workflows.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.workflows.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.executions.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.executions.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Execution success rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Execution Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stats?.recentExecutions && stats.recentExecutions.length > 0 ? (
                stats.recentExecutions.map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            execution.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="text-sm font-medium">
                          Workflow {execution.workflowId}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(execution.startTime)}
                      </p>
                    </div>
                    {execution.duration && (
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(execution.duration)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent executions found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
