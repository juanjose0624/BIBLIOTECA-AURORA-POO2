"""Punto de entrada y factoría de la aplicación Flask de Aurora Libris.

Verifica la configuración, inicializa la aplicación, establece el directorio
de archivos estáticos, carga los parámetros del sistema y registra las rutas
de los módulos para centralizar la creación y ejecución de la aplicación.
"""
from pathlib import Path

from flask import Flask

from config import Config
from rutas import registrar_rutas


def crear_app():
    """Crea y configura una instancia de Flask."""

    Config.comprobar()

    # Directorio del frontend.
    carpeta_frontend = (
        Path(__file__).resolve().parent.parent / "frontend"
    )

    # Crear la aplicación.
    app = Flask(
        __name__,
        static_folder=str(carpeta_frontend),
        static_url_path="",
    )

    # Cargar la configuración.
    app.config.from_object(Config)

    # Registrar las rutas de todos los módulos.
    registrar_rutas(app)

    return app


app = crear_app()


if __name__ == "__main__":
    app.run(debug=True)