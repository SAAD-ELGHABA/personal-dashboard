import React, { useEffect, useState } from 'react';
import { Activity, Workflow, Eye, Key } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { apiService } from '../services/api';
import type { N8nStats, PortfolioStats } from '../types';

export const Overview: React.FC = () => {
  const [n8nStats, setN8nStats] = useState<N8nStats | null>(null);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [n8nResponse, portfolioResponse] = await Promise.all([
          apiService.getN8nStats(),
          apiService.getPortfolioStats(),
        ]);

        setN8nStats(n8nResponse.data);
        setPortfolioStats(portfolioResponse.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
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
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with your services.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Workflow Runs"
          value={n8nStats?.executions.total || 0}
          icon={Workflow}
          description="n8n executions"
        />
        <StatCard
          title="Portfolio Visits"
          value={portfolioStats?.visitors.total || 0}
          icon={Eye}
          description="Total visitors"
        />
        <StatCard
          title="Active Workflows"
          value={n8nStats?.workflows.active || 0}
          icon={Activity}
          description={`${n8nStats?.workflows.total || 0} total workflows`}
        />
        <StatCard
          title="Success Rate"
          value={`${n8nStats?.executions.successRate || 0}%`}
          icon={Key}
          description="Workflow success rate"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">n8n Execution Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Successful</span>
              <span className="font-semibold text-green-500">
                {n8nStats?.executions.successful || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Failed</span>
              <span className="font-semibold text-red-500">
                {n8nStats?.executions.failed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Workflows</span>
              <span className="font-semibold">{n8nStats?.workflows.total || 0}</span>
            </div>
          </div>
          {n8nStats?.error && (
            <div className="mt-4 text-xs text-amber-500 bg-amber-500/10 p-3 rounded">
              {n8nStats.error}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Portfolio Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last 7 Days</span>
              <span className="font-semibold">
                {portfolioStats?.visitors.last7Days || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Projects</span>
              <span className="font-semibold">{portfolioStats?.projects.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Visitors</span>
              <span className="font-semibold">{portfolioStats?.visitors.total || 0}</span>
            </div>
          </div>
          {portfolioStats?.error && (
            <div className="mt-4 text-xs text-amber-500 bg-amber-500/10 p-3 rounded">
              {portfolioStats.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
