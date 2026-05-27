import mongoose from 'mongoose';

const feedbackVoteSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true
        },
        commentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'commentId es requerido'],
            ref: 'FeedbackComment',
            index: true
        },
        userId: {
            type: String,
            required: [true, 'userId es requerido'],
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Índice único compuesto: un usuario solo puede votar una vez por comentario
feedbackVoteSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export default mongoose.model('FeedbackVote', feedbackVoteSchema);
