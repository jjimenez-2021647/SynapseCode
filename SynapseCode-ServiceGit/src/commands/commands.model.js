import { Schema, model } from 'mongoose';

const CommandSchema = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'El ID del usuario es obligatorio'],
    },
    repositoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Repository',
      required: [true, 'El ID del repositorio es obligatorio'],
    },
    command: {
      type: String,
      enum: [
        'init',
        'clone',
        'add',
        'commit',
        'push',
        'pull',
        'status',
        'log',
        'branch',
        'remote',
        'merge',
        'checkout',
        'switch',
        'amend',
        'rename-branch',
      ],
      required: [true, 'El comando es obligatorio'],
    },
    arguments: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'error'],
      default: 'pending',
    },
    result: {
      type: Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    executedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
CommandSchema.index({ userId: 1, createdAt: -1 });
CommandSchema.index({ repositoryId: 1, createdAt: -1 });
CommandSchema.index({ status: 1 });

export default model('Command', CommandSchema);
