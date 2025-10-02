import React, { useEffect, useState } from 'react';
import { Plus, Copy, Trash2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiService } from '../services/api';
import { formatDateTime } from '../lib/utils';
import type { ApiToken } from '../types';

export const ApiManagement: React.FC = () => {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read']);
  const [expiresIn, setExpiresIn] = useState(30);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await apiService.getApiTokens();
      setTokens(response.data.tokens);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.createApiToken(name, scopes, expiresIn);
      setNewToken(response.data.token.token || '');
      setName('');
      setScopes(['read']);
      setExpiresIn(30);
      fetchTokens();
    } catch (error) {
      console.error('Failed to create token:', error);
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;

    try {
      await apiService.revokeApiToken(id);
      fetchTokens();
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  };

  const handleCopyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading API tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage API tokens for third-party applications
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Token
        </Button>
      </div>

      {newToken && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Token Created Successfully!</CardTitle>
            <CardDescription>
              Copy this token now. You won't be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={newToken} readOnly className="font-mono text-sm" />
              <Button
                onClick={() => handleCopyToken(newToken, 'new')}
                variant="outline"
              >
                {copiedId === 'new' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              onClick={() => setNewToken(null)}
              variant="ghost"
              className="mt-3"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Token</CardTitle>
            <CardDescription>
              Generate a new token for accessing your dashboard API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateToken} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Token Name
                </label>
                <Input
                  id="name"
                  placeholder="My Application"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Scopes</label>
                <div className="flex gap-3">
                  {['read', 'write', 'admin'].map((scope) => (
                    <label key={scope} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scopes.includes(scope)}
                        onChange={() => toggleScope(scope)}
                        className="rounded border-input"
                      />
                      <span className="text-sm capitalize">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="expiresIn" className="text-sm font-medium">
                  Expires In (days)
                </label>
                <Input
                  id="expiresIn"
                  type="number"
                  min="1"
                  max="365"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Token</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Tokens</CardTitle>
          <CardDescription>
            Manage your existing API tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length > 0 ? (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{token.name}</h4>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Scopes: {token.scopes.join(', ')}</span>
                      <span>Expires: {formatDateTime(token.expiresAt)}</span>
                      {token.lastUsedAt && (
                        <span>Last used: {formatDateTime(token.lastUsedAt)}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeToken(token.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active tokens. Create one to get started.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            Available endpoints for your API tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted">
              <code className="text-sm">GET /api/stats/n8n</code>
              <p className="text-xs text-muted-foreground mt-1">
                Get n8n workflow statistics
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <code className="text-sm">GET /api/stats/portfolio</code>
              <p className="text-xs text-muted-foreground mt-1">
                Get portfolio visitor statistics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
