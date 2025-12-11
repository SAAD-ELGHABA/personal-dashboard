import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { ModelType, ProjectSettings } from '../types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    allowedModelTypes?: string[];
    maxRequestSize?: number;
    isActive?: boolean;
  }) => void;
  settings: ProjectSettings | null;
  modelTypes: ModelType[];
  isLoading?: boolean;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  settings,
  modelTypes,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    allowedModelTypes: [] as string[],
    maxRequestSize: 1,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      setFormData({
        allowedModelTypes: settings.allowedModelTypes.map((mt) => mt._id),
        maxRequestSize: settings.maxRequestSize / 1024 / 1024, // Convert bytes to MB
        isActive: settings.isActive,
      });
    }
    setErrors({});
  }, [settings, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.allowedModelTypes.length === 0) {
      newErrors.modelTypes = 'Select at least one model type';
    }

    if (formData.maxRequestSize < 0.1) {
      newErrors.maxRequestSize = 'Minimum size is 0.1 MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onSubmit({
      allowedModelTypes: formData.allowedModelTypes,
      maxRequestSize: Math.round(formData.maxRequestSize * 1024 * 1024), // Convert MB to bytes
      isActive: formData.isActive,
    });
  };

  const toggleModelType = (modelTypeId: string) => {
    setFormData((prev) => {
      const isSelected = prev.allowedModelTypes.includes(modelTypeId);
      return {
        ...prev,
        allowedModelTypes: isSelected
          ? prev.allowedModelTypes.filter((id) => id !== modelTypeId)
          : [...prev.allowedModelTypes, modelTypeId],
      };
    });
  };

  if (!settings) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Settings"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Status */}
        <div className="bg-muted p-4 rounded-md border border-border">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">Project Status</p>
              <p className="text-xs text-muted-foreground">
                Inactive projects cannot accept API requests
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={formData.isActive ? 'success' : 'danger'}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-5 h-5 rounded border-input"
                disabled={isLoading}
              />
            </div>
          </label>
        </div>

        {/* Allowed Model Types */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Allowed Model Types <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-md p-3 bg-background">
            {modelTypes.map((modelType) => (
              <label
                key={modelType._id}
                className="flex items-start space-x-2 cursor-pointer hover:bg-accent p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.allowedModelTypes.includes(modelType._id)}
                  onChange={() => toggleModelType(modelType._id)}
                  className="mt-1 rounded border-input"
                  disabled={isLoading}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{modelType.name}</p>
                  {modelType.description && (
                    <p className="text-xs text-muted-foreground">
                      {modelType.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
          {errors.modelTypes && (
            <p className="text-sm text-red-500 mt-1">{errors.modelTypes}</p>
          )}
        </div>

        {/* Max Request Size */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Max Request Size (MB) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={formData.maxRequestSize}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxRequestSize: parseFloat(e.target.value) || 0,
              })
            }
            disabled={isLoading}
          />
          {errors.maxRequestSize && (
            <p className="text-sm text-red-500 mt-1">
              {errors.maxRequestSize}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Maximum payload size for API requests. Requests exceeding this size
            will be rejected.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
