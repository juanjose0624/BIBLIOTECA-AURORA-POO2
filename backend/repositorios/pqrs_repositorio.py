
"""Repositorio de acceso a datos para las PQRS.

Centraliza las consultas SQL para registrar, listar, actualizar
y eliminar peticiones, quejas, reclamos y sugerencias.
"""

from db import obtener_conexion


class PqrsRepositorio:
    """Gestiona las solicitudes PQRS en PostgreSQL."""

    def crear(self, datos):
        """Guarda una solicitud y devuelve su identificador."""
        with obtener_conexion() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO public.pqrs (
                        nombre,
                        apellido,
                        correo,
                        tipo,
                        mensaje
                    )
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        datos["nombre"],
                        datos["apellido"],
                        datos["correo"],
                        datos["tipo"],
                        datos["mensaje"],
                    ),
                )
                resultado = cursor.fetchone()
                return resultado[0]

    def listar(self):
        """Devuelve las solicitudes de la más reciente a la más antigua."""
        with obtener_conexion() as conexion:
            filas = conexion.execute(
                """
                SELECT
                    id,
                    nombre,
                    apellido,
                    correo,
                    tipo,
                    mensaje,
                    estado,
                    respuesta,
                    creado_en,
                    respondido_en
                FROM public.pqrs
                ORDER BY creado_en DESC, id DESC
                """
            ).fetchall()

        columnas = (
            "id",
            "nombre",
            "apellido",
            "correo",
            "tipo",
            "mensaje",
            "estado",
            "respuesta",
            "creado_en",
            "respondido_en",
        )

        solicitudes = []
        for fila in filas:
            solicitud = dict(zip(columnas, fila))

            for campo in ("creado_en", "respondido_en"):
                if solicitud[campo] is not None:
                    solicitud[campo] = solicitud[campo].isoformat()

            solicitudes.append(solicitud)

        return solicitudes

    def actualizar(self, identificador, estado, respuesta):
        """Actualiza el estado y la respuesta de una solicitud."""
        with obtener_conexion() as conexion:
            resultado = conexion.execute(
                """
                UPDATE public.pqrs
                SET estado = %s,
                    respuesta = %s,
                    respondido_en = CASE
                        WHEN %s = 'respondida' THEN CURRENT_TIMESTAMP
                        ELSE NULL
                    END
                WHERE id = %s
                RETURNING id
                """,
                (estado, respuesta, estado, identificador),
            ).fetchone()

        return resultado is not None

    def eliminar(self, identificador):
        """Elimina una solicitud y devuelve si existía."""
        with obtener_conexion() as conexion:
            resultado = conexion.execute(
                """
                DELETE FROM public.pqrs
                WHERE id = %s
                RETURNING id
                """,
                (identificador,),
            ).fetchone()

        return resultado is not None
