import mongoose, { Document, Schema } from 'mongoose';

interface IProjectPrompt extends Document {
  projectId: mongoose.Types.ObjectId;
  modelTypeId: mongoose.Types.ObjectId;
  name: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

const projectPromptSchema = new Schema<IProjectPrompt>(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
      default: 0.7,
      min: 0,
      max: 2,
    },
    maxTokens: {
      type: Number,
      required: true,
      default: 1000,
      min: 1,
    },
  },
  { timestamps: true }
);

// Index for project-modelType lookup
projectPromptSchema.index({ projectId: 1, modelTypeId: 1 });

const ProjectPrompt = mongoose.model<IProjectPrompt>(
  'ProjectPrompt',
  projectPromptSchema
);

export { ProjectPrompt, IProjectPrompt };
