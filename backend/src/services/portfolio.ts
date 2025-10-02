import axios from 'axios';
import { config } from '../config';

class PortfolioService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.portfolio.baseUrl;
  }

  async getStats() {
    try {
      // Fetch visitors data
      const visitorsResponse = await axios.get(`${this.baseUrl}/visitors`);
      const visitors = visitorsResponse.data.data || [];

      // Fetch projects data
      const projectsResponse = await axios.get(`${this.baseUrl}/projects`);
      const projects = projectsResponse.data.data || [];

      // Calculate visitors by day (last 7 days)
      const last7Days = this.getLast7Days();
      const visitorsByDay = last7Days.map((date) => {
        const dayVisitors = visitors.filter((v: any) => {
          const visitDate = new Date(v.visitedAt).toDateString();
          return visitDate === date.toDateString();
        });

        return {
          date: date.toISOString().split('T')[0],
          count: dayVisitors.length,
        };
      });

      // Get most viewed projects
      const projectViews = projects
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          views: p.views || 0,
        }))
        .sort((a: any, b: any) => b.views - a.views)
        .slice(0, 5);

      return {
        visitors: {
          total: visitors.length,
          last7Days: visitorsByDay.reduce((sum: number, day: any) => sum + day.count, 0),
          byDay: visitorsByDay,
        },
        projects: {
          total: projects.length,
          mostViewed: projectViews,
        },
      };
    } catch (error: any) {
      console.error('Error fetching portfolio stats:', error.message);

      // Return mock data if API is not available
      const last7Days = this.getLast7Days();
      return {
        visitors: {
          total: 0,
          last7Days: 0,
          byDay: last7Days.map((date) => ({
            date: date.toISOString().split('T')[0],
            count: 0,
          })),
        },
        projects: {
          total: 0,
          mostViewed: [],
        },
        error: 'Unable to connect to portfolio API. Please check your configuration.',
      };
    }
  }

  private getLast7Days(): Date[] {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }
}

export const portfolioService = new PortfolioService();
