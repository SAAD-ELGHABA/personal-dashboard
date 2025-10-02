import mongoose, { Document, Schema } from 'mongoose';

type TokenScope = 'read' | 'write' | 'admin';

interface IApiToken extends Document {
  name: string;
  token: string;
  scopes: TokenScope[];
  expiresAt: Date;
  userId: mongoose.Types.ObjectId;
  lastUsedAt?: Date;
  isActive: boolean;
}

const apiTokenSchema = new Schema<IApiToken>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    scopes: [
      {
        type: String,
        enum: ['read', 'write', 'admin'],
        required: true,
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUsedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for token expiration
apiTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for user lookup
apiTokenSchema.index({ userId: 1, isActive: 1 });

const ApiToken = mongoose.model<IApiToken>('ApiToken', apiTokenSchema);

export { ApiToken, IApiToken, TokenScope };
