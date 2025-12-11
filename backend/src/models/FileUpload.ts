import mongoose, { Document, Schema } from 'mongoose';

interface IFileUpload extends Document {
  projectId: mongoose.Types.ObjectId;
  filename: string;
  fileUrl: string;
  parsedMetadata: Record<string, any>;
  sizeBytes: number;
  createdAt: Date;
}

const fileUploadSchema = new Schema<IFileUpload>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    parsedMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for project lookup
fileUploadSchema.index({ projectId: 1, createdAt: -1 });

const FileUpload = mongoose.model<IFileUpload>('FileUpload', fileUploadSchema);

export { FileUpload, IFileUpload };
