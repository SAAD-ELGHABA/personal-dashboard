import mongoose, { Document, Schema } from 'mongoose';

interface IProject extends Document {
  name: string;
  url: string;
  description: string;
  apiToken: mongoose.Types.ObjectId;
  modelTypesAllowed: mongoose.Types.ObjectId[];
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    apiToken: {
      type: Schema.Types.ObjectId,
      ref: 'ApiToken',
      required: true,
      unique: true,
    },
    modelTypesAllowed: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ModelType',
      },
    ],
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes
projectSchema.index({ ownerId: 1 });
projectSchema.index({ url: 1 }, { unique: true });

const Project = mongoose.model<IProject>('Project', projectSchema);

export { Project, IProject };
