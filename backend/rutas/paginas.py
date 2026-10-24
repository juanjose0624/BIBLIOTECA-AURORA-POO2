
"""Rutas para la página principal, los dashboards y los CRUD."""

from pathlib import Path

from flask import (
    Blueprint,
    abort,
    make_response,
    send_from_directory,
    session,
)

from repositorios.usuario_repositorio import UsuarioRepositorio


paginas_bp = Blueprint("paginas", __name__)

# Directorios del proyecto.
carpeta_proyecto = Path(__file__).resolve().parents[2]
carpeta_frontend = carpeta_proyecto / "frontend"
carpeta_dashboards = carpeta_proyecto / "dashboards"
carpeta_cruds = carpeta_proyecto / "cruds"


@paginas_bp.get("/")
def inicio():
    """Muestra la página principal."""
    return send_from_directory(carpeta_frontend, "index.html")


@paginas_bp.get("/dashboards/<path:archivo>")
def servir_dashboard(archivo):
    """Sirve los dashboards según la sesión y el rol."""

    roles_permitidos = {
        "usuario.html": "usuario",
        "administrador.html": "administrador",
        "actualizar_datos.html": None,
    }

    # Solo se permiten los archivos expresamente autorizados.
    if archivo not in roles_permitidos:
        abort(404)

    rol_requerido = roles_permitidos[archivo]

    id_usuario = session.get("usuario_id")
    repositorio = UsuarioRepositorio()

    usuario = (
        repositorio.buscar_por_id(id_usuario)
        if id_usuario
        else None
    )

    if usuario is None:
        session.clear()
        respuesta = make_response("", 401)

    elif (
        rol_requerido is not None
        and usuario.rol != rol_requerido
    ):
        respuesta = make_response("", 403)

    else:
        respuesta = make_response(
            send_from_directory(carpeta_dashboards, archivo)
        )

    respuesta.headers["Cache-Control"] = (
        "no-store, no-cache, must-revalidate, max-age=0"
    )
    respuesta.headers["Pragma"] = "no-cache"
    respuesta.headers["Expires"] = "0"

    return respuesta


def _servir_crud_administrativo(nombre_archivo):
    """Sirve un CRUD únicamente a administradores autenticados."""

    id_usuario = session.get("usuario_id")
    repositorio = UsuarioRepositorio()

    usuario = (
        repositorio.buscar_por_id(id_usuario)
        if id_usuario
        else None
    )

    if usuario is None:
        session.clear()
        respuesta = make_response("", 401)

    elif usuario.rol != "administrador":
        respuesta = make_response("", 403)

    else:
        respuesta = make_response(
            send_from_directory(carpeta_cruds, nombre_archivo)
        )

    respuesta.headers["Cache-Control"] = (
        "no-store, no-cache, must-revalidate, max-age=0"
    )
    respuesta.headers["Pragma"] = "no-cache"
    respuesta.headers["Expires"] = "0"

    return respuesta


@paginas_bp.get("/cruds/pqrs.html")
def servir_crud_pqrs():
    """Sirve el CRUD de PQRS exclusivamente a administradores."""
    return _servir_crud_administrativo("pqrs.html")


@paginas_bp.get("/cruds/usuarios.html")
def servir_crud_usuarios():
    """Sirve el CRUD de usuarios exclusivamente a administradores."""
    return _servir_crud_administrativo("usuarios.html")

@paginas_bp.get("/cruds/libros.html")
def servir_crud_libros():
    """Sirve el CRUD de libros exclusivamente a administradores."""
    return _servir_crud_administrativo("libros.html")