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
 *     summary: Obtener sala por codigo
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
 *     summary: Desactivar o finalizar sala
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
 *     summary: Auditoria de creadores de salas
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auditoria de salas
 *
 * /api/v1/room-participations:
 *   post:
 *     summary: Crear participacion en sala
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Participacion creada
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
 *     description: Crea un archivo en una sala. El nombre debe ser unico dentro de la misma carpeta. Si la sala tiene roomLanguage, la extension debe ser compatible.
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
 *                 description: ID de la sala
 *               fileName:
 *                 type: string
 *                 description: Nombre del archivo sin extension
 *               fileExtension:
 *                 type: string
 *                 enum: [java, py, js, jsx, html, css, cs]
 *               language:
 *                 type: string
 *                 enum: [JAVA, PYTHON, JAVASCRIPT, HTML_CSS, CSHARP]
 *               currentCode:
 *                 type: string
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *                 description: ID de la carpeta padre. Null o ausente para raiz.
 *     responses:
 *       201:
 *         description: Archivo creado exitosamente
 *       400:
 *         description: Datos invalidos
 *       404:
 *         description: Sala o carpeta padre no encontrada
 *       409:
 *         description: Ya existe un archivo con ese nombre en la misma carpeta
 *   get:
 *     summary: Listar archivos
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *         required: false
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
 *     summary: Actualizar archivo
 *     description: Endpoint de compatibilidad para actualizar contenido, nombre o mover el archivo de carpeta.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
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
 *               currentCode:
 *                 type: string
 *               fileName:
 *                 type: string
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Archivo actualizado
 *       409:
 *         description: Conflicto de nombre dentro de la carpeta
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
 *
 * /api/v1/files/user/files:
 *   get:
 *     summary: Obtener archivos del usuario autenticado
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de archivos del usuario
 *
 * /api/v1/files/room/{roomId}:
 *   get:
 *     summary: Obtener archivos de una sala en formato plano
 *     tags: [Files]
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
 *         description: Lista plana de archivos de la sala
 *
 * /api/v1/files/room/{roomId}/tree:
 *   get:
 *     summary: Obtener arbol de archivos y carpetas de la sala
 *     tags: [Files, Folders]
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
 *         description: Arbol de la sala
 *
 * /api/v1/files/room/{roomId}/export:
 *   get:
 *     summary: Exportar toda la sala como ZIP
 *     tags: [Files, Folders]
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
 *         description: ZIP generado correctamente
 *
 * /api/v1/files/{fileId}/content:
 *   put:
 *     summary: Actualizar contenido del archivo
 *     description: Permite actualizar contenido, nombre, extension y carpeta padre.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
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
 *               currentCode:
 *                 type: string
 *               fileName:
 *                 type: string
 *               fileExtension:
 *                 type: string
 *                 enum: [java, py, js, jsx, html, css, cs]
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Archivo actualizado
 *       409:
 *         description: Conflicto de nombre dentro de la carpeta
 *
 * /api/v1/files/{fileId}/rename:
 *   put:
 *     summary: Renombrar archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
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
 *               fileName:
 *                 type: string
 *               fileExtension:
 *                 type: string
 *                 enum: [java, py, js, jsx, html, css, cs]
 *     responses:
 *       200:
 *         description: Archivo renombrado exitosamente
 *       409:
 *         description: Conflicto de nombre dentro de la carpeta
 *
 * /api/v1/files/{fileId}/move:
 *   put:
 *     summary: Mover archivo a otra carpeta o a raiz
 *     tags: [Files, Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
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
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *                 description: ID de la carpeta destino. Null para mover a raiz.
 *     responses:
 *       200:
 *         description: Archivo movido exitosamente
 *       409:
 *         description: Ya existe un archivo con ese nombre en la carpeta destino
 *
 * /api/v1/files/{fileId}/read-only:
 *   put:
 *     summary: Alternar modo solo lectura del archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
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
 *               isReadOnly:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Modo lectura actualizado
 *
 * /api/v1/files/{fileId}/restore:
 *   put:
 *     summary: Restaurar archivo
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
 *         description: Archivo restaurado
 *
 * /api/v1/files/{fileId}/duplicate:
 *   post:
 *     summary: Duplicar archivo dentro de la misma carpeta
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
 *       201:
 *         description: Archivo duplicado
 *       409:
 *         description: El nombre duplicado ya existe en la carpeta
 *
 * /api/v1/files/{fileId}/permanent:
 *   delete:
 *     summary: Eliminar archivo permanentemente
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
 *         description: Archivo eliminado permanentemente
 *
 * /api/v1/files/reorder:
 *   post:
 *     summary: Reordenar archivos
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fileId:
 *                       type: string
 *                     displayOrder:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Archivos reordenados exitosamente
 *
 * /api/v1/folders:
 *   post:
 *     summary: Crear carpeta
 *     description: Crea una carpeta en una sala. El nombre debe ser unico dentro del mismo nivel.
 *     tags: [Folders]
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
 *               - folderName
 *             properties:
 *               roomId:
 *                 type: string
 *               folderName:
 *                 type: string
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *               displayOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Carpeta creada exitosamente
 *       409:
 *         description: Ya existe una carpeta con ese nombre en la misma ubicacion
 *
 * /api/v1/folders/room/{roomId}:
 *   get:
 *     summary: Listar carpetas de una sala
 *     tags: [Folders]
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
 *         description: Lista de carpetas
 *
 * /api/v1/folders/room/{roomId}/tree:
 *   get:
 *     summary: Obtener arbol de carpetas y archivos
 *     tags: [Folders, Files]
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
 *         description: Arbol de la sala
 *
 * /api/v1/folders/room/{roomId}/export:
 *   get:
 *     summary: Exportar toda la sala como ZIP
 *     tags: [Folders, Files]
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
 *         description: ZIP generado correctamente
 *
 * /api/v1/folders/{folderId}:
 *   get:
 *     summary: Obtener carpeta por ID
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Carpeta encontrada
 *   delete:
 *     summary: Eliminar carpeta de forma logica
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Carpeta eliminada logicamente
 *
 * /api/v1/folders/{folderId}/rename:
 *   put:
 *     summary: Renombrar carpeta
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
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
 *               folderName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Carpeta renombrada
 *       409:
 *         description: Ya existe una carpeta con ese nombre en la misma ubicacion
 *
 * /api/v1/folders/{folderId}/move:
 *   put:
 *     summary: Mover carpeta a otra carpeta o a raiz
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
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
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Carpeta movida
 *
 * /api/v1/folders/{folderId}/restore:
 *   put:
 *     summary: Restaurar carpeta y descendencia
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Carpeta restaurada
 *
 * /api/v1/folders/{folderId}/permanent:
 *   delete:
 *     summary: Eliminar carpeta permanentemente
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Carpeta eliminada permanentemente
 *
 * /api/v1/folders/{folderId}/export:
 *   get:
 *     summary: Exportar carpeta como ZIP
 *     tags: [Folders, Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ZIP generado correctamente
 *
 * /api/v1/room-participations/{participationId}:
 *   put:
 *     summary: Actualizar participacion en sala
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participacion actualizada
 *   delete:
 *     summary: Eliminar participacion
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participacion eliminada
 *
 * /api/v1/room-participations/room/{roomId}:
 *   get:
 *     summary: Obtener participaciones por sala
 *     tags: [RoomParticipations]
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
 *         description: Lista de participaciones en la sala
 *
 * /api/v1/room-participations/user/{userId}:
 *   get:
 *     summary: Obtener participaciones por usuario
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de participaciones del usuario
 *
 * /api/v1/room-participations/{participationId}/status:
 *   put:
 *     summary: Actualizar estado de participacion
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participationId
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
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Estado de participacion actualizado
 *
 * /api/v1/room-participations/{participationId}/leave:
 *   post:
 *     summary: Abandonar participacion en sala
 *     tags: [RoomParticipations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participacion abandonada
 *
 * /api/v1/rooms/{code}/files/{fileId}/changes:
 *   get:
 *     summary: Obtener cambios de archivo en sala
 *     tags: [Rooms, Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial de cambios del archivo
 */
