import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { apiService } from '../services/api';
import type { ModelType } from '../types';

export const ModelTypes: React.FC = () => {
  const [modelTypes, setModelTypes] = useState<ModelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ModelType | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    category: 'text' as 'text' | 'image' | 'audio' | 'video' | 'embedding' | 'multimodal' | 'tool',
    icon: '',
    capabilities: '',
    requiresAuth: true,
    defaultMaxTokens: 4096,
    defaultTemperature: 0.7,
    order: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchModelTypes();
  }, []);

  const fetchModelTypes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getModelTypes();
      setModelTypes(response.data.modelTypes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load model types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    setFormData({
      key: '',
      name: '',
      description: '',
      category: 'text',
      icon: '',
      capabilities: '',
      requiresAuth: true,
      defaultMaxTokens: 4096,
      defaultTemperature: 0.7,
      order: 0,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (modelType: ModelType) => {
    setEditingType(modelType);
    setFormData({
      key: modelType.key,
      name: modelType.name,
      description: modelType.description || '',
      category: modelType.category,
      icon: modelType.icon || '',
      capabilities: modelType.capabilities?.join(', ') || '',
      requiresAuth: modelType.requiresAuth,
      defaultMaxTokens: modelType.defaultMaxTokens || 4096,
      defaultTemperature: modelType.defaultTemperature || 0.7,
      order: modelType.order,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.key.trim()) {
      errors.key = 'Key is required';
    } else if (!/^[a-z0-9_-]+$/.test(formData.key)) {
      errors.key = 'Key must contain only lowercase letters, numbers, hyphens, and underscores';
    }

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (formData.defaultTemperature < 0 || formData.defaultTemperature > 2) {
      errors.defaultTemperature = 'Temperature must be between 0 and 2';
    }

    if (formData.defaultMaxTokens < 1) {
      errors.defaultMaxTokens = 'Max tokens must be at least 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const data = {
        key: formData.key.toLowerCase().trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        icon: formData.icon.trim() || undefined,
        capabilities: formData.capabilities
          .split(',')
          .map(c => c.trim())
          .filter(c => c.length > 0),
        requiresAuth: formData.requiresAuth,
        defaultMaxTokens: formData.defaultMaxTokens,
        defaultTemperature: formData.defaultTemperature,
        order: formData.order,
      };

      if (editingType) {
        await apiService.updateModelType(editingType._id, data);
      } else {
        await apiService.createModelType(data);
      }

      setIsModalOpen(false);
      fetchModelTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save model type');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model type? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteModelType(id);
      fetchModelTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete model type');
    }
  };

  const handleToggleActive = async (modelType: ModelType) => {
    try {
      await apiService.updateModelType(modelType._id, {
        isActive: !modelType.isActive,
      });
      fetchModelTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update model type');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      image: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      audio: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      video: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      embedding: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      multimodal: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      tool: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[category] || colors.text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading model types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Model Types</h1>
          <p className="text-muted-foreground mt-2">
            Define categories and templates for your AI models
          </p>
        </div>
        <Button onClick={handleCreate}>Create Model Type</Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-sm underline mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Model Types Grid */}
      {modelTypes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">No model types found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first model type to get started
              </p>
              <Button onClick={handleCreate}>Create Model Type</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modelTypes.map((modelType) => (
            <Card key={modelType._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {modelType.icon && <span className="text-2xl">{modelType.icon}</span>}
                      <CardTitle className="text-lg">{modelType.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={modelType.isActive ? 'success' : 'secondary'}>
                        {modelType.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className={`text-xs px-2 py-1 rounded-md ${getCategoryColor(modelType.category)}`}>
                        {modelType.category}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{modelType.description}</p>

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Key:</span>
                    <code className="text-xs bg-secondary px-2 py-1 rounded">{modelType.key}</code>
                  </div>
                  {modelType.defaultMaxTokens && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Tokens:</span>
                      <span className="font-medium">{modelType.defaultMaxTokens}</span>
                    </div>
                  )}
                  {modelType.defaultTemperature !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Temperature:</span>
                      <span className="font-medium">{modelType.defaultTemperature}</span>
                    </div>
                  )}
                </div>

                {modelType.capabilities && modelType.capabilities.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Capabilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {modelType.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="text-xs bg-secondary/50 px-2 py-1 rounded"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(modelType)}
                    className="flex-1"
                  >
                    {modelType.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(modelType)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(modelType._id)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingType ? 'Edit Model Type' : 'Create Model Type'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Key <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="chat_bot"
                disabled={!!editingType}
              />
              {formErrors.key && (
                <p className="text-sm text-red-500 mt-1">{formErrors.key}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase, alphanumeric, hyphens, underscores only
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Chatbot"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description of this model type..."
              rows={3}
            />
            {formErrors.description && (
              <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="embedding">Embedding</option>
                <option value="multimodal">Multimodal</option>
                <option value="tool">Tool</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Icon</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="💬"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Capabilities</label>
            <Input
              value={formData.capabilities}
              onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
              placeholder="chat, completion, streaming"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated list of capabilities
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Max Tokens</label>
              <Input
                type="number"
                value={formData.defaultMaxTokens}
                onChange={(e) =>
                  setFormData({ ...formData, defaultMaxTokens: parseInt(e.target.value) || 0 })
                }
                min={1}
                max={128000}
              />
              {formErrors.defaultMaxTokens && (
                <p className="text-sm text-red-500 mt-1">{formErrors.defaultMaxTokens}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Default Temperature</label>
              <Input
                type="number"
                step="0.1"
                value={formData.defaultTemperature}
                onChange={(e) =>
                  setFormData({ ...formData, defaultTemperature: parseFloat(e.target.value) || 0 })
                }
                min={0}
                max={2}
              />
              {formErrors.defaultTemperature && (
                <p className="text-sm text-red-500 mt-1">{formErrors.defaultTemperature}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Order</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Display order (lower = first)
              </p>
            </div>

            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="requiresAuth"
                checked={formData.requiresAuth}
                onChange={(e) => setFormData({ ...formData, requiresAuth: e.target.checked })}
                className="rounded border-input"
              />
              <label htmlFor="requiresAuth" className="text-sm font-medium">
                Requires Authentication
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingType ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
