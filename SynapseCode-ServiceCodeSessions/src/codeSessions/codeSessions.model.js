'use strict'
import { Schema, model } from 'mongoose';
const SESSION_LANGUAGES = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'HTML_CSS', 'CSHARP'];
const SAVE_TYPES = ['MANUAL', 'AUTO', 'CHECKPOINT'];
const CodeSessionSchema = new Schema(
    {
        fileId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        roomId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        language: {
            type: String,
            required: true,
            enum: SESSION_LANGUAGES,
            uppercase: true,
        },
        code: {
            type: String,
            required: true,
            default: '',
        },
        savedByUserId: {
            type: String,
            required: true,
        },
        version: {
            type: Number,
            required: true,
            min: 1,
        },
        saveType: {
            type: String,
            required: true,
            enum: SAVE_TYPES,
            default: 'MANUAL',
            uppercase: true,
        },
        savedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        wasExecuted: {
            type: Boolean,
            default: false,
        },
        executionResult: {
            output: String,
            errors: String,
            executionTimeMs: Number,
        },
    },
    { versionKey: false }
);
CodeSessionSchema.index({ fileId: 1, version: 1 });
CodeSessionSchema.index({ roomId: 1 });
CodeSessionSchema.index({ savedByUserId: 1 });
export default model('CodeSession', CodeSessionSchema);