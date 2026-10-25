"""Rutas para la página principal, los dashboards, los CRUD y la sala VR."""

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


# ---------------------------------------------------------------------------
# Directorios del proyecto
# ---------------------------------------------------------------------------
CARPETA_PROYECTO = Path(__file__).resolve().parents[2]
CARPETA_FRONTEND = CARPETA_PROYECTO / "frontend"
CARPETA_DASHBOARDS = CARPETA_PROYECTO / "dashboards"
CARPETA_CRUDS = CARPETA_PROYECTO / "cruds"


# ---------------------------------------------------------------------------
# Archivos permitidos y rol que exige cada uno (None = cualquier usuario con sesión)
# ---------------------------------------------------------------------------
DASHBOARDS_PERMITIDOS = {
    "usuario.html": "usuario",
    "administrador.html": "administrador",
    "actualizar_datos.html": None,
    "vr.html": None,
}


# ---------------------------------------------------------------------------
# Funciones auxiliares
# ---------------------------------------------------------------------------
def _sin_cache(respuesta):
    """Evita que el navegador guarde páginas protegidas en caché."""
    respuesta.headers["Cache-Control"] = (
        "no-store, no-cache, must-revalidate, max-age=0"
    )
    respuesta.headers["Pragma"] = "no-cache"
    respuesta.headers["Expires"] = "0"
    return respuesta


def _servir_protegido(carpeta, nombre_archivo, rol_requerido=None):
    """Sirve un archivo solo si hay sesión válida y, si se pide, el rol correcto.

    - 401: no hay sesión o el usuario ya no existe.
    - 403: hay sesión, pero el rol no coincide.
    """
    id_usuario = session.get("usuario_id")
    usuario = (
        UsuarioRepositorio().buscar_por_id(id_usuario)
        if id_usuario
        else None
    )

    if usuario is None:
        session.clear()
        respuesta = make_response("", 401)

    elif rol_requerido is not None and usuario.rol != rol_requerido:
        respuesta = make_response("", 403)

    else:
        respuesta = make_response(
            send_from_directory(carpeta, nombre_archivo)
        )

    return _sin_cache(respuesta)


# ---------------------------------------------------------------------------
# Página principal
# ---------------------------------------------------------------------------
@paginas_bp.get("/")
def inicio():
    """Muestra la página principal."""
    return send_from_directory(CARPETA_FRONTEND, "index.html")


# ---------------------------------------------------------------------------
# Dashboards y sala VR
# ---------------------------------------------------------------------------
@paginas_bp.get("/dashboards/<path:archivo>")
def servir_dashboard(archivo):
    """Sirve los dashboards y la sala VR según la sesión y el rol."""
    # Solo se permiten los archivos expresamente autorizados.
    if archivo not in DASHBOARDS_PERMITIDOS:
        abort(404)

    return _servir_protegido(
        CARPETA_DASHBOARDS,
        archivo,
        DASHBOARDS_PERMITIDOS[archivo],
    )


# ---------------------------------------------------------------------------
# CRUD administrativos (solo administradores)
# ---------------------------------------------------------------------------
def _servir_crud_administrativo(nombre_archivo):
    """Sirve un CRUD únicamente a administradores autenticados."""
    return _servir_protegido(CARPETA_CRUDS, nombre_archivo, "administrador")


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


@paginas_bp.get("/cruds/estadisticas.html")
def servir_crud_estadisticas():
    """Sirve las estadísticas exclusivamente a administradores."""
    return _servir_crud_administrativo("estadisticas.html")

@paginas_bp.get("/cruds/solicitudes.html")
def servir_crud_solicitudes():
    """Sirve el CRUD de solicitudes exclusivamente a administradores."""
    return _servir_crud_administrativo("solicitudes.html")
