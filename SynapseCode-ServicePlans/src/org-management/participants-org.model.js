/**
 * Modelo de Participantes ORG
 * Almacena números de carnet de usuarios autorizados para un plan ORG
 * Los usuarios deben ingresar con su número de carnet, no con cuenta personal
 */

import mongoose from 'mongoose';

const ParticipantsORGSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      indexed: true,
      description: 'Referencia a la suscripción ORG'
    },
    carnetNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      description: 'Número de carnet único del estudiante'
    },
    studentEmail: {
      type: String,
      lowercase: true,
      trim: true,
      description: 'Email del estudiante (opcional, para invitaciones)'
    },
    studentName: {
      type: String,
      trim: true,
      description: 'Nombre del estudiante (opcional)'
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'REMOVED'],
      default: 'PENDING',
      description: 'PENDING: Invitado pero no ha ingresado; ACTIVE: Ya ingresó; INACTIVE: Inactivo; REMOVED: Removido'
    },
    registeredAt: {
      type: Date,
      description: 'Fecha y hora cuando el estudiante primero ingresó'
    },
    lastAccessAt: {
      type: Date,
      description: 'Última vez que accedió al sistema'
    },
    invitationSentAt: {
      type: Date,
      description: 'Cuándo se envió la invitación'
    },
    confirmationEmailSentAt: {
      type: Date,
      description: 'Cuándo se envió email de confirmación de ingreso'
    },
    notes: {
      type: String,
      trim: true,
      description: 'Notas del profesor/contractante sobre el estudiante'
    },
    linkedUserId: {
      type: String,
      description: 'ID del usuario de AuthService cuando se registra'
    }
  },
  {
    timestamps: true,
    collection: 'participants_org'
  }
);

// Índice compuesto para evitar duplicados (carnet + subscriptionId)
ParticipantsORGSchema.index({ carnetNumber: 1, subscriptionId: 1 }, { unique: true });

// Índice para búsquedas por estado
ParticipantsORGSchema.index({ subscriptionId: 1, status: 1 });

// Índice para búsquedas por carnet
ParticipantsORGSchema.index({ carnetNumber: 1 });

export default mongoose.model('ParticipantsORG', ParticipantsORGSchema);
