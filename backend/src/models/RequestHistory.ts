import mongoose, { Document, Schema } from 'mongoose';

type RequestStatus = 'success' | 'failed';

interface IRequestHistory extends Document {
  projectId: mongoose.Types.ObjectId;
  modelTypeId: mongoose.Types.ObjectId;
  modelUsedId: mongoose.Types.ObjectId;
  inputPayload: Record<string, any>;
  outputPayload: Record<string, any>;
  status: RequestStatus;
  errorMessage?: string;
  latencyMs: number;
  createdAt: Date;
}

const requestHistorySchema = new Schema<IRequestHistory>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    modelTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'ModelType',
      required: true,
      index: true,
    },
    modelUsedId: {
      type: Schema.Types.ObjectId,
      ref: 'Model',
      required: true,
      index: true,
    },
    inputPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    outputPayload: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
      index: true,
    },
    errorMessage: {
      type: String,
    },
    latencyMs: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for common queries
requestHistorySchema.index({ projectId: 1, createdAt: -1 });
requestHistorySchema.index({ modelUsedId: 1, createdAt: -1 });
requestHistorySchema.index({ createdAt: -1 });

const RequestHistory = mongoose.model<IRequestHistory>(
  'RequestHistory',
  requestHistorySchema
);

export { RequestHistory, IRequestHistory, RequestStatus };
