
"""Repositorio para solicitudes, préstamos y sanciones."""

from datetime import date

from db import obtener_conexion


class PrestamoRepositorio:
    """Centraliza el acceso SQL al flujo de préstamos."""

    def listar_todos(self):
        """Lista solicitudes y sus datos asociados para administración."""
        sql = """
            SELECT
                s.id AS solicitud_id,
                s.usuario_id,
                u.nombre,
                u.apellido,
                s.libro_id,
                l.titulo AS libro_titulo,
                s.estado AS estado_solicitud,
                s.fecha_solicitud,
                s.fecha_respuesta,
                s.prestamo_id,
                p.fecha_prestamo,
                p.fecha_vencimiento,
                p.fecha_devolucion,
                p.estado AS estado_prestamo,
                COALESCE(
                    (
                        SELECT SUM(sa.dias_sancion)
                        FROM sanciones sa
                        WHERE sa.prestamo_id = p.id
                          AND sa.estado <> 'cancelada'
                    ),
                    0
                ) AS dias_sancion
            FROM solicitudes_prestamo s
            JOIN usuarios u ON u.id = s.usuario_id
            JOIN libros l ON l.id = s.libro_id
            LEFT JOIN prestamos p ON p.id = s.prestamo_id
            ORDER BY s.fecha_solicitud DESC, s.id DESC
        """

        with obtener_conexion() as conexion:
            filas = conexion.execute(sql).fetchall()

        return [self._fila_a_dict(fila) for fila in filas]

    def listar_mis_prestamos(self, usuario_id):
        """Lista las solicitudes y préstamos de un usuario específico."""
        sql = """
            SELECT
                s.id AS id,
                s.id AS solicitud_id,
                p.id AS prestamo_id,
                s.usuario_id,
                s.libro_id,
                l.titulo AS libro_titulo,
                l.autor,
                CASE
                    WHEN s.estado = 'aprobado'
                        AND p.estado = 'prestado'
                        AND p.fecha_vencimiento < CURRENT_DATE
                    THEN 'vencido'
                    WHEN s.estado = 'aprobado'
                    THEN p.estado
                    ELSE s.estado
                END AS estado,
                s.fecha_solicitud,
                p.fecha_prestamo,
                p.fecha_vencimiento,
                p.fecha_devolucion
            FROM solicitudes_prestamo s
            JOIN libros l ON l.id = s.libro_id
            LEFT JOIN prestamos p ON p.id = s.prestamo_id
            WHERE s.usuario_id = %s

            UNION ALL

            SELECT
                p.id AS id,
                NULL::BIGINT AS solicitud_id,
                p.id AS prestamo_id,
                p.usuario_id,
                p.libro_id,
                l.titulo AS libro_titulo,
                l.autor,
                CASE
                    WHEN p.estado = 'prestado'
                        AND p.fecha_vencimiento < CURRENT_DATE
                    THEN 'vencido'
                    ELSE p.estado
                END AS estado,
                NULL::TIMESTAMPTZ AS fecha_solicitud,
                p.fecha_prestamo,
                p.fecha_vencimiento,
                p.fecha_devolucion
            FROM prestamos p
            JOIN libros l ON l.id = p.libro_id
            WHERE p.usuario_id = %s
              AND NOT EXISTS (
                  SELECT 1
                  FROM solicitudes_prestamo s
                  WHERE s.prestamo_id = p.id
              )

            ORDER BY fecha_solicitud DESC NULLS LAST,
                     fecha_prestamo DESC NULLS LAST,
                     id DESC
        """

        with obtener_conexion() as conexion:
            filas = conexion.execute(
                sql,
                (usuario_id, usuario_id),
            ).fetchall()

        registros = []

        for fila in filas:
            (
                identificador,
                solicitud_id,
                prestamo_id,
                usuario_id_fila,
                libro_id,
                libro_titulo,
                autor,
                estado,
                fecha_solicitud,
                fecha_prestamo,
                fecha_vencimiento,
                fecha_devolucion,
            ) = fila

            registros.append({
                "id": identificador,
                "solicitud_id": solicitud_id,
                "prestamo_id": prestamo_id,
                "usuario_id": usuario_id_fila,
                "libro_id": libro_id,
                "libro_titulo": libro_titulo,
                "titulo": libro_titulo,
                "autor": autor,
                "estado": estado,
                "fecha_solicitud": (
                    fecha_solicitud.isoformat()
                    if fecha_solicitud else None
                ),
                "fecha_prestamo": (
                    fecha_prestamo.isoformat()
                    if fecha_prestamo else None
                ),
                "fecha_vencimiento": (
                    fecha_vencimiento.isoformat()
                    if fecha_vencimiento else None
                ),
                "fecha_devolucion": (
                    fecha_devolucion.isoformat()
                    if fecha_devolucion else None
                ),
            })

        return registros

    def crear_solicitud(self, usuario_id, libro_id):
        """Crea una solicitud pendiente si el usuario puede solicitar."""
        with obtener_conexion() as conexion:
            with conexion.transaction():
                usuario = conexion.execute(
                    """
                    SELECT id
                    FROM usuarios
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (usuario_id,),
                ).fetchone()

                if usuario is None:
                    raise ValueError("El usuario no existe.")

                libro = conexion.execute(
                    """
                    SELECT id, cantidad_disponible
                    FROM libros
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (libro_id,),
                ).fetchone()

                if libro is None:
                    raise ValueError("El libro no existe.")

                if libro[1] <= 0:
                    raise ValueError(
                        "No hay ejemplares disponibles de este libro."
                    )

                sancion = conexion.execute(
                    """
                    SELECT 1
                    FROM sanciones
                    WHERE usuario_id = %s
                      AND estado = 'activa'
                      AND fecha_fin >= CURRENT_DATE
                    LIMIT 1
                    """,
                    (usuario_id,),
                ).fetchone()

                if sancion:
                    raise ValueError(
                        "No puedes solicitar libros mientras tengas "
                        "una sanción activa."
                    )

                existente = conexion.execute(
                    """
                    SELECT 1
                    FROM solicitudes_prestamo
                    WHERE usuario_id = %s
                      AND libro_id = %s
                      AND estado = 'solicitado'
                    LIMIT 1
                    """,
                    (usuario_id, libro_id),
                ).fetchone()

                if existente:
                    raise ValueError(
                        "Ya tienes una solicitud pendiente para este libro."
                    )

                prestamo_activo = conexion.execute(
                    """
                    SELECT 1
                    FROM prestamos
                    WHERE usuario_id = %s
                      AND libro_id = %s
                      AND fecha_devolucion IS NULL
                    LIMIT 1
                    """,
                    (usuario_id, libro_id),
                ).fetchone()

                if prestamo_activo:
                    raise ValueError(
                        "Ya tienes este libro prestado."
                    )

                fila = conexion.execute(
                    """
                    INSERT INTO solicitudes_prestamo (
                        usuario_id, libro_id
                    )
                    VALUES (%s, %s)
                    RETURNING id
                    """,
                    (usuario_id, libro_id),
                ).fetchone()

        return fila[0]

    def resolver_solicitud(
        self,
        solicitud_id,
        administrador_id,
        aprobar,
        fecha_prestamo=None,
        fecha_vencimiento=None,
    ):
        """Aprueba o rechaza una solicitud en una sola transacción."""
        with obtener_conexion() as conexion:
            with conexion.transaction():
                solicitud = conexion.execute(
                    """
                    SELECT
                        s.id,
                        s.usuario_id,
                        s.libro_id,
                        s.estado,
                        l.cantidad_disponible
                    FROM solicitudes_prestamo s
                    JOIN libros l ON l.id = s.libro_id
                    WHERE s.id = %s
                    FOR UPDATE OF s, l
                    """,
                    (solicitud_id,),
                ).fetchone()

                if solicitud is None:
                    raise ValueError("La solicitud no existe.")

                (
                    _,
                    usuario_id,
                    libro_id,
                    estado,
                    disponibles,
                ) = solicitud

                if estado != "solicitado":
                    raise ValueError(
                        "La solicitud ya fue resuelta."
                    )

                if not aprobar:
                    conexion.execute(
                        """
                        UPDATE solicitudes_prestamo
                        SET estado = 'rechazado',
                            fecha_respuesta = NOW(),
                            respondido_por = %s
                        WHERE id = %s
                        """,
                        (administrador_id, solicitud_id),
                    )
                    return None

                if disponibles <= 0:
                    raise ValueError(
                        "No quedan ejemplares disponibles."
                    )

                sancion = conexion.execute(
                    """
                    SELECT 1
                    FROM sanciones
                    WHERE usuario_id = %s
                      AND estado = 'activa'
                      AND fecha_fin >= CURRENT_DATE
                    LIMIT 1
                    """,
                    (usuario_id,),
                ).fetchone()

                if sancion:
                    raise ValueError(
                        "El usuario tiene una sanción activa."
                    )

                fecha_prestamo = fecha_prestamo or date.today()
                if fecha_vencimiento is None:
                    raise ValueError(
                        "Debes indicar la fecha de vencimiento."
                    )

                if fecha_vencimiento < fecha_prestamo:
                    raise ValueError(
                        "El vencimiento no puede ser anterior al préstamo."
                    )

                fila = conexion.execute(
                    """
                    INSERT INTO prestamos (
                        usuario_id,
                        libro_id,
                        fecha_prestamo,
                        fecha_vencimiento,
                        estado
                    )
                    VALUES (%s, %s, %s, %s, 'prestado')
                    RETURNING id
                    """,
                    (
                        usuario_id,
                        libro_id,
                        fecha_prestamo,
                        fecha_vencimiento,
                    ),
                ).fetchone()

                prestamo_id = fila[0]

                conexion.execute(
                    """
                    UPDATE libros
                    SET cantidad_disponible = cantidad_disponible - 1
                    WHERE id = %s
                    """,
                    (libro_id,),
                )

                conexion.execute(
                    """
                    UPDATE solicitudes_prestamo
                    SET estado = 'aprobado',
                        fecha_respuesta = NOW(),
                        respondido_por = %s,
                        prestamo_id = %s
                    WHERE id = %s
                    """,
                    (
                        administrador_id,
                        prestamo_id,
                        solicitud_id,
                    ),
                )

        return prestamo_id

    def devolver(self, prestamo_id, fecha_devolucion=None):
        """Registra la devolución y recupera el ejemplar."""
        fecha_devolucion = fecha_devolucion or date.today()

        with obtener_conexion() as conexion:
            with conexion.transaction():
                prestamo = conexion.execute(
                    """
                    SELECT id, libro_id, fecha_prestamo,
                           fecha_devolucion, estado
                    FROM prestamos
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (prestamo_id,),
                ).fetchone()

                if prestamo is None:
                    raise ValueError("El préstamo no existe.")

                (
                    _,
                    libro_id,
                    fecha_prestamo,
                    devolucion_actual,
                    estado,
                ) = prestamo

                if devolucion_actual is not None or estado == "devuelto":
                    raise ValueError(
                        "Este préstamo ya fue devuelto."
                    )

                if fecha_devolucion < fecha_prestamo:
                    raise ValueError(
                        "La devolución no puede ser anterior al préstamo."
                    )

                conexion.execute(
                    """
                    UPDATE prestamos
                    SET fecha_devolucion = %s,
                        estado = 'devuelto'
                    WHERE id = %s
                    """,
                    (fecha_devolucion, prestamo_id),
                )

                conexion.execute(
                    """
                    UPDATE libros
                    SET cantidad_disponible = cantidad_disponible + 1
                    WHERE id = %s
                    """,
                    (libro_id,),
                )

        return True

    def crear_sancion(
        self,
        prestamo_id,
        administrador_id,
        dias_sancion,
        motivo,
    ):
        """Registra una sanción por un préstamo vencido."""
        if isinstance(dias_sancion, bool) or not isinstance(
            dias_sancion, int
        ):
            raise ValueError("Los días de sanción deben ser un entero.")

        if dias_sancion < 1:
            raise ValueError("La sanción debe durar al menos un día.")

        if not isinstance(motivo, str) or not motivo.strip():
            raise ValueError("El motivo de la sanción es obligatorio.")

        with obtener_conexion() as conexion:
            with conexion.transaction():
                prestamo = conexion.execute(
                    """
                    SELECT usuario_id, fecha_vencimiento,
                           fecha_devolucion
                    FROM prestamos
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (prestamo_id,),
                ).fetchone()

                if prestamo is None:
                    raise ValueError("El préstamo no existe.")

                usuario_id, vencimiento, devolucion = prestamo
                fecha_referencia = devolucion or date.today()
                dias_atraso = (fecha_referencia - vencimiento).days

                if dias_atraso <= 0:
                    raise ValueError(
                        "No se puede sancionar un préstamo sin retraso."
                    )

                fecha_inicio = date.today()
                fecha_fin = date.fromordinal(
                    fecha_inicio.toordinal() + dias_sancion
                )

                conexion.execute(
                    """
                    INSERT INTO sanciones (
                        usuario_id,
                        prestamo_id,
                        dias_sancion,
                        motivo,
                        fecha_inicio,
                        fecha_fin,
                        estado
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, 'activa')
                    """,
                    (
                        usuario_id,
                        prestamo_id,
                        dias_sancion,
                        motivo.strip(),
                        fecha_inicio,
                        fecha_fin,
                    ),
                )

        return True

    @staticmethod
    def _fila_a_dict(fila):
        """Convierte una fila de listado en un diccionario."""
        (
            solicitud_id,
            usuario_id,
            nombre,
            apellido,
            libro_id,
            libro_titulo,
            estado_solicitud,
            fecha_solicitud,
            fecha_respuesta,
            prestamo_id,
            fecha_prestamo,
            fecha_vencimiento,
            fecha_devolucion,
            estado_prestamo,
            dias_sancion,
        ) = fila

        estado = (
            estado_prestamo
            if estado_solicitud == "aprobado"
            else estado_solicitud
        )

        if estado == "prestado" and fecha_vencimiento < date.today():
            estado = "vencido"

        fecha_referencia = fecha_devolucion or date.today()
        dias_atraso = 0

        if fecha_vencimiento:
            dias_atraso = max(
                0, (fecha_referencia - fecha_vencimiento).days
            )

        return {
            "id": solicitud_id,
            "solicitud_id": solicitud_id,
            "usuario_id": usuario_id,
            "usuario_nombre": nombre,
            "usuario_apellido": apellido,
            "libro_id": libro_id,
            "libro_titulo": libro_titulo,
            "estado": estado,
            "fecha_solicitud": (
                fecha_solicitud.isoformat()
                if fecha_solicitud else None
            ),
            "fecha_respuesta": (
                fecha_respuesta.isoformat()
                if fecha_respuesta else None
            ),
            "prestamo_id": prestamo_id,
            "fecha_prestamo": (
                fecha_prestamo.isoformat()
                if fecha_prestamo else None
            ),
            "fecha_vencimiento": (
                fecha_vencimiento.isoformat()
                if fecha_vencimiento else None
            ),
            "fecha_devolucion": (
                fecha_devolucion.isoformat()
                if fecha_devolucion else None
            ),
            "estado_prestamo": estado_prestamo,
            "dias_atraso": dias_atraso,
            "dias_sancion": dias_sancion,
        }
