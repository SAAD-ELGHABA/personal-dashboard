import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { PromptFormModal } from './PromptFormModal';
import { apiService } from '../services/api';
import type { ServicePrompt, ModelType } from '../types';

interface ServicePromptsProps {
  serviceId: string;
  modelTypes: ModelType[];
}

export const ServicePrompts: React.FC<ServicePromptsProps> = ({
  serviceId,
  modelTypes,
}) => {
  const [prompts, setPrompts] = useState<ServicePrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<ServicePrompt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterModelType, setFilterModelType] = useState<string>('');

  useEffect(() => {
    loadPrompts();
  }, [serviceId, filterModelType]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getServicePrompts(serviceId, filterModelType || undefined);
      setPrompts(response.data.prompts);
    } catch (error: any) {
      console.error('Failed to load prompts:', error);
      alert(error.response?.data?.message || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async (data: {
    modelTypeId: string;
    name: string;
    promptText: string;
    isActive: boolean;
  }) => {
    try {
      setIsSubmitting(true);
      await apiService.createServicePrompt(serviceId, data);
      await loadPrompts();
      setIsFormModalOpen(false);
      setSelectedPrompt(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create prompt');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePrompt = async (data: {
    modelTypeId: string;
    name: string;
    promptText: string;
    isActive: boolean;
  }) => {
    if (!selectedPrompt) return;

    try {
      setIsSubmitting(true);
      await apiService.updateServicePrompt(selectedPrompt._id, {
        name: data.name,
        promptText: data.promptText,
        isActive: data.isActive,
      });
      await loadPrompts();
      setIsFormModalOpen(false);
      setSelectedPrompt(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update prompt');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActive = async (promptId: string) => {
    if (!confirm('Set this prompt as active? This will deactivate other prompts for the same model type.')) {
      return;
    }

    try {
      await apiService.setActivePrompt(promptId);
      await loadPrompts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to set active prompt');
    }
  };

  const handleDelete = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteServicePrompt(promptId);
      await loadPrompts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete prompt');
    }
  };

  const openEditModal = (prompt: ServicePrompt) => {
    setSelectedPrompt(prompt);
    setIsFormModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedPrompt(null);
    setIsFormModalOpen(true);
  };

  const closeModal = () => {
    setIsFormModalOpen(false);
    setSelectedPrompt(null);
  };

  const getModelTypeName = (prompt: ServicePrompt): string => {
    if (typeof prompt.modelTypeId === 'string') {
      const modelType = modelTypes.find(mt => mt._id === prompt.modelTypeId);
      return modelType ? modelType.name : 'Unknown';
    }
    return prompt.modelTypeId.name;
  };

  const getModelTypeKey = (prompt: ServicePrompt): string => {
    if (typeof prompt.modelTypeId === 'string') {
      const modelType = modelTypes.find(mt => mt._id === prompt.modelTypeId);
      return modelType ? modelType.key : '';
    }
    return prompt.modelTypeId.key;
  };

  // Group prompts by model type
  const groupedPrompts = prompts.reduce((acc, prompt) => {
    const key = getModelTypeKey(prompt);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(prompt);
    return acc;
  }, {} as Record<string, ServicePrompt[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Service Prompts</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage AI prompts for different model types
          </p>
        </div>
        <Button
          variant="default"
          onClick={openCreateModal}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Prompt
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label htmlFor="filterModelType" className="text-sm font-medium text-foreground">
          Filter by Model Type:
        </label>
        <select
          id="filterModelType"
          value={filterModelType}
          onChange={(e) => setFilterModelType(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
        >
          <option value="">All Model Types</option>
          {modelTypes.map((type) => (
            <option key={type._id} value={type._id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {/* Prompts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading prompts...</p>
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed border-border">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No prompts</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {filterModelType ? 'No prompts found for this model type.' : 'Get started by creating a new prompt.'}
          </p>
          <div className="mt-6">
            <Button variant="default" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Prompt
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPrompts).map(([modelTypeKey, modelTypePrompts]) => (
            <div key={modelTypeKey} className="bg-card rounded-lg border border-border">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <h4 className="font-medium text-foreground">
                  {getModelTypeName(modelTypePrompts[0])} <span className="text-muted-foreground text-sm">({modelTypeKey})</span>
                </h4>
              </div>
              <div className="divide-y divide-border">
                {modelTypePrompts.map((prompt) => (
                  <div key={prompt._id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-foreground">{prompt.name}</h5>
                          {prompt.isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded">
                              <Check className="h-3 w-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground font-mono bg-muted p-2 rounded border border-border whitespace-pre-wrap">
                          {prompt.promptText.length > 200
                            ? `${prompt.promptText.substring(0, 200)}...`
                            : prompt.promptText}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Created: {new Date(prompt.createdAt).toLocaleDateString()}{' '}
                          {new Date(prompt.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!prompt.isActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetActive(prompt._id)}
                            className="text-xs"
                          >
                            Set Active
                          </Button>
                        )}
                        <button
                          onClick={() => openEditModal(prompt)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Edit prompt"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prompt._id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                          title="Delete prompt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <PromptFormModal
        isOpen={isFormModalOpen}
        onClose={closeModal}
        onSubmit={selectedPrompt ? handleUpdatePrompt : handleCreatePrompt}
        modelTypes={modelTypes}
        existingPrompt={selectedPrompt}
        isLoading={isSubmitting}
      />
    </div>
  );
};
