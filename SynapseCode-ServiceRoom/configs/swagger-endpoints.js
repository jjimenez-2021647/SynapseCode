/**
 * @swagger
 * /api/v1/rooms:
 *   post:
 *     summary: Crear una nueva sala
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomName:
 *                 type: string
 *               roomType:
 *                 type: string
 *               roomLanguage:
 *                 type: string
 *               maxUsers:
 *                 type: number
 *     responses:
 *       201:
 *         description: Sala creada exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *   get:
 *     summary: Listar todas las salas
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de salas
 *
 * /api/v1/rooms/code/{code}:
 *   get:
 *     summary: Obtener sala por código
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala encontrada
 *       404:
 *         description: Sala no encontrada
 *   put:
 *     summary: Actualizar sala
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala actualizada
 *   delete:
 *     summary: Eliminar sala
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala eliminada
 *
 * /api/v1/rooms/deactivate/{code}:
 *   post:
 *     summary: Desactivar/Finalizar sala
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala desactivada
 *
 * /api/v1/rooms/audit/creators:
 *   get:
 *     summary: Auditoría de creadores de salas
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auditoría de salas
 *
 * /api/v1/room-participations:
 *   post:
 *     summary: Crear participación en sala
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Participación creada
 *   get:
 *     summary: Listar participaciones
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de participaciones
 *
 * /api/v1/files:
 *   post:
 *     summary: Crear archivo
 *     description: Crea un nuevo archivo en una sala. La extensión debe ser compatible con el tipo de sala (si roomLanguage está definido).
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - fileName
 *               - fileExtension
 *             properties:
 *               roomId:
 *                 type: string
 *                 description: ID de la sala donde crear el archivo
 *               fileName:
 *                 type: string
 *                 description: Nombre del archivo (sin extensión)
 *               fileExtension:
 *                 type: string
 *                 enum: [java, py, js, jsx, html, css, cs]
 *                 description: Extensión del archivo. Si la sala tiene roomLanguage=JAVA solo permite .java; PYTHON solo .py; JAVASCRIPT permite .js/.jsx; HTML_CSS permite .html/.css; CSHARP solo .cs. Si roomLanguage es null (multilenguaje) permite todas.
 *               language:
 *                 type: string
 *                 enum: [JAVA, PYTHON, JAVASCRIPT, HTML_CSS, CSHARP]
 *                 description: Lenguaje del archivo
 *               currentCode:
 *                 type: string
 *                 description: Código inicial del archivo (opcional)
 *     responses:
 *       201:
 *         description: Archivo creado exitosamente
 *       400:
 *         description: Datos inválidos o extensión no permitida para el tipo de sala
 *       404:
 *         description: Sala no encontrada
 *   get:
 *     summary: Listar archivos
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de archivos
 *
 * /api/v1/files/{fileId}:
 *   get:
 *     summary: Obtener archivo por ID
 *     tags: [Files]
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
 *         description: Archivo encontrado
 *   put:
 *     summary: Actualizar contenido del archivo
 *     tags: [Files]
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
 *         description: Archivo actualizado
 *   delete:
 *     summary: Eliminar archivo
 *     tags: [Files]
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
 *         description: Archivo eliminado
 */
