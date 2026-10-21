"""Punto de entrada: crea la aplicación Flask y la pone a funcionar."""
from flask import Flask, send_from_directory

from config import Config
from rutas.auth import auth_bp


def crear_app():
    Config.comprobar()

    # La carpeta frontend/ se sirve tal cual (css, js, html). Es lo único público.
    app = Flask(__name__, static_folder="../frontend", static_url_path="")
    app.config.from_object(Config)
    app.register_blueprint(auth_bp)

    @app.get("/")
    def inicio():
        return send_from_directory(app.static_folder, "index.html")

    return app


app = crear_app()

if __name__ == "__main__":
    app.run(debug=True)