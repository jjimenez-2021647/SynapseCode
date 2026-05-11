/**
 * @swagger
 * /api/v1/codeExecutions/languages:
 *   get:
 *     summary: Obtener lenguajes soportados
 *     tags: [CodeExecutions]
 *     responses:
 *       200:
 *         description: Lista de lenguajes soportados
 *
 * /api/v1/codeExecutions/run:
 *   post:
 *     summary: Ejecutar código (Síncrono)
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *               input:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de ejecución
 *
 * /api/v1/codeExecutions/submit:
 *   post:
 *     summary: Ejecutar código (Asincrónico)
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *               input:
 *                 type: string
 *     responses:
 *       202:
 *         description: Ejecución iniciada
 *
 * /api/v1/codeExecutions/result/{token}:
 *   get:
 *     summary: Obtener resultado de ejecución
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado de la ejecución
 *
 * /api/v1/codeExecutions:
 *   post:
 *     summary: Crear registro de ejecución
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Ejecución registrada
 *   get:
 *     summary: Listar ejecuciones de código
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ejecuciones
 *
 * /api/v1/codeExecutions/{executionId}:
 *   get:
 *     summary: Obtener ejecución por ID
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ejecución encontrada
 *   delete:
 *     summary: Eliminar ejecución
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ejecución eliminada
 *
 * /api/v1/codeExecutions/file/{fileId}:
 *   get:
 *     summary: Obtener ejecuciones por archivo
 *     tags: [CodeExecutions]
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
 *         description: Ejecuciones del archivo
 *
 * /api/v1/codeExecutions/room/{roomId}:
 *   get:
 *     summary: Obtener ejecuciones por sala
 *     tags: [CodeExecutions]
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
 *         description: Ejecuciones de la sala
 *
 * /api/v1/codeExecutions/audit/executors:
 *   get:
 *     summary: Auditoría de ejecutores
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auditoría de ejecuciones
 *
 * /api/v1/codeExecutions/audit/all:
 *   get:
 *     summary: Obtener todas las auditorías de ejecución
 *     tags: [CodeExecutions, Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las auditorías de ejecución
 *       403:
 *         description: Acceso denegado (solo admin)
 *
 * /api/v1/codeExecutions/rate-limit/check:
 *   get:
 *     summary: Verificar límite de velocidad
 *     tags: [CodeExecutions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del límite de velocidad
 *
 * /api/v1/codeExecutions/file/{fileId}/all:
 *   delete:
 *     summary: Eliminar todas las ejecuciones de un archivo
 *     tags: [CodeExecutions]
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
 *         description: Todas las ejecuciones del archivo eliminadas
 *
 * /api/v1/codeExecutions/room/{roomId}/all:
 *   delete:
 *     summary: Eliminar todas las ejecuciones de una sala
 *     tags: [CodeExecutions]
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
 *         description: Todas las ejecuciones de la sala eliminadas
 */
