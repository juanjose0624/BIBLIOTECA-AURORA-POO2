"""Punto de entrada: crea la aplicación Flask y la pone a funcionar."""

from pathlib import Path
from flask import Flask, abort, make_response, send_from_directory, session

from config import Config
from repositorios.usuario_repositorio import UsuarioRepositorio
from rutas.auth import auth_bp


def crear_app():
    Config.comprobar()

    # Rutas principales del proyecto.
    carpeta_frontend = Path(__file__).resolve().parent.parent / "frontend"
    carpeta_dashboards = Path(__file__).resolve().parent.parent / "dashboards"

    # Flask sirve los archivos públicos del frontend.
    app = Flask(
        __name__,
        static_folder=str(carpeta_frontend),
        static_url_path=""
    )

    app.config.from_object(Config)
    app.register_blueprint(auth_bp)

    repositorio = UsuarioRepositorio()

    # Página principal.
    @app.get("/")
    def inicio():
        return send_from_directory(carpeta_frontend, "index.html")

    # Dashboards y formulario protegidos por sesión.
    @app.get("/dashboards/<path:archivo>")
    def servir_dashboard(archivo):
        # Los únicos archivos permitidos en esta ruta.
        roles_permitidos = {
            "usuario.html": "usuario",
            "administrador.html": "administrador",
            "actualizar_datos.html": None
        }

        # Rechazar cualquier archivo que no esté autorizado.
        if archivo not in roles_permitidos:
            abort(404)

        rol_requerido = roles_permitidos[archivo]

        # Comprobar que existe una sesión válida.
        id_usuario = session.get("usuario_id")
        usuario = (
            repositorio.buscar_por_id(id_usuario)
            if id_usuario
            else None
        )

        if usuario is None:
            session.clear()
            respuesta = make_response("", 401)

        # Los dashboards requieren el rol correspondiente.
        elif (
            rol_requerido is not None
            and usuario.rol != rol_requerido
        ):
            respuesta = make_response("", 403)

        # El formulario está disponible para cualquier usuario autenticado.
        else:
            respuesta = make_response(
                send_from_directory(carpeta_dashboards, archivo)
            )

        # Evitar que el navegador conserve estas páginas en caché.
        respuesta.headers["Cache-Control"] = (
            "no-store, no-cache, must-revalidate, max-age=0"
        )
        respuesta.headers["Pragma"] = "no-cache"
        respuesta.headers["Expires"] = "0"

        return respuesta

    return app


app = crear_app()


if __name__ == "__main__":
    app.run(debug=True)
