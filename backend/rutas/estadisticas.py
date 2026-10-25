
"""Rutas de estadísticas generales para el panel administrativo."""

from flask import Blueprint, current_app, jsonify

from db import obtener_conexion
from servicios.permisos import requiere_admin


estadisticas_bp = Blueprint("estadisticas", __name__)


@estadisticas_bp.get("/api/estadisticas")
@requiere_admin
def obtener_estadisticas():
    """Consulta las estadísticas reales de Aurora Libris."""

    try:
        with obtener_conexion() as conexion:
            with conexion.cursor() as cursor:

                # Usuarios registrados y administradores.
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) AS total,
                        COUNT(*) FILTER (
                            WHERE LOWER(TRIM(rol)) = 'administrador'
                        ) AS administradores
                    FROM usuarios;
                    """
                )
                fila = cursor.fetchone()
                total_usuarios, total_administradores = fila

                # Títulos y ejemplares del inventario.
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) AS titulos,
                        COALESCE(SUM(cantidad_total), 0) AS ejemplares_totales,
                        COALESCE(SUM(cantidad_disponible), 0)
                            AS ejemplares_disponibles,
                        COALESCE(
                            SUM(cantidad_total - cantidad_disponible), 0
                        ) AS ejemplares_no_disponibles
                    FROM libros;
                    """
                )
                fila = cursor.fetchone()

                (
                    total_titulos,
                    ejemplares_totales,
                    ejemplares_disponibles,
                    ejemplares_no_disponibles,
                ) = fila

                # Total de préstamos registrados.
                cursor.execute(
                    """
                    SELECT COUNT(*)
                    FROM prestamos;
                    """
                )
                total_prestamos = cursor.fetchone()[0]

                # Préstamos agrupados por mes durante los últimos 12 meses.
                cursor.execute(
                    """
                    SELECT
                        TO_CHAR(
                            DATE_TRUNC('month', fecha_prestamo),
                            'YYYY-MM'
                        ) AS periodo,
                        COUNT(*) AS total
                    FROM prestamos
                    WHERE fecha_prestamo >=
                        DATE_TRUNC('month', CURRENT_DATE)
                        - INTERVAL '11 months'
                    GROUP BY DATE_TRUNC('month', fecha_prestamo)
                    ORDER BY DATE_TRUNC('month', fecha_prestamo);
                    """
                )

                historial_prestamos = [
                    {
                        "periodo": fila[0],
                        "total": fila[1],
                    }
                    for fila in cursor.fetchall()
                ]


                # Total de PQRS y clasificación según los estados reales.
                cursor.execute(
                    """
                    SELECT
                        COUNT(*) AS total,

                        COUNT(*) FILTER (
                            WHERE LOWER(TRIM(estado)) = 'pendiente'
                        ) AS pendientes,

                        COUNT(*) FILTER (
                            WHERE LOWER(TRIM(estado)) = 'en_revision'
                        ) AS en_revision,

                        COUNT(*) FILTER (
                            WHERE LOWER(TRIM(estado)) = 'respondida'
                        ) AS respondidas

                    FROM pqrs;
                    """
                )

                (
                    total_pqrs,
                    pqrs_pendientes,
                    pqrs_en_revision,
                    pqrs_respondidas,
                ) = cursor.fetchone()


        estadisticas = {
            "usuarios": {
                "total": total_usuarios,
                "administradores": total_administradores,
            },
            "libros": {
                "titulos": total_titulos,
                "ejemplares_totales": ejemplares_totales,
                "ejemplares_disponibles": ejemplares_disponibles,
                "ejemplares_no_disponibles": ejemplares_no_disponibles,
            },
            "prestamos": {
                "total": total_prestamos,
                "historial": historial_prestamos,
            },

            "pqrs": {
                "total": total_pqrs,
                "pendientes": pqrs_pendientes,
                "en_proceso": pqrs_en_revision,
                "resueltas": pqrs_respondidas,
            },

        }

        return jsonify(
            ok=True,
            estadisticas=estadisticas,
        ), 200

    except Exception:
        current_app.logger.exception(
            "Error al consultar las estadísticas de Aurora Libris."
        )
        return jsonify(
            ok=False,
            mensaje="No fue posible cargar las estadísticas.",
        ), 500
