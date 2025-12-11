import mongoose, { Document, Schema } from 'mongoose';

interface IModelType extends Document {
  key: string;
  name: string;
  description: string;
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
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const ModelType = mongoose.model<IModelType>('ModelType', modelTypeSchema);

export { ModelType, IModelType };
