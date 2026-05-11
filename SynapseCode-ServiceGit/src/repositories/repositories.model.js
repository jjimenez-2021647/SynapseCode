import { Schema, model } from 'mongoose';

const RepositorySchema = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'El ID del usuario es obligatorio'],
      immutable: true,
    },
    roomId: {
      type: String,
      required: false,
      default: null,
    },
    type: {
      type: String,
      enum: ['individual', 'shared'],
      required: [true, 'El tipo de repositorio es obligatorio'],
      immutable: true,
    },
    identifier: {
      type: String,
      required: [true, 'El identificador es obligatorio'],
      immutable: true,
    },
    githubUrl: {
      type: String,
      required: false,
      default: null,
    },
    localPath: {
      type: String,
      required: [true, 'La ruta local es obligatoria'],
      immutable: true,
    },
    isInitialized: {
      type: Boolean,
      default: false,
    },
    currentBranch: {
      type: String,
      default: 'main',
    },
    lastCommit: {
      hash: String,
      message: String,
      date: Date,
    },
    totalCommits: {
      type: Number,
      default: 0,
    },
    remoteOrigin: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
RepositorySchema.index({ userId: 1, type: 1 });
RepositorySchema.index({ roomId: 1, type: 1 });
RepositorySchema.index({ type: 1, identifier: 1 }, { unique: true });

export default model('Repository', RepositorySchema);
