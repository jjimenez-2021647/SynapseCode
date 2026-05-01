const errorHandler = (err, req, res, next) => {
  console.error('ERROR: Error:', err.message);

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: 'Error de validación',
      details: messages,
    });
  }

  // Errores de duplicidad en Mongoose
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'El recurso ya existe',
      field: Object.keys(err.keyValue)[0],
    });
  }

  // Errores de Git
  if (err.message.includes('already exists')) {
    return res.status(409).json({ error: 'El repositorio o remoto ya existe' });
  }
  if (err.message.includes('Authentication failed')) {
    return res.status(401).json({ error: 'Falló autenticación con GitHub (token inválido o expirado)' });
  }
  if (err.message.includes('not a git repository')) {
    return res.status(404).json({ error: 'No es un repositorio Git válido' });
  }
  if (err.message.includes('CONFLICT')) {
    return res.status(409).json({
      error: 'Hay conflictos en el merge',
      detail: err.message,
    });
  }
  if (err.message.includes('ENOENT')) {
    return res.status(404).json({ error: 'Archivo o repositorio no encontrado' });
  }
  if (err.message.includes('User token')) {
    return res.status(401).json({ error: 'Token de GitHub inválido o mal formado' });
  }
  if (err.message.includes('no such remote')) {
    return res.status(404).json({ error: 'Remoto no configurado' });
  }
  if (err.message.includes('Error en')) {
    return res.status(400).json({ error: err.message });
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
