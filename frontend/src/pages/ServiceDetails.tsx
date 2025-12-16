import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { apiService } from '../services/api';
import { ServiceHealthTestModal } from '../components/ServiceHealthTestModal';
import { Button } from '../components/ui/Button';
import type { ServiceHealthCheck, ServicePerformanceMetrics, ServiceHealthStatus } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const statusConfig: Record<ServiceHealthStatus, { icon: any; color: string; bg: string; text: string }> = {
  UP: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
    text: 'Operational',
  },
  DEGRADED: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    text: 'Degraded',
  },
  DOWN: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    text: 'Down',
  },
};

export const ServiceDetails = () => {
  const { serviceId } = useParams<{ projectId: string; serviceId: string }>();
  const navigate = useNavigate();
  
  const [service, setService] = useState<any>(null);
  const [healthHistory, setHealthHistory] = useState<ServiceHealthCheck[]>([]);
  const [, setPerformanceHistory] = useState<ServicePerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom health test state
  const [isCustomTestModalOpen, setIsCustomTestModalOpen] = useState(false);
  const [customPath, setCustomPath] = useState('');
  const [customTestResult, setCustomTestResult] = useState<any>(null);
  const [customTestInfo, setCustomTestInfo] = useState<any>(null);
  const [isTestingCustom, setIsTestingCustom] = useState(false);
  const [showCustomTestForm, setShowCustomTestForm] = useState(false);

  useEffect(() => {
    loadServiceDetails();
    const interval = setInterval(loadServiceDetails, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [serviceId]);

  const loadServiceDetails = async () => {
    if (!serviceId) return;
    
    try {
      const [serviceData, healthData, perfData] = await Promise.all([
        apiService.getServiceById(serviceId),
        apiService.getServiceHealthHistory(serviceId, 50),
        apiService.getServicePerformanceHistory(serviceId, 20),
      ]);
      
      setService(serviceData);
      setHealthHistory(healthData);
      setPerformanceHistory(perfData);
      setCustomPath(serviceData.probePath || '/health');
    } catch (error) {
      console.error('Failed to load service details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomHealthTest = async () => {
    if (!service || !customPath) return;

    setIsCustomTestModalOpen(true);
    setIsTestingCustom(true);
    setCustomTestResult(null);
    setCustomTestInfo(null);

    try {
      // Temporarily update the service probe path for testing
      const originalPath = service.probePath;
      await apiService.updateService(service._id, { probePath: customPath });

      // Run the test
      const response = await apiService.testServiceHealth(service._id);
      setCustomTestResult(response.data);
      setCustomTestInfo(response.testInfo);

      // Restore original path
      await apiService.updateService(service._id, { probePath: originalPath });
      
      // Reload data to show the test result
      await loadServiceDetails();
    } catch (error) {
      console.error('Failed to test custom health:', error);
      setCustomTestResult({
        status: 'DOWN',
        errorMessage: 'Failed to perform health check',
        checkedAt: new Date().toISOString(),
        responseTimeMs: null,
        httpStatus: null,
        sslValid: null,
        sslExpiry: null,
        dnsResolved: false,
      });
    } finally {
      setIsTestingCustom(false);
      setShowCustomTestForm(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Prepare chart data
  const responseTimeData = healthHistory.slice().reverse().map((check) => ({
    time: formatTime(check.checkedAt),
    responseTime: check.responseTimeMs || 0,
    status: check.status,
  }));

  const statusDistribution = healthHistory.reduce((acc, check) => {
    acc[check.status] = (acc[check.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(statusDistribution).map(([status, count]) => ({
    status,
    count,
  }));

  const uptimePercentage = healthHistory.length > 0
    ? ((healthHistory.filter(h => h.status === 'UP').length / healthHistory.length) * 100).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
        <p className="text-lg text-muted-foreground">Service not found</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const status = (service.latestHealth?.status || 'DOWN') as ServiceHealthStatus;
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col  space-y-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/projects`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{service.name}</h1>
              <p className="text-muted-foreground">{service.baseUrl}</p>
            </div>
          </div>

          <div className={`flex items-center space-x-3 px-6 py-3 rounded-lg ${statusInfo.bg}`}>
            <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
            <span className={`text-lg font-semibold ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>

        {/* Service Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold">{uptimePercentage}%</p>
            <p className="text-xs text-muted-foreground mt-1">Last 50 checks</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">
              {healthHistory.length > 0
                ? `${Math.round(
                    healthHistory.reduce((sum, h) => sum + (h.responseTimeMs || 0), 0) /
                      healthHistory.length
                  )}ms`
                : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Average latency</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Checks</p>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{healthHistory.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Health checks performed</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Last Checked</p>
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">
              {service.latestHealth ? formatDate(service.latestHealth.checkedAt) : 'Never'}
            </p>
          </div>
        </div>

        {/* Custom Health Test Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Custom Health Check</h2>
              <p className="text-sm text-muted-foreground">Test a specific endpoint path</p>
            </div>
            <Button
              onClick={() => setShowCustomTestForm(!showCustomTestForm)}
              variant="default"
            >
              <Activity className="w-4 h-4 mr-2" />
              Test Custom Path
            </Button>
          </div>

          {showCustomTestForm && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <label className="block text-sm font-medium mb-2">
                Endpoint Path *
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  className="flex-1 px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="/health, /api/status, /"
                />
                <Button
                  onClick={handleCustomHealthTest}
                  disabled={!customPath}
                >
                  Run Test
                </Button>
                <Button
                  onClick={() => setShowCustomTestForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Full URL: {service.baseUrl}{customPath}
              </p>
            </div>
          )}
        </div>

        {/* Response Time Chart */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Response Time History</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="responseTime"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                name="Response Time (ms)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Check Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Service Configuration */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Service Configuration</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{service.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Base URL</span>
                <span className="font-medium truncate max-w-xs">{service.baseUrl}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Health Path</span>
                <span className="font-medium">{service.probePath}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Expected Status</span>
                <span className="font-medium">{service.expectedHttpStatus}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Timeout</span>
                <span className="font-medium">{service.timeoutMs}ms</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Critical</span>
                <span className="font-medium">{service.isCritical ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Public</span>
                <span className="font-medium">{service.isPublic ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium">{service.isActive ? '✓ Yes' : '✗ No'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health Check History Table */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Health Checks</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Response Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    HTTP Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    DNS
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    SSL
                  </th>
                </tr>
              </thead>
              <tbody>
                {healthHistory.slice(0, 20).map((check, idx) => {
                  const checkStatusInfo = statusConfig[check.status];
                  const CheckIcon = checkStatusInfo.icon;
                  
                  return (
                    <tr key={idx} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">{formatDate(check.checkedAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <CheckIcon className={`w-4 h-4 ${checkStatusInfo.color}`} />
                          <span className="text-sm font-medium">{check.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {check.responseTimeMs ? `${check.responseTimeMs}ms` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm">{check.httpStatus || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">
                        {check.dnsResolved ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {check.sslValid === null ? (
                          'N/A'
                        ) : check.sslValid ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Test Result Modal */}
      <ServiceHealthTestModal
        isOpen={isCustomTestModalOpen}
        onClose={() => setIsCustomTestModalOpen(false)}
        serviceName={`${service.name} - Custom Path Test`}
        result={customTestResult}
        testInfo={customTestInfo}
        isLoading={isTestingCustom}
      />
    </div>
  );
};
