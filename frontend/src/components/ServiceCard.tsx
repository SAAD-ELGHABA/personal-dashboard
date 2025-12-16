import { AlertCircle, CheckCircle, Clock, Edit2, Trash2, Globe, Lock, Activity, Eye } from 'lucide-react';
import type { Service, ServiceHealthStatus } from '../types';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onClick: (service: Service) => void;
  onTestHealth: (service: Service) => void;
}

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
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    text: 'Down',
  },
};

const typeColors: Record<string, string> = {
  FRONTEND: 'bg-blue-100 text-blue-800',
  API: 'bg-green-100 text-green-800',
  AI: 'bg-purple-100 text-purple-800',
  WORKER: 'bg-orange-100 text-orange-800',
  GATEWAY: 'bg-indigo-100 text-indigo-800',
};

export const ServiceCard = ({ service, onEdit, onDelete, onClick, onTestHealth }: ServiceCardProps) => {
  const status = service.latestHealth?.status || 'DOWN';
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  return (
    <div 
      className="bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-border "
      onClick={() => onClick(service)}
    >
      {/* Header */}
      <div className="flex  flex-col gap-2 items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold">{service.name}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded ${typeColors[service.type]}`}>
              {service.type}
            </span>
            {service.isCritical && (
              <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                Critical
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center space-x-2">
            <span className="truncate max-w-md">{service.baseUrl}</span>
            {service.isPublic ? (
              <Globe className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Lock className="w-3 h-3 text-muted-foreground" />
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onTestHealth(service)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded transition-colors flex items-center space-x-1 border  hover:border-current"
            title="Test health"
          >
            <span className="text-sm">
                check health
            </span>
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(service)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded transition-colors"
            title="Edit service"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(service)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
            title="Delete service"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <Link to={`/projects/${service.projectId}/services/${service._id}`}
            title='view details'
          >
            <Button variant="secondary" size="sm" className='flex gap-2 items-center'>
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${statusInfo.bg}`}>
          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          <span className={`font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
        </div>

        {service.latestHealth && (
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatDate(service.latestHealth.checkedAt)}</span>
          </div>
        )}
      </div>

      {/* Health Details */}
      {service.latestHealth && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Response Time</p>
            <p className="text-sm font-medium">
              {formatResponseTime(service.latestHealth.responseTimeMs)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">HTTP Status</p>
            <p className="text-sm font-medium">
              {service.latestHealth.httpStatus || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">DNS Status</p>
            <p className="text-sm font-medium">
              {service.latestHealth.dnsResolved ? '✓ Resolved' : '✗ Failed'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">SSL Status</p>
            <p className="text-sm font-medium">
              {service.baseUrl.startsWith('https') 
                ? (service.latestHealth.sslValid ? '✓ Valid' : '✗ Invalid')
                : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {service.latestHealth?.errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{service.latestHealth.errorMessage}</p>
        </div>
      )}

      {/* Active Status */}
      {!service.isActive && (
        <div className="mt-4 p-3 bg-muted border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">⏸ Monitoring Paused</p>
        </div>
      )}
    </div>
  );
};
