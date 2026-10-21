"""Conexión a PostgreSQL."""
import psycopg

from config import Config


def obtener_conexion():
    """Abre una conexión nueva.

    Se usa con `with`: al terminar el bloque guarda los cambios (commit),
    o los deshace si hubo un error (rollback), y cierra la conexión.
    """
    return psycopg.connect(**Config.DB)