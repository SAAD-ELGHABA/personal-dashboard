import React from 'react';
import type { Project, ProjectSettings } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface ProjectCardProps {
  project: Project;
  settings?: ProjectSettings;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onSettings: (project: Project) => void;
  onViewToken: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  settings,
  onEdit,
  onDelete,
  onSettings,
  onViewToken,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isActive = settings?.isActive ?? true;

  return (
    <Card className="hover:shadow-lg transition-shadow border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 flex items-center gap-2 text-foreground">
              {project.name}
              <Badge variant={isActive ? 'success' : 'danger'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            {project.url && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {project.url}
                </a>
              </p>
            )}
            {project.description && (
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model Types */}
        <div>
          <p className="text-sm font-medium mb-2 text-foreground">Allowed Model Types:</p>
          <div className="flex flex-wrap gap-2">
            {project.modelTypesAllowed.map((modelType) => (
              <Badge key={modelType._id} variant="secondary">
                {modelType.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* API Token Info */}
        <div className="text-sm space-y-1">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Token Status:</span>{' '}
            {project.apiToken.isActive ? (
              <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-medium">Inactive</span>
            )}
          </p>
          {project.apiToken.lastUsedAt && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Last Used:</span>{' '}
              {formatDate(project.apiToken.lastUsedAt)}
            </p>
          )}
        </div>

        {/* Settings Info */}
        {settings && (
          <div className="text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Max Request Size:</span>{' '}
              {(settings.maxRequestSize / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          <p>Created: {formatDate(project.createdAt)}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(project)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSettings(project)}
          >
            Settings
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewToken(project)}
          >
            View Token
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(project)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
