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
 */
