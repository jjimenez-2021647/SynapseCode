/**
 * @swagger
 * /api/v1/codeSessions:
 *   post:
 *     summary: Crear sesión de código
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sesión creada
 *   get:
 *     summary: Listar sesiones de código
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones
 *
 * /api/v1/codeSessions/{sessionId}:
 *   get:
 *     summary: Obtener sesión de código
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sesión encontrada
 *   put:
 *     summary: Actualizar sesión de código
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sesión actualizada
 *   delete:
 *     summary: Eliminar sesión de código
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sesión eliminada
 *
 * /api/v1/codeSessions/file/{fileId}:
 *   get:
 *     summary: Obtener sesiones por archivo
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sesiones del archivo
 *
 * /api/v1/codeSessions/file/{fileId}/latest:
 *   get:
 *     summary: Obtener última sesión del archivo
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Última sesión encontrada
 *
 * /api/v1/codeSessions/room/{roomId}:
 *   get:
 *     summary: Obtener sesiones por sala
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sesiones de la sala
 */
