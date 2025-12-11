import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface TokenDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  projectName: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export const TokenDisplayModal: React.FC<TokenDisplayModalProps> = ({
  isOpen,
  onClose,
  token,
  projectName,
  onRegenerate,
  isRegenerating = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="API Token" size="md">
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>Important:</strong> Store this token securely. For security
            reasons, it cannot be retrieved again. If you lose it, you'll need
            to regenerate a new one.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Project: {projectName}
          </label>
          <div className="flex gap-2">
            <Input
              value={token}
              readOnly
              className="font-mono text-sm"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              onClick={handleCopy}
              className="whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-md p-4 border border-border">
          <p className="text-sm font-medium mb-2 text-foreground">Usage Example:</p>
          <pre className="text-xs bg-slate-900 dark:bg-slate-950 text-green-400 p-3 rounded overflow-x-auto border border-slate-700">
            {`curl -X POST https://your-api.com/run \\
  -H "x-api-token: ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"modelType": "gpt-4", "prompt": "Hello"}'`}
          </pre>
        </div>

        {onRegenerate && (
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Need a new token? Regenerating will invalidate the current token.
            </p>
            <Button
              variant="destructive"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate Token'}
            </Button>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
