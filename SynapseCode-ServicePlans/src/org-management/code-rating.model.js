import { Schema, model } from 'mongoose';

const codeRatingSchema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    fileId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    ratedByProfessorId: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: String,
    rating: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          // Soporta diferentes escalas
          return v >= 0 && v <= Math.max(10, 15, 100);
        },
        message: 'Rating debe ser entre 0 y 100',
      },
    },
    ratingScale: {
      type: String,
      enum: ['0-10', '0-15', '0-100%'],
      default: '0-10',
    },
    criteria: String,
    comments: String,
    useAIForAnalysis: {
      type: Boolean,
      default: false,
    },
    aiAnalysis: {
      correctness: String,
      improvements: [String],
      bestPractices: [String],
    },
  },
  {
    timestamps: true,
  }
);

export const CodeRating = model('CodeRating', codeRatingSchema);
export default CodeRating;
