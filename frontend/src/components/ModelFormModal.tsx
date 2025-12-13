import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import type { Model, ModelType } from '../types';

interface ModelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  model?: Model | null;
  modelTypes: ModelType[];
}

export const ModelFormModal: React.FC<ModelFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  model,
  modelTypes,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    typeId: '',
    provider: '',
    modelId: '',
    endpoint: '',
    apiKey: '',
    description: '',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    priority: 1,
    weight: 1,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
    tags: '',
    version: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name,
        typeId: typeof model.typeId === 'string' ? model.typeId : model.typeId._id,
        provider: model.provider,
        modelId: model.modelId,
        endpoint: model.endpoint || '',
        apiKey: '', // Don't populate for security
        description: model.description || '',
        maxTokens: model.maxTokens,
        temperature: model.temperature,
        topP: model.topP || 1.0,
        frequencyPenalty: model.frequencyPenalty || 0,
        presencePenalty: model.presencePenalty || 0,
        timeout: model.timeout || 30000,
        retryAttempts: model.retryAttempts || 3,
        retryDelay: model.retryDelay || model.retryDelayMs || 1000,
        priority: model.priority || 1,
        weight: model.weight || 1,
        costPer1kInputTokens: model.costPer1kInputTokens || 0,
        costPer1kOutputTokens: model.costPer1kOutputTokens || 0,
        tags: model.tags?.join(', ') || '',
        version: model.version || '',
      });
    } else {
      // Reset form for new model
      setFormData({
        name: '',
        typeId: '',
        provider: '',
        modelId: '',
        endpoint: '',
        apiKey: '',
        description: '',
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0,
        presencePenalty: 0,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        priority: 1,
        weight: 1,
        costPer1kInputTokens: 0,
        costPer1kOutputTokens: 0,
        tags: '',
        version: '',
      });
    }
    setFormErrors({});
  }, [model, isOpen]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.typeId) errors.typeId = 'Model type is required';
    if (!formData.provider.trim()) errors.provider = 'Provider is required';
    if (!formData.modelId.trim()) errors.modelId = 'Model ID is required';
    if (!model && !formData.apiKey.trim()) errors.apiKey = 'API Key is required for new models';
    
    if (formData.temperature < 0 || formData.temperature > 2) {
      errors.temperature = 'Temperature must be between 0 and 2';
    }
    if (formData.topP < 0 || formData.topP > 1) {
      errors.topP = 'Top P must be between 0 and 1';
    }
    if (formData.maxTokens < 1) {
      errors.maxTokens = 'Max tokens must be at least 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data: any = {
        name: formData.name.trim(),
        typeId: formData.typeId,
        provider: formData.provider.trim(),
        modelId: formData.modelId.trim(),
        endpoint: formData.endpoint.trim() || undefined,
        description: formData.description.trim() || undefined,
        maxTokens: formData.maxTokens,
        temperature: formData.temperature,
        topP: formData.topP,
        frequencyPenalty: formData.frequencyPenalty,
        presencePenalty: formData.presencePenalty,
        timeout: formData.timeout,
        retryAttempts: formData.retryAttempts,
        retryDelay: formData.retryDelay,
        priority: formData.priority,
        weight: formData.weight,
        costPer1kInputTokens: formData.costPer1kInputTokens,
        costPer1kOutputTokens: formData.costPer1kOutputTokens,
        tags: formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0),
        version: formData.version.trim(),
      };

      // Only include apiKey if provided
      if (formData.apiKey.trim()) {
        data.apiKey = formData.apiKey.trim();
      }

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={model ? 'Edit Model' : 'Create Model'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="GPT-4 Turbo"
            />
            {formErrors.name && (
              <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Model Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.typeId}
              onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
            >
              <option value="">Select a type...</option>
              {modelTypes
                .filter(type => type.isActive)
                .sort((a, b) => a.order - b.order)
                .map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.icon} {type.name}
                  </option>
                ))}
            </Select>
            {formErrors.typeId && (
              <p className="text-sm text-red-500 mt-1">{formErrors.typeId}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Provider <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            >
                <option value="">Select a provider...</option>
                {
                    ['openai', 'anthropic', 'cohere', 'google', 'local', 'custom'].map((provider) => (
                        <option key={provider} value={provider}>
                            {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </option>
                    ))
                }
            </Select>
            {formErrors.provider && (
              <p className="text-sm text-red-500 mt-1">{formErrors.provider}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Model ID <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.modelId}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              placeholder="gpt-4-turbo-preview"
            />
            {formErrors.modelId && (
              <p className="text-sm text-red-500 mt-1">{formErrors.modelId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Version
            </label>
            <Input
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="1.0.0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Endpoint</label>
          <Input
            value={formData.endpoint}
            onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
            placeholder="https://api.openai.com/v1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            API Key {!model && <span className="text-red-500">*</span>}
          </label>
          <Input
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder={model ? 'Leave empty to keep existing' : 'sk-...'}
          />
          {formErrors.apiKey && (
            <p className="text-sm text-red-500 mt-1">{formErrors.apiKey}</p>
          )}
          {model && (
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to keep existing API key
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description of this model..."
            rows={2}
          />
        </div>

        {/* Model Parameters */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Model Parameters</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max Tokens</label>
              <Input
                type="number"
                value={formData.maxTokens}
                onChange={(e) =>
                  setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 0 })
                }
                min={1}
              />
              {formErrors.maxTokens && (
                <p className="text-sm text-red-500 mt-1">{formErrors.maxTokens}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Temperature</label>
              <Input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })
                }
                min={0}
                max={2}
              />
              {formErrors.temperature && (
                <p className="text-sm text-red-500 mt-1">{formErrors.temperature}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Top P</label>
              <Input
                type="number"
                step="0.1"
                value={formData.topP}
                onChange={(e) =>
                  setFormData({ ...formData, topP: parseFloat(e.target.value) || 0 })
                }
                min={0}
                max={1}
              />
              {formErrors.topP && (
                <p className="text-sm text-red-500 mt-1">{formErrors.topP}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Frequency Penalty</label>
              <Input
                type="number"
                step="0.1"
                value={formData.frequencyPenalty}
                onChange={(e) =>
                  setFormData({ ...formData, frequencyPenalty: parseFloat(e.target.value) || 0 })
                }
                min={-2}
                max={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Presence Penalty</label>
              <Input
                type="number"
                step="0.1"
                value={formData.presencePenalty}
                onChange={(e) =>
                  setFormData({ ...formData, presencePenalty: parseFloat(e.target.value) || 0 })
                }
                min={-2}
                max={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
              <Input
                type="number"
                value={formData.timeout}
                onChange={(e) =>
                  setFormData({ ...formData, timeout: parseInt(e.target.value) || 0 })
                }
                min={1000}
              />
            </div>
          </div>
        </div>

        {/* Load Balancing & Cost */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Load Balancing & Cost</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })
                }
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">Lower = higher priority</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Weight</label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })
                }
                min={1}
              />
              <p className="text-xs text-muted-foreground mt-1">For weighted balancing</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cost/1k Input</label>
              <Input
                type="number"
                step="0.0001"
                value={formData.costPer1kInputTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPer1kInputTokens: parseFloat(e.target.value) || 0,
                  })
                }
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cost/1k Output</label>
              <Input
                type="number"
                step="0.0001"
                value={formData.costPer1kOutputTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPer1kOutputTokens: parseFloat(e.target.value) || 0,
                  })
                }
                min={0}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="production, fast, cost-effective"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Comma-separated tags for filtering
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : model ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
