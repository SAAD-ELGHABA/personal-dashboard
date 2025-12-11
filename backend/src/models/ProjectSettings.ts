import mongoose, { Document, Schema } from 'mongoose';

interface IProjectSettings extends Document {
  projectId: mongoose.Types.ObjectId;
  allowedModelTypes: mongoose.Types.ObjectId[];
  maxRequestSize: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSettingsSchema = new Schema<IProjectSettings>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    allowedModelTypes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ModelType',
      },
    ],
    maxRequestSize: {
      type: Number,
      required: true,
      default: 1048576, // 1MB in bytes
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

const ProjectSettings = mongoose.model<IProjectSettings>(
  'ProjectSettings',
  projectSettingsSchema
);

export { ProjectSettings, IProjectSettings };
