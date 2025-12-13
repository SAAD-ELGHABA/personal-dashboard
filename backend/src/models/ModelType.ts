import mongoose, { Document, Schema } from 'mongoose';

interface IModelType extends Document {
  key: string;
  name: string;
  description: string;
  category: 'text' | 'image' | 'audio' | 'video' | 'embedding' | 'multimodal' | 'tool';
  icon?: string;
  capabilities: string[];
  isActive: boolean;
  requiresAuth: boolean;
  defaultMaxTokens?: number;
  defaultTemperature?: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const modelTypeSchema = new Schema<IModelType>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: /^[a-z0-9_-]+$/,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['text', 'image', 'audio', 'video', 'embedding', 'multimodal', 'tool'],
      required: true,
      index: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    capabilities: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    requiresAuth: {
      type: Boolean,
      default: true,
    },
    defaultMaxTokens: {
      type: Number,
      min: 1,
      max: 128000,
    },
    defaultTemperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes
modelTypeSchema.index({ category: 1, isActive: 1 });
modelTypeSchema.index({ isActive: 1, order: 1 });

const ModelType = mongoose.model<IModelType>('ModelType', modelTypeSchema);

export { ModelType, IModelType };
