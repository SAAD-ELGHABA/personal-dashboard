import mongoose, { Document, Schema } from 'mongoose';

type ModelStatus = 'active' | 'inactive' | 'unhealthy';

interface IModel extends Document {
  name: string;
  typeId: mongoose.Types.ObjectId;
  version: string;
  provider: string;
  endpoint: string;
  apiKey: string;
  status: ModelStatus;
  maxRequestsPerMinute: number;
  expirationDate?: Date;
  projectsAssigned: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const modelSchema = new Schema<IModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
      required: true,
      trim: true,
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
    status: {
      type: String,
      enum: ['active', 'inactive', 'unhealthy'],
      default: 'active',
      index: true,
    },
    maxRequestsPerMinute: {
      type: Number,
      required: true,
      default: 60,
    },
    expirationDate: {
      type: Date,
    },
    projectsAssigned: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
  },
  { timestamps: true }
);

// Indexes for queries
modelSchema.index({ typeId: 1, status: 1 });
modelSchema.index({ projectsAssigned: 1 });

const Model = mongoose.model<IModel>('Model', modelSchema);

export { Model, IModel, ModelStatus };
