import { useState, useEffect } from 'react';
import { Plus, Activity, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api';
import { ServiceCard } from './ServiceCard';
import { ServiceFormModal } from './ServiceFormModal';
import { ServiceHealthTestModal } from './ServiceHealthTestModal';
import { Button } from './ui/Button';
import type { Service, CreateServiceDTO, UpdateServiceDTO, Project } from '../types';

interface ProjectServicesViewProps {
  project: Project;
  onBack: () => void;
}

export const ProjectServicesView = ({ project, onBack }: ProjectServicesViewProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingService, setTestingService] = useState<Service | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testInfo, setTestInfo] = useState<any>(null);
  const [isTestingHealth, setIsTestingHealth] = useState(false);

  useEffect(() => {
    loadServices();
    
    // Refresh services every 30 seconds
    const interval = setInterval(loadServices, 30000);
    return () => clearInterval(interval);
  }, [project._id]);

  const loadServices = async () => {
    try {
      const data = await apiService.getProjectServices(project._id);
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (data: CreateServiceDTO | UpdateServiceDTO) => {
    if ('projectId' in data) {
      await apiService.createService(data as CreateServiceDTO);
    }
    await loadServices();
  };

  const handleUpdateService = async (data: CreateServiceDTO | UpdateServiceDTO) => {
    if (selectedService) {
      await apiService.updateService(selectedService._id, data as UpdateServiceDTO);
      await loadServices();
    }
  };

  const handleDeleteService = async (service: Service) => {
    try {
      await apiService.deleteService(service._id);
      await loadServices();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedService(undefined);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(undefined);
  };

  const handleTestHealth = async (service: Service) => {
    setTestingService(service);
    setIsTestModalOpen(true);
    setIsTestingHealth(true);
    setTestResult(null);
    setTestInfo(null);

    try {
      const response = await apiService.testServiceHealth(service._id);
      setTestResult(response.data);
      setTestInfo(response.testInfo);
      await loadServices(); // Refresh to show updated health
    } catch (error) {
      console.error('Failed to test service health:', error);
      setTestResult({
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
      setIsTestingHealth(false);
    }
  };

  const closeTestModal = () => {
    setIsTestModalOpen(false);
    setTestingService(null);
    setTestResult(null);
    setTestInfo(null);
  };

  // Calculate project health
  const projectHealth = () => {
    if (services.length === 0) return { status: 'UNKNOWN', color: 'text-gray-600', bg: 'bg-gray-100' };
    
    const criticalServices = services.filter(s => s.isCritical);
    const hasCriticalDown = criticalServices.some(s => s.latestHealth?.status === 'DOWN');
    const hasCriticalDegraded = criticalServices.some(s => s.latestHealth?.status === 'DEGRADED');
    const hasAnyDown = services.some(s => s.latestHealth?.status === 'DOWN');
    
    if (hasCriticalDown) {
      return { status: 'DOWN', color: 'text-red-600', bg: 'bg-red-100' };
    }
    if (hasCriticalDegraded || hasAnyDown) {
      return { status: 'DEGRADED', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
    return { status: 'UP', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const health = projectHealth();

  const stats = {
    total: services.length,
    up: services.filter(s => s.latestHealth?.status === 'UP').length,
    degraded: services.filter(s => s.latestHealth?.status === 'DEGRADED').length,
    down: services.filter(s => s.latestHealth?.status === 'DOWN').length,
    critical: services.filter(s => s.isCritical).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.url}</p>
          </div>
        </div>
        <Button
          onClick={openCreateModal}
          className="flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Service</span>
        </Button>
      </div>

      {/* Project Health Overview */}
      <div className="bg-card rounded-lg shadow-md p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Project Health</h2>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${health.bg}`}>
            <Activity className={`w-5 h-5 ${health.color}`} />
            <span className={`font-semibold ${health.color}`}>{health.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Services</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.up}</p>
            <p className="text-sm text-gray-600">Operational</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats.degraded}</p>
            <p className="text-sm text-gray-600">Degraded</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats.down}</p>
            <p className="text-sm text-gray-600">Down</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.critical}</p>
            <p className="text-sm text-gray-600">Critical</p>
          </div>
        </div>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-card rounded-lg shadow-md p-12 text-center border border-border">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Services Yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first service to start monitoring your microservices architecture
          </p>
          <Button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add First Service</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              onEdit={openEditModal}
              onDelete={(s) => setDeleteConfirm(s)}
              onClick={() => {/* Could navigate to service details */}}
              onTestHealth={handleTestHealth}
            />
          ))}
        </div>
      )}

      {/* Service Form Modal */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={selectedService ? handleUpdateService : handleCreateService}
        service={selectedService}
        projectId={project._id}
      />

      {/* Health Test Modal */}
      <ServiceHealthTestModal
        isOpen={isTestModalOpen}
        onClose={closeTestModal}
        serviceName={testingService?.name || ''}
        result={testResult}
        testInfo={testInfo}
        isLoading={isTestingHealth}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
            <h3 className="text-xl font-bold mb-4">Delete Service</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This will also
              delete all monitoring data, health checks, and statistics for this service.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteService(deleteConfirm)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
