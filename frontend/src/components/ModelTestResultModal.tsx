import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface TestResult {
  success: boolean;
  data?: {
    latencyMs?: number;
    status?: string;
    message?: string;
    error?: string;
    timestamp?: string;
  };
}

interface ModelTestResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult | null;
  modelName: string;
}

export const ModelTestResultModal: React.FC<ModelTestResultModalProps> = ({
  isOpen,
  onClose,
  result,
  modelName,
}) => {
  if (!result) return null;

  const isSuccess = result.success && !result.data?.error;
  const latency = result.data?.latencyMs;

  const getLatencyColor = (ms?: number) => {
    if (!ms) return 'text-muted-foreground';
    if (ms < 500) return 'text-green-600 dark:text-green-400';
    if (ms < 1500) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getLatencyLabel = (ms?: number) => {
    if (!ms) return 'Unknown';
    if (ms < 500) return 'Excellent';
    if (ms < 1500) return 'Good';
    if (ms < 3000) return 'Fair';
    return 'Poor';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connection Test Results" size="md">
      <div className="space-y-6">
        {/* Header with Status */}
        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isSuccess
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}
          >
            {isSuccess ? (
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isSuccess ? 'Connection Successful' : 'Connection Failed'}
          </h3>
          <p className="text-sm text-muted-foreground">Model: {modelName}</p>
        </div>

        {/* Test Details */}
        <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <Badge variant={isSuccess ? 'success' : 'danger'}>
              {isSuccess ? 'Healthy' : 'Unhealthy'}
            </Badge>
          </div>

          {latency !== undefined && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Latency</span>
                <span className={`text-lg font-bold ${getLatencyColor(latency)}`}>
                  {latency.toFixed(0)}ms
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Performance</span>
                <span className={`text-sm font-medium ${getLatencyColor(latency)}`}>
                  {getLatencyLabel(latency)}
                </span>
              </div>

              {/* Latency Bar */}
              <div className="space-y-1">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      latency < 500
                        ? 'bg-green-500'
                        : latency < 1500
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((latency / 3000) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0ms</span>
                  <span>Fast</span>
                  <span>3000ms</span>
                </div>
              </div>
            </>
          )}

          {result.data?.message && (
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Message</span>
              <span className="text-sm text-right max-w-[200px]">{result.data.message}</span>
            </div>
          )}

          {result.data?.error && (
            <div className="border-t border-border pt-3 mt-3">
              <span className="text-sm font-medium text-red-600 dark:text-red-400 block mb-2">
                Error Details
              </span>
              <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 p-3 rounded overflow-x-auto">
                {result.data.error}
              </pre>
            </div>
          )}

          {result.data?.timestamp && (
            <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3 mt-3">
              <span>Tested at</span>
              <span>{new Date(result.data.timestamp).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Performance Guidelines */}
        {latency !== undefined && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Performance Guidelines
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <li>• &lt; 500ms: Excellent for real-time applications</li>
              <li>• 500-1500ms: Good for most use cases</li>
              <li>• 1500-3000ms: Acceptable for batch processing</li>
              <li>• &gt; 3000ms: Consider optimization or alternatives</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
