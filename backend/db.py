"""Módulo de conexión a la base de datos PostgreSQL de Aurora Libris.

Centraliza la creación de conexiones mediante psycopg y utiliza
los parámetros definidos en la configuración de la aplicación.
Permite gestionar las transacciones y cerrar las conexiones
de forma segura mediante el uso de bloques `with`.
"""
import psycopg

from config import Config


def obtener_conexion():
    """Abre una conexión nueva.

    Se usa con `with`: al terminar el bloque guarda los cambios (commit),
    o los deshace si hubo un error (rollback), y cierra la conexión.
    """
    return psycopg.connect(**Config.DB)