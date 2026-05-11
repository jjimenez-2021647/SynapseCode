export const buildSuccessResponse = (data = null, message = 'Operación exitosa') => {
  return {
    success: true,
    message,
    data,
  };
};

export const buildErrorResponse = (message = 'Error en la operación', data = null) => {
  return {
    success: false,
    message,
    ...(data && { data }),
  };
};

export const buildPaginatedResponse = (data, totalCount, page = 1, limit = 10) => {
  return {
    success: true,
    data,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
    },
  };
};

export default {
  buildSuccessResponse,
  buildErrorResponse,
  buildPaginatedResponse,
};
