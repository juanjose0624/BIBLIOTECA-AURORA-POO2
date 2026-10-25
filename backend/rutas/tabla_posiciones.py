
"""Módulo de rutas para la tabla de posiciones de Aurora Libris.

Consulta en PostgreSQL los puntos acumulados y los libros leídos
por cada usuario, calcula su nivel de lector y genera una clasificación
ordenada para mostrar el progreso y los logros de la comunidad lectora.
"""
from flask import Blueprint, jsonify, session

from db import obtener_conexion


tabla_posiciones_bp = Blueprint("tabla_posiciones", __name__)


def _obtener_nivel(puntos):
    """Determina el nivel del lector según sus puntos acumulados."""
    if puntos >= 1500:
        return "leyenda"
    if puntos >= 700:
        return "erudito"
    if puntos >= 300:
        return "explorador"
    if puntos >= 100:
        return "lector"
    return "semilla"


@tabla_posiciones_bp.get("/api/posiciones")
def obtener_posiciones():
    """Devuelve la clasificación real de lectores desde PostgreSQL."""
    id_usuario = session.get("usuario_id")

    if not id_usuario:
        return jsonify(
            ok=False,
            mensaje="Debes iniciar sesión.",
        ), 401

    sql = """
        WITH puntos_por_lector AS (
            SELECT
                usuario_id,
                SUM(puntos)::INTEGER AS puntos
            FROM historial_puntos
            GROUP BY usuario_id
        ),
        libros_por_lector AS (
            SELECT
                usuario_id,
                COUNT(*)::INTEGER AS libros_leidos
            FROM prestamos
            WHERE estado = 'devuelto'
            GROUP BY usuario_id
        )
        SELECT
            u.id AS usuario_id,
            u.nombre,
            u.apellido,
            COALESCE(p.puntos, 0)::INTEGER AS puntos,
            COALESCE(l.libros_leidos, 0)::INTEGER AS libros_leidos
        FROM usuarios AS u
        LEFT JOIN puntos_por_lector AS p
            ON p.usuario_id = u.id
        LEFT JOIN libros_por_lector AS l
            ON l.usuario_id = u.id
        WHERE u.rol = 'usuario'
        ORDER BY
            puntos DESC,
            libros_leidos DESC,
            LOWER(u.apellido),
            LOWER(u.nombre),
            u.id
    """

    with obtener_conexion() as conexion:
        filas = conexion.execute(sql).fetchall()

    lectores = []

    for puesto, fila in enumerate(filas, start=1):
        (
            usuario_id,
            nombre,
            apellido,
            puntos,
            libros_leidos,
        ) = fila

        lectores.append({
            "puesto": puesto,
            "usuario_id": usuario_id,
            "nombre": nombre,
            "apellido": apellido,
            "puntos": puntos,
            "libros_leidos": libros_leidos,
            "nivel": _obtener_nivel(puntos),
        })

    return jsonify(
        ok=True,
        usuario_actual_id=id_usuario,
        lectores=lectores,
        total_lectores=len(lectores),
        total_libros_leidos=sum(
            lector["libros_leidos"] for lector in lectores
        ),
        total_puntos=sum(
            lector["puntos"] for lector in lectores
        ),
    )
