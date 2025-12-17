import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import type { ServicePrompt, ModelType } from '../types';

interface PromptFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    modelTypeId: string;
    name: string;
    promptText: string;
    isActive: boolean;
  }) => Promise<void>;
  modelTypes: ModelType[];
  existingPrompt?: ServicePrompt | null;
  isLoading?: boolean;
}

export const PromptFormModal: React.FC<PromptFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  modelTypes,
  existingPrompt,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    modelTypeId: '',
    name: '',
    promptText: '',
    isActive: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingPrompt) {
      setFormData({
        modelTypeId: typeof existingPrompt.modelTypeId === 'string' 
          ? existingPrompt.modelTypeId 
          : existingPrompt.modelTypeId._id,
        name: existingPrompt.name,
        promptText: existingPrompt.promptText,
        isActive: existingPrompt.isActive,
      });
    } else {
      setFormData({
        modelTypeId: '',
        name: '',
        promptText: '',
        isActive: false,
      });
    }
    setErrors({});
  }, [existingPrompt, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.modelTypeId) {
      newErrors.modelTypeId = 'Model type is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Prompt name is required';
    }

    if (!formData.promptText.trim()) {
      newErrors.promptText = 'Prompt text is required';
    }

    if (!formData.promptText.includes('{{input}}')) {
      newErrors.promptText = 'Prompt must include {{input}} placeholder';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('promptText') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.promptText;
      const newText = text.substring(0, start) + placeholder + text.substring(end);
      
      setFormData((prev) => ({ ...prev, promptText: newText }));
      
      // Set cursor position after the inserted placeholder
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
        textarea.focus();
      }, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-2xl font-bold text-foreground">
            {existingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Model Type Selection */}
          <div>
            <label htmlFor="modelTypeId" className="block text-sm font-medium text-foreground mb-2">
              Model Type *
            </label>
            <select
              id="modelTypeId"
              name="modelTypeId"
              value={formData.modelTypeId}
              onChange={handleChange}
              disabled={isLoading || !!existingPrompt}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground ${
                errors.modelTypeId ? 'border-destructive' : 'border-border'
              } ${existingPrompt ? 'bg-muted cursor-not-allowed' : ''}`}
            >
              <option value="">Select a model type</option>
              {modelTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name} ({type.key})
                </option>
              ))}
            </select>
            {errors.modelTypeId && (
              <p className="mt-1 text-sm text-red-600">{errors.modelTypeId}</p>
            )}
            {existingPrompt && (
              <p className="mt-1 text-sm text-muted-foreground">
                Model type cannot be changed after creation
              </p>
            )}
          </div>

          {/* Prompt Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Prompt Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g., Customer Support Chatbot"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground ${
                errors.name ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Prompt Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="promptText" className="block text-sm font-medium text-foreground">
                Prompt Template *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{input}}')}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  + {'{{input}}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{userName}}')}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  + {'{{userName}}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{{context}}')}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  + {'{{context}}'}
                </button>
              </div>
            </div>
            <textarea
              id="promptText"
              name="promptText"
              value={formData.promptText}
              onChange={handleChange}
              disabled={isLoading}
              rows={10}
              placeholder="You are a helpful assistant. User question: {{input}}"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground font-mono text-sm ${
                errors.promptText ? 'border-destructive' : 'border-border'
              }`}
            />
            {errors.promptText && (
              <p className="mt-1 text-sm text-red-600">{errors.promptText}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">{'{{input}}'}</code> to insert
              user input. You can add custom placeholders like{' '}
              <code className="bg-muted px-1 rounded">{'{{userName}}'}</code> and pass them
              via API options.
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              disabled={isLoading}
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-foreground">
              Set as active prompt
            </label>
          </div>
          {formData.isActive && (
            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              ⚠️ Setting this as active will deactivate any other prompts for this service and model
              type combination.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : existingPrompt ? 'Update Prompt' : 'Create Prompt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
