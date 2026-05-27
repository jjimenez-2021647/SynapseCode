import { Schema, model } from 'mongoose';

const planSchema = new Schema(
  {
    name: {
      type: String,
      enum: ['FREE', 'PRO', 'ORG'],
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    description: String,
    currency: {
      type: String,
      default: 'USD',
    },
    features: {
      maxActiveRooms: {
        type: Number,
        default: null,
      },
      maxUsersPerRoom: {
        type: Number,
        default: null,
      },
      codeExecutionsLimit: {
        type: Number,
        default: null,
      },
      maxExecutionTimeSeconds: {
        type: Number,
        default: null,
      },
      chatHistoryLimit: {
        type: Number,
        default: null,
      },
      aiExplanationsLimit: {
        type: Number,
        default: null,
      },
      fullVersionHistory: {
        type: Boolean,
        default: false,
      },
      priorityExecution: {
        type: Boolean,
        default: false,
      },
      adminPanel: {
        type: Boolean,
        default: false,
      },
      analyticsPerStudent: {
        type: Boolean,
        default: false,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      dedicatedSupport: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stripeProductId: String,
    stripePriceId: String,
  },
  {
    timestamps: true,
  }
);

export const Plan = model('Plan', planSchema);
export default Plan;
