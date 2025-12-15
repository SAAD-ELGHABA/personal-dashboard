import Service, { IService } from '../models/Service';
import ServiceHealthCheck, {
  ServiceHealthStatus,
  IServiceHealthCheck,
} from '../models/ServiceHealthCheck';
import ServiceAvailabilityStats, {
  AvailabilityPeriod,
  IServiceAvailabilityStats,
} from '../models/ServiceAvailabilityStats';
import ServicePerformanceMetrics, {
  IServicePerformanceMetrics,
} from '../models/ServicePerformanceMetrics';
import ProjectHealthSnapshot, {
  ProjectHealthStatus,
  IProjectHealthSnapshot,
} from '../models/ProjectHealthSnapshot';
import SeoReport, { ISeoReport } from '../models/SeoReport';
import SslReport, { ISslReport } from '../models/SslReport';
import DnsReport, { DnsRecordType, IDnsReport } from '../models/DnsReport';
import { MonitoringTask } from '../models/MonitoringTask';
import axios from 'axios';
import * as dns from 'dns';
import { promisify } from 'util';
import https from 'https';
import { URL } from 'url';

const dnsResolve = promisify(dns.resolve);

interface HealthCheckResult {
  status: ServiceHealthStatus;
  httpStatus: number | null;
  responseTimeMs: number | null;
  dnsResolved: boolean;
  sslValid: boolean;
  errorMessage: string | null;
}

// Perform health check for a service
export const performHealthCheck = async (
  serviceId: string
): Promise<IServiceHealthCheck> => {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new Error('Service not found');
  }

  const result: HealthCheckResult = {
    status: 'DOWN',
    httpStatus: null,
    responseTimeMs: null,
    dnsResolved: false,
    sslValid: false,
    errorMessage: null,
  };

  try {
    const url = `${service.baseUrl}${service.probePath}`;
    const startTime = Date.now();

    // Perform HTTP request
    const response = await axios.get(url, {
      timeout: service.timeoutMs,
      validateStatus: () => true, // Accept all status codes
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // We'll check SSL separately
      }),
    });

    result.responseTimeMs = Date.now() - startTime;
    result.httpStatus = response.status;
    result.dnsResolved = true;

    // Check SSL if HTTPS
    if (service.baseUrl.startsWith('https://')) {
      result.sslValid = await checkSSL(service.baseUrl);
    } else {
      result.sslValid = true; // Not applicable for HTTP
    }

    // Determine status based on HTTP status code
    if (response.status === service.expectedHttpStatus) {
      result.status = 'UP';
    } else if (response.status >= 200 && response.status < 500) {
      result.status = 'DEGRADED';
      result.errorMessage = `Expected status ${service.expectedHttpStatus}, got ${response.status}`;
    } else {
      result.status = 'DOWN';
      result.errorMessage = `HTTP ${response.status}`;
    }
  } catch (error: any) {
    result.status = 'DOWN';
    result.errorMessage = error.message;

    // Try DNS resolution separately
    try {
      const hostname = new URL(service.baseUrl).hostname;
      await dnsResolve(hostname);
      result.dnsResolved = true;
    } catch {
      result.dnsResolved = false;
      result.errorMessage = 'DNS resolution failed';
    }
  }

  // Save health check result
  const healthCheck = new ServiceHealthCheck({
    serviceId: service._id,
    ...result,
    checkedAt: new Date(),
  });

  await healthCheck.save();

  // Update monitoring task
  await updateMonitoringTask(serviceId, 'HEALTH');

  return healthCheck;
};

// Check SSL certificate validity
const checkSSL = async (baseUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const url = new URL(baseUrl);
      const options = {
        host: url.hostname,
        port: 443,
        method: 'GET',
        rejectUnauthorized: true,
      };

      const req = https.request(options, (res) => {
        resolve(true);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.end();
    } catch {
      resolve(false);
    }
  });
};

// Calculate availability statistics
export const calculateAvailabilityStats = async (
  serviceId: string,
  period: AvailabilityPeriod
): Promise<IServiceAvailabilityStats> => {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new Error('Service not found');
  }

  // Determine time range
  const now = new Date();
  let startTime = new Date();

  switch (period) {
    case '24h':
      startTime.setHours(now.getHours() - 24);
      break;
    case '7d':
      startTime.setDate(now.getDate() - 7);
      break;
    case '30d':
      startTime.setDate(now.getDate() - 30);
      break;
  }

  // Get health checks in period
  const healthChecks = await ServiceHealthCheck.find({
    serviceId,
    checkedAt: { $gte: startTime, $lte: now },
  }).sort({ checkedAt: 1 });

  if (healthChecks.length === 0) {
    // No data, assume 100% uptime
    const stats = await ServiceAvailabilityStats.findOneAndUpdate(
      { serviceId, period },
      {
        serviceId,
        period,
        uptimePercentage: 100,
        downtimeMinutes: 0,
        lastCalculatedAt: now,
      },
      { upsert: true, new: true }
    );
    return stats!;
  }

  // Calculate downtime
  let downtimeMs = 0;
  let lastCheckTime = startTime;

  for (const check of healthChecks) {
    const timeSinceLastCheck = check.checkedAt.getTime() - lastCheckTime.getTime();

    if (check.status === 'DOWN') {
      downtimeMs += timeSinceLastCheck;
    }

    lastCheckTime = check.checkedAt;
  }

  // Calculate metrics
  const totalPeriodMs = now.getTime() - startTime.getTime();
  const uptimePercentage = ((totalPeriodMs - downtimeMs) / totalPeriodMs) * 100;
  const downtimeMinutes = downtimeMs / (1000 * 60);

  // Save stats
  const stats = await ServiceAvailabilityStats.findOneAndUpdate(
    { serviceId, period },
    {
      serviceId,
      period,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      downtimeMinutes: Math.round(downtimeMinutes * 100) / 100,
      lastCalculatedAt: now,
    },
    { upsert: true, new: true }
  );

  return stats!;
};

// Calculate performance metrics
export const calculatePerformanceMetrics = async (
  serviceId: string
): Promise<IServicePerformanceMetrics> => {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new Error('Service not found');
  }

  // Get recent health checks (last hour)
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const healthChecks = await ServiceHealthCheck.find({
    serviceId,
    checkedAt: { $gte: oneHourAgo },
    responseTimeMs: { $ne: null },
  }).sort({ checkedAt: -1 });

  if (healthChecks.length === 0) {
    throw new Error('No health check data available');
  }

  // Calculate metrics
  const latencies = healthChecks
    .map((h) => h.responseTimeMs!)
    .filter((l) => l !== null)
    .sort((a, b) => a - b);

  const avgLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95LatencyMs = latencies[p95Index] || latencies[latencies.length - 1];

  const errorCount = healthChecks.filter((h) => h.status === 'DOWN').length;
  const errorRate = (errorCount / healthChecks.length) * 100;

  // Save metrics
  const metrics = new ServicePerformanceMetrics({
    serviceId,
    avgLatencyMs: Math.round(avgLatencyMs),
    p95LatencyMs,
    errorRate: Math.round(errorRate * 100) / 100,
    sampleSize: healthChecks.length,
    calculatedAt: new Date(),
  });

  await metrics.save();

  // Update monitoring task
  await updateMonitoringTask(serviceId, 'PERFORMANCE');

  return metrics;
};

// Perform SEO check
export const performSeoCheck = async (projectId: string, url: string): Promise<ISeoReport> => {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const html = response.data;

    // Extract SEO data (basic implementation)
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : null;

    const metaDescMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
    );
    const metaDescription = metaDescMatch ? metaDescMatch[1] : null;

    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;

    // Check robots.txt
    const robotsUrl = new URL('/robots.txt', url).toString();
    let hasRobotsTxt = false;
    try {
      const robotsResponse = await axios.get(robotsUrl, { timeout: 5000 });
      hasRobotsTxt = robotsResponse.status === 200;
    } catch {
      hasRobotsTxt = false;
    }

    // Check sitemap
    const sitemapUrl = new URL('/sitemap.xml', url).toString();
    let hasSitemap = false;
    try {
      const sitemapResponse = await axios.get(sitemapUrl, { timeout: 5000 });
      hasSitemap = sitemapResponse.status === 200;
    } catch {
      hasSitemap = false;
    }

    const report = new SeoReport({
      projectId,
      url,
      title,
      metaDescription,
      hasRobotsTxt,
      hasSitemap,
      canonicalUrl,
      indexable: !html.match(/<meta\s+name=["']robots["']\s+content=["'].*noindex.*["']/i),
      checkedAt: new Date(),
    });

    await report.save();
    return report;
  } catch (error: any) {
    throw new Error(`SEO check failed: ${error.message}`);
  }
};

// Perform SSL check
export const performSslCheck = async (serviceId: string): Promise<ISslReport> => {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new Error('Service not found');
  }

  if (!service.baseUrl.startsWith('https://')) {
    throw new Error('Service does not use HTTPS');
  }

  return new Promise((resolve, reject) => {
    const url = new URL(service.baseUrl);
    const options = {
      host: url.hostname,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      const cert = (res.socket as any).getPeerCertificate();

      if (!cert || Object.keys(cert).length === 0) {
        const report = new SslReport({
          serviceId,
          issuer: null,
          validFrom: null,
          validTo: null,
          isValid: false,
          checkedAt: new Date(),
        });

        report.save().then(resolve).catch(reject);
        return;
      }

      const report = new SslReport({
        serviceId,
        issuer: cert.issuer?.O || null,
        validFrom: new Date(cert.valid_from),
        validTo: new Date(cert.valid_to),
        isValid: new Date() < new Date(cert.valid_to),
        checkedAt: new Date(),
      });

      report.save().then(resolve).catch(reject);
    });

    req.on('error', () => {
      const report = new SslReport({
        serviceId,
        issuer: null,
        validFrom: null,
        validTo: null,
        isValid: false,
        checkedAt: new Date(),
      });

      report.save().then(resolve).catch(reject);
    });

    req.end();
  });
};

// Perform DNS check
export const performDnsCheck = async (serviceId: string): Promise<IDnsReport> => {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new Error('Service not found');
  }

  const hostname = new URL(service.baseUrl).hostname;
  const startTime = Date.now();

  try {
    const addresses = await dnsResolve(hostname, 'A');
    const resolutionTimeMs = Date.now() - startTime;

    const report = new DnsReport({
      serviceId,
      domain: hostname,
      resolved: true,
      resolutionTimeMs,
      recordType: 'A' as DnsRecordType,
      checkedAt: new Date(),
    });

    await report.save();

    // Update monitoring task
    await updateMonitoringTask(serviceId, 'DNS');

    return report;
  } catch (error: any) {
    const report = new DnsReport({
      serviceId,
      domain: hostname,
      resolved: false,
      resolutionTimeMs: null,
      recordType: null,
      checkedAt: new Date(),
    });

    await report.save();

    // Update monitoring task
    await updateMonitoringTask(serviceId, 'DNS');

    return report;
  }
};

// Update project health snapshot based on services
export const updateProjectHealthSnapshot = async (
  projectId: string
): Promise<IProjectHealthSnapshot> => {
  const services = await Service.find({ projectId, isActive: true });

  if (services.length === 0) {
    const snapshot = new ProjectHealthSnapshot({
      projectId,
      status: 'UP',
      reason: 'No active services',
      checkedAt: new Date(),
    });
    await snapshot.save();
    return snapshot;
  }

  // Get latest health check for each service
  const healthChecks = await Promise.all(
    services.map((service) =>
      ServiceHealthCheck.findOne({ serviceId: service._id }).sort({ checkedAt: -1 })
    )
  );

  // Determine overall project status
  let status: ProjectHealthStatus = 'UP';
  let reason = 'All services operational';

  const criticalServices = services.filter((s) => s.isCritical);
  const criticalHealthChecks = healthChecks.filter((h, i) => services[i].isCritical);

  // Check critical services
  const criticalDown = criticalHealthChecks.filter((h) => h?.status === 'DOWN');
  const criticalDegraded = criticalHealthChecks.filter((h) => h?.status === 'DEGRADED');

  if (criticalDown.length > 0) {
    status = 'DOWN';
    reason = `${criticalDown.length} critical service(s) down`;
  } else if (criticalDegraded.length > 0) {
    status = 'DEGRADED';
    reason = `${criticalDegraded.length} critical service(s) degraded`;
  } else {
    // Check non-critical services
    const nonCriticalDown = healthChecks.filter(
      (h, i) => !services[i].isCritical && h?.status === 'DOWN'
    );
    if (nonCriticalDown.length > 0) {
      status = 'DEGRADED';
      reason = `${nonCriticalDown.length} non-critical service(s) down`;
    }
  }

  const snapshot = new ProjectHealthSnapshot({
    projectId,
    status,
    reason,
    checkedAt: new Date(),
  });

  await snapshot.save();
  return snapshot;
};

// Update monitoring task after execution
const updateMonitoringTask = async (serviceId: string, taskType: string): Promise<void> => {
  const task = await MonitoringTask.findOne({ serviceId, type: taskType });

  if (task) {
    const now = new Date();
    task.lastRunAt = now;
    task.nextRunAt = new Date(now.getTime() + task.intervalSeconds * 1000);
    await task.save();
  }
};

// Get services that need monitoring
export const getServicesDueForMonitoring = async (
  taskType: string
): Promise<IService[]> => {
  const now = new Date();

  const tasks = await MonitoringTask.find({
    type: taskType,
    isActive: true,
    nextRunAt: { $lte: now },
  });

  const serviceIds = tasks.map((t) => t.serviceId);
  const services = await Service.find({
    _id: { $in: serviceIds },
    isActive: true,
  });

  return services;
};
