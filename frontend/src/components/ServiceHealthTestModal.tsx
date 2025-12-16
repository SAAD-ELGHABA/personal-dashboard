import { X, CheckCircle, AlertCircle, XCircle, Clock, Globe, Shield, Activity } from 'lucide-react';
import { Button } from './ui/Button';

interface HealthTestResult {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  checkedAt: string;
  responseTimeMs: number | null;
  httpStatus: number | null;
  errorMessage: string | null;
  sslValid: boolean | null;
  sslExpiry: string | null;
  dnsResolved: boolean;
}

interface TestInfo {
  testedAt: string;
  testUrl: string;
  expectedStatus: number;
  timeout: number;
}

interface ServiceHealthTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  result: HealthTestResult | null;
  testInfo: TestInfo | null;
  isLoading: boolean;
}

const statusConfig = {
  UP: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
    text: 'Healthy',
    description: 'Service is responding correctly',
  },
  DEGRADED: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    text: 'Degraded',
    description: 'Service is responding but with issues',
  },
  DOWN: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    text: 'Down',
    description: 'Service is not responding',
  },
};

export const ServiceHealthTestModal = ({
  isOpen,
  onClose,
  serviceName,
  result,
  testInfo,
  isLoading,
}: ServiceHealthTestModalProps) => {
  if (!isOpen) return null;

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const statusInfo = result ? statusConfig[result.status] : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">Health Check Test</h2>
            <p className="text-sm text-muted-foreground mt-1">{serviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Running health check...</p>
            </div>
          ) : result && testInfo ? (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <div className={`flex items-center space-x-3 px-6 py-4 rounded-lg ${statusInfo?.bg}`}>
                  {StatusIcon && <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />}
                  <div>
                    <p className={`text-xl font-bold ${statusInfo?.color}`}>
                      {statusInfo?.text}
                    </p>
                    <p className={`text-sm ${statusInfo?.color}`}>
                      {statusInfo?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Details */}
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Test Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Test URL</p>
                    <p className="text-sm font-mono bg-background px-2 py-1 rounded break-all">
                      {testInfo.testUrl}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tested At</p>
                    <p className="text-sm">{formatDate(testInfo.testedAt)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expected Status</p>
                    <p className="text-sm font-semibold">{testInfo.expectedStatus}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Timeout</p>
                    <p className="text-sm">{testInfo.timeout}ms</p>
                  </div>
                </div>
              </div>

              {/* Response Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground">Response Time</p>
                  </div>
                  <p className="text-lg font-bold">
                    {formatResponseTime(result.responseTimeMs)}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground">HTTP Status</p>
                  </div>
                  <p className="text-lg font-bold">
                    {result.httpStatus || 'N/A'}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground">DNS</p>
                  </div>
                  <p className="text-lg font-bold">
                    {result.dnsResolved ? (
                      <span className="text-green-600">✓ OK</span>
                    ) : (
                      <span className="text-red-600">✗ Failed</span>
                    )}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground">SSL</p>
                  </div>
                  <p className="text-lg font-bold">
                    {result.sslValid === null ? (
                      'N/A'
                    ) : result.sslValid ? (
                      <span className="text-green-600">✓ Valid</span>
                    ) : (
                      <span className="text-red-600">✗ Invalid</span>
                    )}
                  </p>
                </div>
              </div>

              {/* SSL Expiry */}
              {result.sslExpiry && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">SSL Certificate Expiry</p>
                  <p className="text-sm font-semibold">{formatDate(result.sslExpiry)}</p>
                </div>
              )}

              {/* Error Message */}
              {result.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 mb-1">Error Details</p>
                      <p className="text-sm text-red-700">{result.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No test results available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
