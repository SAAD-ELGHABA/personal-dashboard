import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

type ModelStatus = 'active' | 'inactive' | 'maintenance' | 'unhealthy';
type ModelProvider = 'openai' | 'anthropic' | 'cohere' | 'google' | 'local' | 'custom';
type LoadBalancingStrategy = 'round_robin' | 'least_connections' | 'weighted' | 'random';

interface IModel extends Document {
  name: string;
  typeId: mongoose.Types.ObjectId;
  version: string;
  provider: ModelProvider;
  endpoint: string;
  apiKey: string;
  encryptionIV?: string;
  status: ModelStatus;
  priority: number;
  weight: number;
  maxRequestsPerMinute: number;
  maxConcurrentRequests: number;
  timeoutSeconds: number;
  retryAttempts: number;
  retryDelayMs: number;
  costPerRequest?: number;
  expirationDate?: Date;
  tags: string[];
  metadata: Record<string, any>;
  projectsAssigned: mongoose.Types.ObjectId[];
  isPublic: boolean;
  requiresApproval: boolean;
  lastHealthCheck?: Date;
  createdAt: Date;
  updatedAt: Date;
  encryptApiKey(key: string): void;
  decryptApiKey(): string;
}

const modelSchema = new Schema<IModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    typeId: {
      type: Schema.Types.ObjectId,
      ref: 'ModelType',
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'cohere', 'google', 'local', 'custom'],
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    apiKey: {
      type: String,
      required: true,
      select: false, // Don't return by default for security
    },
    encryptionIV: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'unhealthy'],
      default: 'active',
      index: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    weight: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },
    maxRequestsPerMinute: {
      type: Number,
      required: true,
      default: 60,
      min: 1,
    },
    maxConcurrentRequests: {
      type: Number,
      default: 10,
      min: 1,
    },
    timeoutSeconds: {
      type: Number,
      default: 30,
      min: 1,
      max: 300,
    },
    retryAttempts: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
    },
    retryDelayMs: {
      type: Number,
      default: 1000,
      min: 0,
    },
    costPerRequest: {
      type: Number,
      min: 0,
    },
    expirationDate: {
      type: Date,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    projectsAssigned: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    lastHealthCheck: {
      type: Date,
      index: true,
    },
  },
  { timestamps: true }
);

// Encryption key from environment
const ENCRYPTION_KEY = process.env.MODEL_ENCRYPTION_KEY || 'default-key-change-in-production-32b';

// Method to encrypt API key
modelSchema.methods.encryptApiKey = function(key: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.substring(0, 32)),
    iv
  );
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  this.apiKey = encrypted;
  this.encryptionIV = iv.toString('hex');
};

// Method to decrypt API key
modelSchema.methods.decryptApiKey = function(): string {
  if (!this.encryptionIV) {
    return this.apiKey; // Fallback for old records
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.substring(0, 32)),
    Buffer.from(this.encryptionIV, 'hex')
  );
  let decrypted = decipher.update(this.apiKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Indexes for efficient queries
modelSchema.index({ typeId: 1, status: 1 });
modelSchema.index({ typeId: 1, status: 1, priority: -1 });
modelSchema.index({ projectsAssigned: 1 });
modelSchema.index({ provider: 1, status: 1 });
modelSchema.index({ isPublic: 1, status: 1 });
modelSchema.index({ expirationDate: 1 });
modelSchema.index({ lastHealthCheck: 1 });

const Model = mongoose.model<IModel>('Model', modelSchema);

export { Model, IModel, ModelStatus, ModelProvider, LoadBalancingStrategy };
