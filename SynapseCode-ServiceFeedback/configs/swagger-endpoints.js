/**
 * @swagger
 * /api/v1/feedback/comments:
 *   get:
 *     summary: Listar todos los comentarios
 *     description: Obtiene un listado de comentarios ordenados por votos (descendente). Soporta búsqueda por texto, paginación y filtrado por estado.
 *     tags: [Feedback Comments]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Texto para buscar en los comentarios
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendiente, realizado]
 *         description: Filtrar por estado del comentario
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página (comienza en 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Comentarios obtenidos exitosamente
 *   post:
 *     summary: Crear un nuevo comentario
 *     description: Crea un nuevo comentario. Requiere autenticación. Estado inicial es 'pendiente'.
 *     tags: [Feedback Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 1000
 *                 description: Contenido del comentario
 *     responses:
 *       201:
 *         description: Comentario creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *
 * /api/v1/feedback/comments/{commentId}:
 *   get:
 *     summary: Obtener un comentario específico
 *     description: Obtiene los detalles de un comentario específico por su ID
 *     tags: [Feedback Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario
 *     responses:
 *       200:
 *         description: Comentario obtenido exitosamente
 *       404:
 *         description: Comentario no encontrado
 *   put:
 *     summary: Editar un comentario
 *     description: Edita el contenido de un comentario. Solo el autor puede editar dentro de 30 minutos de su creación.
 *     tags: [Feedback Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario a editar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 1000
 *                 description: Nuevo contenido del comentario
 *     responses:
 *       200:
 *         description: Comentario actualizado exitosamente
 *       400:
 *         description: Datos inválidos o tiempo de edición expirado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (no eres el autor)
 *       404:
 *         description: Comentario no encontrado
 *   delete:
 *     summary: Eliminar un comentario (Soft Delete)
 *     description: Marca un comentario como realizado. Solo el autor o un administrador puede hacerlo. El comentario no se elimina de la BD, solo cambia su estado.
 *     tags: [Feedback Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario a marcar como realizado
 *     responses:
 *       200:
 *         description: Comentario marcado como realizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (no eres el autor ni administrador)
 *       404:
 *         description: Comentario no encontrado
 *
 * /api/v1/feedback/comments/{commentId}/status:
 *   put:
 *     summary: Cambiar el estado de un comentario
 *     description: Cambia el estado de un comentario entre 'pendiente' y 'realizado'. Solo los administradores pueden realizar esta acción.
 *     tags: [Feedback Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pendiente, realizado]
 *                 description: Nuevo estado del comentario
 *     responses:
 *       200:
 *         description: Estado del comentario actualizado exitosamente
 *       400:
 *         description: Estado inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos (solo admins pueden cambiar estado)
 *       404:
 *         description: Comentario no encontrado
 *
 * /api/v1/feedback/comments/{commentId}/vote:
 *   post:
 *     summary: Votar un comentario (toggle)
 *     description: Vota un comentario. Si ya votaste, se quita el voto (toggle). Un usuario solo puede votar una vez por comentario.
 *     tags: [Feedback Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario a votar
 *     responses:
 *       200:
 *         description: Voto registrado o removido exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Comentario no encontrado
 */
