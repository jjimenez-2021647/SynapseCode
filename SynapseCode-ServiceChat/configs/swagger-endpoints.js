/**
 * @swagger
 * /api/v1/chats:
 *   post:
 *     summary: Crear chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Chat creado
 *   get:
 *     summary: Listar chats
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de chats
 *
 * /api/v1/chats/batch-create:
 *   post:
 *     summary: Crear múltiples chats
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 roomId:
 *                   type: string
 *                 chatType:
 *                   type: string
 *     responses:
 *       201:
 *         description: Chats creados
 *
 * /api/v1/chats/room/{roomId}:
 *   delete:
 *     summary: Eliminar chats de una sala
 *     tags: [Chats]
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
 *         description: Chats eliminados
 *
 * /api/v1/messages:
 *   post:
 *     summary: Crear mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               chatId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mensaje creado
 *   get:
 *     summary: Listar mensajes
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *
 * /api/v1/messages/{messageId}:
 *   get:
 *     summary: Obtener mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mensaje encontrado
 *   put:
 *     summary: Editar mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mensaje actualizado
 *   delete:
 *     summary: Eliminar mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mensaje eliminado
 *
 * /api/v1/explication/file/{fileId}:
 *   get:
 *     summary: Listar explicaciones de archivo
 *     tags: [Explanations]
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
 *         description: Explicaciones encontradas
 *   post:
 *     summary: Crear explicación con IA
 *     tags: [Explanations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Explicación generada
 *
 * /api/v1/explication/{explanationId}:
 *   get:
 *     summary: Obtener explicación
 *     tags: [Explanations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: explanationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Explicación encontrada
 *   delete:
 *     summary: Eliminar explicación
 *     tags: [Explanations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: explanationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Explicación eliminada
 *
 * /api/v1/code-generation/propose:
 *   post:
 *     summary: Generar propuesta de código incremental
 *     description: Genera una propuesta de código basada en la solicitud del usuario
 *     tags: [CodeGeneration]
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
 *                 description: ID del archivo
 *               roomId:
 *                 type: string
 *                 description: ID de la sala
 *               currentCode:
 *                 type: string
 *                 description: Código actual (base)
 *               language:
 *                 type: string
 *                 default: javascript
 *               request:
 *                 type: string
 *                 description: Solicitud del usuario
 *               context:
 *                 type: string
 *                 description: Contexto adicional (opcional)
 *     responses:
 *       201:
 *         description: Propuesta generada
 *       400:
 *         description: Datos inválidos
 *
 * /api/v1/code-generation/proposal/{proposalId}:
 *   get:
 *     summary: Obtener propuesta de código
 *     tags: [CodeGeneration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Propuesta obtenida
 *       404:
 *         description: Propuesta no encontrada
 *
 * /api/v1/code-generation/proposal/{proposalId}/approve:
 *   post:
 *     summary: Aprobar propuesta de código
 *     tags: [CodeGeneration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Propuesta aprobada
 *       400:
 *         description: Propuesta ya fue procesada
 *
 * /api/v1/code-generation/proposal/{proposalId}/reject:
 *   post:
 *     summary: Rechazar propuesta de código
 *     tags: [CodeGeneration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Razón del rechazo (opcional)
 *     responses:
 *       200:
 *         description: Propuesta rechazada
 *
 * /api/v1/code-generation/proposals/file/{fileId}:
 *   get:
 *     summary: Listar propuestas de código por archivo
 *     tags: [CodeGeneration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filtrar por estado
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *         description: Filtrar por sala
 *     responses:
 *       200:
 *         description: Lista de propuestas
 */
