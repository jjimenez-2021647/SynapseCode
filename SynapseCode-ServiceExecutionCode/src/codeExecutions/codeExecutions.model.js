'use strict';
import { Schema, model } from 'mongoose';
const EXECUTION_LANGUAGES = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'HTML_CSS', 'CSHARP'];
const EXECUTION_STATUS = ['EXITOSO', 'ERROR_COMPILACION', 'ERROR_RUNTIME', 'TIMEOUT', 'MEMORIA_EXCEDIDA'];
const CodeExecutionSchema = new Schema(
    {
        roomId: { type: Schema.Types.ObjectId, required: true },
        fileId: { type: Schema.Types.ObjectId, required: true },
        userId: { type: String, required: true, trim: true },
        language: { type: String, required: true, enum: EXECUTION_LANGUAGES, uppercase: true },
        executedCode: { type: String, required: true, maxlength: 5000 },
        input: { type: String, default: '' },
        output: { type: String, default: '' },
        errors: { type: String, default: '' },
        executionTimeMs: { type: Number, min: 0, max: 5000 },
        usedMemoryKb: { type: Number, required: true, default: 0, min: 0, max: 131072 },
        executionStatus: { type: String, required: true, enum: EXECUTION_STATUS, uppercase: true },
        executedAt: { type: Date, required: true, default: Date.now },
    },
    { versionKey: false }
);
CodeExecutionSchema.index({ roomId: 1, executedAt: -1 });
CodeExecutionSchema.index({ fileId: 1 });
CodeExecutionSchema.index({ userId: 1 });
export default model('CodeExecution', CodeExecutionSchema);