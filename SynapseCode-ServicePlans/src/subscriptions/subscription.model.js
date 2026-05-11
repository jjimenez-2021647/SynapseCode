import { Schema, model } from 'mongoose';

const subscriptionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    planName: {
      type: String,
      enum: ['FREE', 'PRO', 'ORG'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending_payment', 'cancelled', 'expired'],
      default: 'active',
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: Date,
    stripeSubscriptionId: String,
    stripeCustomerId: String,
    paymentMethod: {
      type: String,
      enum: ['stripe', 'manual'],
    },
  // Para ORG: información del contractante y validación
    orgInfo: {
      contractorEmail: String,
      contractorName: String,
      institutionName: String,
      maxParticipants: Number, // Número máximo de participantes permitidos
      pendingCarnets: [String], // Carnets esperando ser procesados después del pago
      approvedProfessors: [
        {
          professorId: String,
          email: String,
          name: String,
          approvedAt: Date,
          status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
          },
        },
      ],
    },
    invoiceUrl: String,
    amountPaid: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    autoRenewal: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = model('Subscription', subscriptionSchema);
export default Subscription;
