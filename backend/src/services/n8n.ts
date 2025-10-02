import axios from 'axios';
import { config } from '../config';

class N8nService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.n8n.baseUrl;
    this.apiKey = config.n8n.apiKey;
  }

  private getHeaders() {
    return {
      'X-N8N-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async getStats() {
    try {
      // Get workflows
      const workflowsResponse = await axios.get(`${this.baseUrl}/workflows`, {
        headers: this.getHeaders(),
      });

      const workflows = workflowsResponse.data.data || [];

      // Get executions
      const executionsResponse = await axios.get(`${this.baseUrl}/executions`, {
        headers: this.getHeaders(),
        params: {
          limit: 100,
        },
      });

      const executions = executionsResponse.data.data || [];

      // Calculate statistics
      const totalWorkflows = workflows.length;
      const activeWorkflows = workflows.filter((w: any) => w.active).length;

      const successfulExecutions = executions.filter(
        (e: any) => e.finished && !e.stoppedAt
      ).length;
      const failedExecutions = executions.filter(
        (e: any) => e.stoppedAt || !e.finished
      ).length;

      // Get last 10 executions
      const recentExecutions = executions.slice(0, 10).map((e: any) => ({
        id: e.id,
        workflowId: e.workflowId,
        status: e.finished && !e.stoppedAt ? 'success' : 'failed',
        startTime: e.startedAt,
        duration: e.finished
          ? new Date(e.finishedAt).getTime() - new Date(e.startedAt).getTime()
          : null,
      }));

      return {
        workflows: {
          total: totalWorkflows,
          active: activeWorkflows,
          inactive: totalWorkflows - activeWorkflows,
        },
        executions: {
          total: executions.length,
          successful: successfulExecutions,
          failed: failedExecutions,
          successRate:
            executions.length > 0
              ? ((successfulExecutions / executions.length) * 100).toFixed(2)
              : 0,
        },
        recentExecutions,
      };
    } catch (error: any) {
      console.error('Error fetching n8n stats:', error.message);
      
      // Return mock data if API is not available
      return {
        workflows: {
          total: 0,
          active: 0,
          inactive: 0,
        },
        executions: {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 0,
        },
        recentExecutions: [],
        error: 'Unable to connect to n8n API. Please check your configuration.',
      };
    }
  }
}

export const n8nService = new N8nService();
