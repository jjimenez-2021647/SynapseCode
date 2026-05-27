export const planLimits = {
  FREE: {
    maxActiveRooms: 3,
    maxUsersPerRoom: 5,
    codeExecutionsLimit: 50,
    chatHistoryLimit: 100,
    aiExplanationsLimit: 10,
    fullVersionHistory: false,
    priorityExecution: false,
    adminPanel: false,
    analyticsPerStudent: false,
    customBranding: false,
    dedicatedSupport: false,
  },
  PRO: {
    maxActiveRooms: null,
    maxUsersPerRoom: 20,
    codeExecutionsLimit: null,
    chatHistoryLimit: null,
    aiExplanationsLimit: 20,
    fullVersionHistory: true,
    priorityExecution: true,
    adminPanel: false,
    analyticsPerStudent: false,
    customBranding: false,
    dedicatedSupport: false,
  },
  ORG: {
    maxActiveRooms: null,
    maxUsersPerRoom: null,
    codeExecutionsLimit: null,
    chatHistoryLimit: null,
    aiExplanationsLimit: null,
    fullVersionHistory: true,
    priorityExecution: true,
    adminPanel: true,
    analyticsPerStudent: true,
    customBranding: true,
    dedicatedSupport: true,
  },
};

export const ratingScales = {
  '0-10': { min: 0, max: 10, description: 'Escala de 0 a 10' },
  '0-15': { min: 0, max: 15, description: 'Escala de 0 a 15' },
  '0-100%': { min: 0, max: 100, description: 'Escala de 0 a 100%' },
};

export const subscriptionStatus = {
  ACTIVE: 'active',
  PENDING_PAYMENT: 'pending_payment',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const professorApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export default {
  planLimits,
  ratingScales,
  subscriptionStatus,
  professorApprovalStatus,
};
