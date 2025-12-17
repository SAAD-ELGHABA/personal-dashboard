import React, { useState } from 'react';
import { RefreshCw, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface TokenRegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<string>;
  projectName: string;
}

export const TokenRegenerateModal: React.FC<TokenRegenerateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsRegenerating(true);
      const token = await onConfirm();
      setNewToken(token);
    } catch (error) {
      console.error('Failed to regenerate token:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setNewToken(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-lg w-full border border-border">
        {!newToken ? (
          // Confirmation Step
          <>
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Regenerate API Token
                </h2>
              </div>
            </div>            <div className="p-6 space-y-4">
              <p className="text-muted-foreground">
                You are about to regenerate the API token for{' '}
                <strong className="text-foreground">{projectName}</strong>.
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">⚠️ Warning</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                  <li>The old token will be immediately invalidated</li>
                  <li>All services using the old token will stop working</li>
                  <li>You must update the token in all your applications</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                Make sure you have a plan to update the token in all locations where it's currently
                being used.
              </p>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isRegenerating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleConfirm}
                disabled={isRegenerating}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Token
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          // Success Step
          <>
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Token Regenerated Successfully
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                  Your new API token has been generated. Copy it now - it won't be shown again!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground break-all">
                    {newToken}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">📝 Next Steps</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  <li>Copy the token to a secure location</li>
                  <li>Update your services and applications with the new token</li>
                  <li>Test that everything works with the new token</li>
                  <li>Remove the old token from your environment variables/secrets</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30">
              <Button
                type="button"
                variant="default"
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
