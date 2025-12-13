import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectSettingsModal } from '../components/ProjectSettingsModal';
import { TokenDisplayModal } from '../components/TokenDisplayModal';
import { apiService } from '../services/api';
import type { Project, ModelType, ProjectSettings } from '../types';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modelTypes, setModelTypes] = useState<ModelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Selected project states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSettings, setSelectedSettings] = useState<ProjectSettings | null>(null);
  const [currentToken, setCurrentToken] = useState<string>('');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Fetch projects and model types on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsRes, modelTypesRes] = await Promise.all([
        apiService.getProjects(),
        apiService.getModelTypes(),
      ]);
      setProjects(projectsRes.data.projects);
      setModelTypes(modelTypesRes.data.modelTypes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: {
    name: string;
    url: string;
    description: string;
    modelTypesAllowed: string[];
    maxRequestSize: number;
  }) => {
    try {
      setIsSubmitting(true);
      const response = await apiService.createProject(data);
      setProjects([response.data.project, ...projects]);
      setCurrentToken(response.data.apiToken);
      setSelectedProject(response.data.project);
      setIsCreateModalOpen(false);
      setIsTokenModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create project');
      console.error('Error creating project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = async (data: {
    name: string;
    description: string;
    modelTypesAllowed: string[];
  }) => {
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);
      const response = await apiService.updateProject(selectedProject._id, data);
      setProjects(
        projects.map((p) =>
          p._id === selectedProject._id ? response.data.project : p
        )
      );
      setIsEditModalOpen(false);
      setSelectedProject(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update project');
      console.error('Error updating project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSettings = async (data: {
    allowedModelTypes?: string[];
    maxRequestSize?: number;
    isActive?: boolean;
  }) => {
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);
      const response = await apiService.updateProjectSettings(
        selectedProject._id,
        data
      );
      setSelectedSettings(response.data.settings);
      // Refresh projects to get updated data
      await fetchData();
      setIsSettingsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update settings');
      console.error('Error updating settings:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);
      await apiService.deleteProject(selectedProject._id);
      setProjects(projects.filter((p) => p._id !== selectedProject._id));
      setIsDeleteConfirmOpen(false);
      setSelectedProject(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete project');
      console.error('Error deleting project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!selectedProject) return;

    const confirmed = window.confirm(
      'Are you sure you want to regenerate the API token? The old token will be invalidated immediately.'
    );

    if (!confirmed) return;

    try {
      setIsRegenerating(true);
      const response = await apiService.regenerateApiToken(selectedProject._id);
      setCurrentToken(response.data.apiToken);
      alert('Token regenerated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to regenerate token');
      console.error('Error regenerating token:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const openSettingsModal = async (project: Project) => {
    try {
      const response = await apiService.getProject(project._id);
      setSelectedProject(response.data.project);
      setSelectedSettings(response.data.settings);
      setIsSettingsModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load project settings');
      console.error('Error loading settings:', err);
    }
  };

  const openTokenModal = (project: Project) => {
    setSelectedProject(project);
    setCurrentToken('••••••••••••••••••••••••••••••••');
    setIsTokenModalOpen(true);
  };

  const openDeleteConfirm = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage isolated workspaces for your Brain API integrations
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Project
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Projects Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first project. Projects allow you to
              isolate API access and manage permissions for different applications.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onEdit={openEditModal}
              onDelete={openDeleteConfirm}
              onSettings={openSettingsModal}
              onViewToken={openTokenModal}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        modelTypes={modelTypes}
        isLoading={isSubmitting}
      />

      {/* Edit Project Modal */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleEditProject}
        modelTypes={modelTypes}
        project={selectedProject}
        isLoading={isSubmitting}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setSelectedProject(null);
          setSelectedSettings(null);
        }}
        onSubmit={handleUpdateSettings}
        settings={selectedSettings}
        modelTypes={modelTypes}
        isLoading={isSubmitting}
      />

      {/* Token Display Modal */}
      {selectedProject && (
        <TokenDisplayModal
          isOpen={isTokenModalOpen}
          onClose={() => {
            setIsTokenModalOpen(false);
            setSelectedProject(null);
            setCurrentToken('');
          }}
          token={currentToken}
          projectName={selectedProject.name}
          onRegenerate={
            currentToken.includes('•') ? undefined : handleRegenerateToken
          }
          isRegenerating={isRegenerating}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-card text-card-foreground rounded-lg shadow-2xl p-6 border border-border">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Delete Project</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete "{selectedProject.name}"? This
                action cannot be undone and will invalidate the API token.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setSelectedProject(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteProject}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

