import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import type { ModelType, Project } from '../types';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    url: string;
    description: string;
    modelTypesAllowed: string[];
    maxRequestSize: number;
  }) => void;
  modelTypes: ModelType[];
  project?: Project | null;
  isLoading?: boolean;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  modelTypes,
  project,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    modelTypesAllowed: [] as string[],
    maxRequestSize: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        url: project.url,
        description: project.description || '',
        modelTypesAllowed: project.modelTypesAllowed.map((mt) => mt._id),
        maxRequestSize: 1,
      });
    } else {
      setFormData({
        name: '',
        url: '',
        description: '',
        modelTypesAllowed: [],
        maxRequestSize: 1,
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'Project URL is required';
    } else {
      // Basic URL validation
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    if (formData.modelTypesAllowed.length === 0) {
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

    // For edit, don't send URL and maxRequestSize
    const submitData: any = {
      name: formData.name,
      description: formData.description,
      modelTypesAllowed: formData.modelTypesAllowed,
    };

    // Only include these for create
    if (!project) {
      submitData.url = formData.url;
      submitData.maxRequestSize = Math.round(formData.maxRequestSize * 1024 * 1024); // Convert MB to bytes
    }

    onSubmit(submitData);
  };

  const toggleModelType = (modelTypeId: string) => {
    setFormData((prev) => {
      const isSelected = prev.modelTypesAllowed.includes(modelTypeId);
      return {
        ...prev,
        modelTypesAllowed: isSelected
          ? prev.modelTypesAllowed.filter((id) => id !== modelTypeId)
          : [...prev.modelTypesAllowed, modelTypeId],
      };
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Edit Project' : 'Create New Project'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="My Awesome App"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Project URL */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Project URL <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.url}
            onChange={(e) =>
              setFormData({ ...formData, url: e.target.value })
            }
            placeholder="https://myapp.com"
            disabled={isLoading}
            type="url"
          />
          {errors.url && (
            <p className="text-sm text-red-500 mt-1">{errors.url}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            The URL of your project for monitoring purposes
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of your project..."
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* Model Types */}
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
                  checked={formData.modelTypesAllowed.includes(modelType._id)}
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

        {/* Max Request Size (only for new projects) */}
        {!project && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Request Size (MB)
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
              Maximum payload size for API requests (default: 1 MB)
            </p>
          </div>
        )}

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
            {isLoading ? 'Saving...' : project ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
