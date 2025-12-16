import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import type { Service, ServiceType, CreateServiceDTO, UpdateServiceDTO } from '../types';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceDTO | UpdateServiceDTO) => Promise<void>;
  service?: Service;
  projectId: string;
}

const serviceTypes: { value: ServiceType; label: string; description: string }[] = [
  { value: 'FRONTEND', label: 'Frontend', description: 'Web applications, landing pages' },
  { value: 'API', label: 'API', description: 'REST APIs, GraphQL endpoints' },
  { value: 'AI', label: 'AI Service', description: 'ML models, AI services' },
  { value: 'WORKER', label: 'Worker', description: 'Background jobs, queue processors' },
  { value: 'GATEWAY', label: 'Gateway', description: 'API gateways, load balancers' },
];

export const ServiceFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  service,
  projectId,
}: ServiceFormModalProps) => {
  const [formData, setFormData] = useState<CreateServiceDTO | UpdateServiceDTO>({
    projectId,
    name: '',
    type: 'API',
    baseUrl: '',
    probePath: '/health',
    expectedHttpStatus: 200,
    timeoutMs: 5000,
    isCritical: true,
    isPublic: false,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        type: service.type,
        baseUrl: service.baseUrl,
        probePath: service.probePath,
        expectedHttpStatus: service.expectedHttpStatus,
        timeoutMs: service.timeoutMs,
        isCritical: service.isCritical,
        isPublic: service.isPublic,
        isActive: service.isActive,
      });
    } else {
      setFormData({
        projectId,
        name: '',
        type: 'API',
        baseUrl: '',
        probePath: '/health',
        expectedHttpStatus: 200,
        timeoutMs: 5000,
        isCritical: true,
        isPublic: false,
        isActive: true,
      });
    }
  }, [service, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold">
            {service ? 'Edit Service' : 'Add Service'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Service Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="e.g., Main API, Frontend App"
              required
            />
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Service Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ServiceType })}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              required
            >
              {serviceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Base URL *
            </label>
            <input
              type="url"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="https://api.example.com"
              required
            />
          </div>

          {/* Probe Path */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Health Check Path
            </label>
            <input
              type="text"
              value={formData.probePath}
              onChange={(e) => setFormData({ ...formData, probePath: e.target.value })}
              className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="/health"
            />
            <p className="text-sm text-muted-foreground mt-1">
              The endpoint used for health checks
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Expected HTTP Status */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected HTTP Status
              </label>
              <input
                type="number"
                value={formData.expectedHttpStatus}
                onChange={(e) => setFormData({ ...formData, expectedHttpStatus: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                min="100"
                max="599"
              />
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={formData.timeoutMs}
                onChange={(e) => setFormData({ ...formData, timeoutMs: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                min="1000"
                step="1000"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isCritical}
                onChange={(e) => setFormData({ ...formData, isCritical: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Critical Service
                <span className="block text-xs text-gray-500">
                  Project health depends on this service
                </span>
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Public Service
                <span className="block text-xs text-gray-500">
                  Accessible from the internet
                </span>
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Active Monitoring
                <span className="block text-xs text-gray-500">
                  Enable health checks for this service
                </span>
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
