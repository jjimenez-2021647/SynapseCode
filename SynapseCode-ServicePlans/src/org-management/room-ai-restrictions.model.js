import { Schema, model } from 'mongoose';

const roomAIRestrictionsSchema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    professorId: {
      type: String,
      required: true,
      index: true,
    },
    aiEnabled: {
      type: Boolean,
      default: true,
    },
    reason: String,
    restrictions: {
      aiExplanations: {
        type: Boolean,
        default: true,
      },
      aiCodeSuggestions: {
        type: Boolean,
        default: true,
      },
      aiDebugging: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const RoomAIRestrictions = model('RoomAIRestrictions', roomAIRestrictionsSchema);
export default RoomAIRestrictions;
