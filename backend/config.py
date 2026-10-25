"""Configuración central de Aurora Libris.

Carga las variables de entorno desde el archivo .env y define
los parámetros de seguridad de las sesiones, la duración de las cookies
y las credenciales de conexión a PostgreSQL. Comprueba que las variables
secretas obligatorias estén configuradas antes de iniciar la aplicación.
"""
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()  # lee el archivo .env y lo convierte en variables de entorno


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "")

    # Sesión (cookie): no accesible desde JavaScript, y no se envía desde otros sitios
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)  # solo si marcan "Recordarme"

    # Datos de conexión a PostgreSQL
    DB = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "dbname": os.getenv("DB_NAME", "BIBLIOTECA_POO2"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", ""),
    }

    @classmethod
    def comprobar(cls):
        """Avisa con un mensaje claro si falta algo importante en el .env."""
        faltan = []
        if not cls.SECRET_KEY:
            faltan.append("SECRET_KEY")
        if not cls.DB["password"]:
            faltan.append("DB_PASSWORD")
        if faltan:
            raise RuntimeError("Faltan variables en el archivo .env: " + ", ".join(faltan))