import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ModelFormModal } from '../components/ModelFormModal';
import { ModelTestResultModal } from '../components/ModelTestResultModal';
import { apiService } from '../services/api';
import type { Model, ModelType } from '../types';

export const AiModels: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [modelTypes, setModelTypes] = useState<ModelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [testResultModal, setTestResultModal] = useState<{
    isOpen: boolean;
    result: any;
    modelName: string;
  }>({ isOpen: false, result: null, modelName: '' });
  const [testingModelId, setTestingModelId] = useState<string | null>(null);

  // Fetch models and model types
  useEffect(() => {
    fetchData();
  }, [selectedType, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedType !== 'all') {
        filters.typeId = selectedType;
      }
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }

      const [modelsRes, typesRes] = await Promise.all([
        apiService.getModels(filters),
        apiService.getModelTypes(),
      ]);

      setModels(modelsRes.data.models);
      setModelTypes(typesRes.data.modelTypes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingModel(null);
    setIsModalOpen(true);
  };

  const handleEdit = (model: Model) => {
    setEditingModel(model);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingModel) {
        await apiService.updateModel(editingModel._id, data);
      } else {
        await apiService.createModel(data);
      }
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save model');
      throw err;
    }
  };

  const handleDelete = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteModel(modelId);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete model');
    }
  };

  const handleToggleActive = async (model: Model) => {
    try {
      await apiService.updateModel(model._id, {
        status: model.status === 'active' ? 'inactive' : 'active',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update model');
    }
  };

  const testConnection = async (modelId: string, modelName: string) => {
    try {
      setTestingModelId(modelId);
      const result = await apiService.testModelConnection(modelId);
      
      setTestResultModal({
        isOpen: true,
        result: {
          success: result.success,
          data: {
            latencyMs: result.data?.latencyMs,
            error: result.data?.error,
            message: result.message || (result.success ? 'Connection successful' : 'Connection failed'),
            timestamp: new Date().toISOString(),
          },
        },
        modelName,
      });
      
      fetchData(); // Refresh to get updated health status
    } catch (err: any) {
      setTestResultModal({
        isOpen: true,
        result: {
          success: false,
          data: {
            error: err.response?.data?.message || err.message || 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        },
        modelName,
      });
    } finally {
      setTestingModelId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'maintenance':
        return 'warning';
      case 'unhealthy':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      openai: '🤖',
      anthropic: '🧠',
      cohere: '🔷',
      google: '🔍',
      local: '💻',
      custom: '⚙️',
    };
    return icons[provider] || '📦';
  };

  const getHealthStatusBadge = (model: Model) => {
    const health = model.healthStatus;
    
    if (!health || !health.lastCheckedAt) {
      return <Badge variant="secondary">Not Tested</Badge>;
    }

    const isRecent = new Date(health.lastCheckedAt).getTime() > Date.now() - 5 * 60 * 1000; // 5 minutes
    
    if (!isRecent) {
      return <Badge variant="warning">Outdated</Badge>;
    }

    if (health.isHealthy) {
      if (health.latencyMs < 500) {
        return <Badge variant="success">Excellent</Badge>;
      } else if (health.latencyMs < 1500) {
        return <Badge variant="success">Healthy</Badge>;
      } else {
        return <Badge variant="warning">Slow</Badge>;
      }
    }

    return <Badge variant="danger">Unhealthy</Badge>;
  };

  const getHealthTooltip = (model: Model) => {
    const health = model.healthStatus;
    
    if (!health || !health.lastCheckedAt) {
      return 'No health check data available';
    }

    const timeSince = Math.floor((Date.now() - new Date(health.lastCheckedAt).getTime()) / 1000);
    const timeStr = timeSince < 60 ? `${timeSince}s ago` : 
                    timeSince < 3600 ? `${Math.floor(timeSince / 60)}m ago` :
                    `${Math.floor(timeSince / 3600)}h ago`;

    return `Latency: ${health.latencyMs}ms | Checked: ${timeStr} | Error Rate: ${(health.errorRate * 100).toFixed(1)}%`;
  };

  if (loading && models.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">AI Models</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your AI model instances
          </p>
        </div>
        <Button onClick={handleCreate}>Add Model</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium mb-2">Model Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                {modelTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="unhealthy">Unhealthy</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {models.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">No models found</p>
              <p className="text-sm text-muted-foreground">
                {selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first model'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <Card key={model._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getProviderIcon(model.provider)}</span>
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getStatusColor(model.status) as any}>
                        {model.status}
                      </Badge>
                      <Badge variant="secondary">{model.provider}</Badge>
                      {model.isPublic && <Badge variant="secondary">Public</Badge>}
                      <span title={getHealthTooltip(model)}>
                        {getHealthStatusBadge(model)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Health Status Summary */}
                {model.healthStatus && (
                  <div className="bg-secondary/30 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Health Check</span>
                      {getHealthStatusBadge(model)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="block">Latency</span>
                        <span className="font-medium text-foreground">
                          {model.healthStatus.latencyMs}ms
                        </span>
                      </div>
                      <div>
                        <span className="block">Error Rate</span>
                        <span className="font-medium text-foreground">
                          {(model.healthStatus.errorRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {model.healthStatus.lastError && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 truncate">
                        Last error: {model.healthStatus.lastError}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{model.typeId.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="font-medium">{model.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <span className="font-medium">{model.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate Limit:</span>
                    <span className="font-medium">{model.maxRequestsPerMinute}/min</span>
                  </div>
                  {model.costPerRequest && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="font-medium">${model.costPerRequest.toFixed(4)}</span>
                    </div>
                  )}
                </div>

                {model.tags && model.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {model.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-secondary/50 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(model._id, model.name)}
                    disabled={testingModelId === model._id}
                    className="flex-1"
                  >
                    {testingModelId === model._id ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(model)}
                    className="flex-1"
                  >
                    {model.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(model)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(model._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modelTypes.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Model Types</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {modelTypes.map((type) => (
              <Card key={type._id}>
                <CardHeader>
                  <CardTitle className="text-base">{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {type.description}
                  </p>
                  <Badge variant="secondary">{type.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Model Form Modal */}
      <ModelFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        model={editingModel}
        modelTypes={modelTypes}
      />

      {/* Test Result Modal */}
      <ModelTestResultModal
        isOpen={testResultModal.isOpen}
        onClose={() => setTestResultModal({ isOpen: false, result: null, modelName: '' })}
        result={testResultModal.result}
        modelName={testResultModal.modelName}
      />
    </div>
  );
};
