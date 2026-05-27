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
 *
 * /api/v1/codeSessions/file/{fileId}/version/{version}:
 *   get:
 *     summary: Obtener versión específica de sesión
 *     tags: [CodeSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Versión de sesión encontrada
 *
 * /api/v1/codeSessions/file/{fileId}/all:
 *   delete:
 *     summary: Eliminar todas las sesiones de un archivo
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
 *         description: Todas las sesiones del archivo eliminadas
 *
 * /api/v1/codeSessions/room/{roomId}/all:
 *   delete:
 *     summary: Eliminar todas las sesiones de una sala
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
 *         description: Todas las sesiones de la sala eliminadas
 *
 * /api/v1/console/start:
 *   post:
 *     summary: Iniciar consola interactiva
 *     description: Inicia una nueva consola interactiva para ejecutar comandos en tiempo real
 *     tags: [Console]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 description: Lenguaje de programación (python, nodejs, java, etc.)
 *               roomId:
 *                 type: string
 *                 description: ID de la sala donde se ejecuta la consola
 *     responses:
 *       201:
 *         description: Consola iniciada exitosamente
 *       400:
 *         description: Datos inválidos
 *
 * /api/v1/console/{consoleId}:
 *   get:
 *     summary: Obtener estado de consola
 *     tags: [Console]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de la consola
 *       404:
 *         description: Consola no encontrada
 *
 * /api/v1/console/{consoleId}/output:
 *   get:
 *     summary: Obtener salida de consola
 *     tags: [Console]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salida de la consola
 *
 * /api/v1/console/{consoleId}/input:
 *   post:
 *     summary: Enviar entrada a consola
 *     description: Envía un comando o entrada a la consola interactiva en ejecución
 *     tags: [Console]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
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
 *               input:
 *                 type: string
 *                 description: Comando o entrada a ejecutar
 *     responses:
 *       200:
 *         description: Entrada procesada
 *
 * /api/v1/console/{consoleId}/stop:
 *   post:
 *     summary: Detener consola
 *     tags: [Console]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consola detenida exitosamente
 *
 * /api/v1/console/{consoleId}/connect:
 *   post:
 *     summary: Conectarse a consola existente
 *     tags: [Console]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conectado a la consola
 *
 * /api/v1/console/{consoleId}/disconnect:
 *   post:
 *     summary: Desconectarse de consola
 *     tags: [Console]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consoleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Desconectado de la consola
 */
