import mongoose from 'mongoose';

const feedbackCommentSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true
        },
        userId: {
            type: String,
            required: [true, 'userId es requerido'],
            index: true
        },
        content: {
            type: String,
            required: [true, 'El contenido del comentario es requerido'],
            minlength: [3, 'El comentario debe tener al menos 3 caracteres'],
            maxlength: [1000, 'El comentario no puede exceder 1000 caracteres'],
            trim: true
        },
        voteCount: {
            type: Number,
            default: 0,
            min: 0
        },
        status: {
            type: String,
            enum: {
                values: ['pendiente', 'realizado'],
                message: 'El estado debe ser pendiente o realizado'
            },
            default: 'pendiente',
            index: true
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Índice para búsqueda de texto
feedbackCommentSchema.index({ content: 'text' });
// Índice para ordenar por votos
feedbackCommentSchema.index({ voteCount: -1 });
// Índice para filtrar por estado
feedbackCommentSchema.index({ status: 1 });

export default mongoose.model('FeedbackComment', feedbackCommentSchema);
