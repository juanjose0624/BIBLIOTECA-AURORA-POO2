
"""Módulo de rutas para la gestión de PQRS de Aurora Libris.

Permite registrar solicitudes públicamente y consultar, actualizar
o eliminar PQRS desde el panel administrativo, verificando los permisos
de acceso y gestionando los errores de las operaciones.
"""
from functools import wraps

from flask import (
    Blueprint,
    current_app,
    jsonify,
    request,
    session,
)

from repositorios.usuario_repositorio import UsuarioRepositorio
from servicios.pqrs_servicio import PqrsServicio


pqrs_bp = Blueprint("pqrs", __name__)
servicio = PqrsServicio()
usuarios = UsuarioRepositorio()


def administrador_requerido(funcion):
    """Permite el acceso únicamente a administradores autenticados."""

    @wraps(funcion)
    def envoltura(*args, **kwargs):
        id_usuario = session.get("usuario_id")

        if not id_usuario:
            return jsonify(
                mensaje="Debes iniciar sesión para continuar."
            ), 401

        try:
            usuario = usuarios.buscar_por_id(id_usuario)
        except Exception:
            current_app.logger.exception(
                "Error al verificar los permisos para PQRS"
            )
            return jsonify(
                mensaje="No fue posible verificar tus permisos."
            ), 500

        if usuario is None:
            session.clear()
            return jsonify(
                mensaje="Tu sesión ya no es válida."
            ), 401

        if usuario.rol != "administrador":
            return jsonify(
                mensaje="No tienes permisos para administrar las PQRS."
            ), 403

        return funcion(*args, **kwargs)

    return envoltura


@pqrs_bp.post("/api/pqrs")
def crear_pqrs():
    """Registra una solicitud desde el formulario público."""
    if not request.is_json:
        return jsonify(
            mensaje="La solicitud debe enviarse en formato JSON."
        ), 415

    datos = request.get_json(silent=True)

    try:
        resultado = servicio.crear(datos)
        return jsonify(resultado), 201

    except ValueError as error:
        return jsonify(mensaje=str(error)), 400

    except Exception:
        current_app.logger.exception(
            "Error al registrar una solicitud PQRS"
        )
        return jsonify(
            mensaje=(
                "No fue posible registrar la solicitud. "
                "Inténtalo nuevamente."
            )
        ), 500


@pqrs_bp.get("/api/pqrs")
@administrador_requerido
def listar_pqrs():
    """Lista las solicitudes para el panel administrativo."""
    try:
        solicitudes = servicio.listar()
        return jsonify(solicitudes=solicitudes), 200

    except Exception:
        current_app.logger.exception(
            "Error al consultar las solicitudes PQRS"
        )
        return jsonify(
            mensaje="No fue posible cargar las solicitudes."
        ), 500


@pqrs_bp.patch("/api/pqrs/<int:identificador>")
@administrador_requerido
def actualizar_pqrs(identificador):
    """Actualiza el estado y la respuesta de una solicitud."""
    if not request.is_json:
        return jsonify(
            mensaje="La solicitud debe enviarse en formato JSON."
        ), 415

    datos = request.get_json(silent=True)

    try:
        resultado = servicio.actualizar(identificador, datos)

        if resultado is None:
            return jsonify(
                mensaje="No se encontró la solicitud."
            ), 404

        return jsonify(resultado), 200

    except ValueError as error:
        return jsonify(mensaje=str(error)), 400

    except Exception:
        current_app.logger.exception(
            "Error al actualizar una solicitud PQRS"
        )
        return jsonify(
            mensaje="No fue posible actualizar la solicitud."
        ), 500


@pqrs_bp.delete("/api/pqrs/<int:identificador>")
@administrador_requerido
def eliminar_pqrs(identificador):
    """Elimina una solicitud desde el panel administrativo."""
    try:
        eliminada = servicio.eliminar(identificador)

        if not eliminada:
            return jsonify(
                mensaje="No se encontró la solicitud."
            ), 404

        return jsonify(
            mensaje="La solicitud se eliminó correctamente."
        ), 200

    except Exception:
        current_app.logger.exception(
            "Error al eliminar una solicitud PQRS"
        )
        return jsonify(
            mensaje="No fue posible eliminar la solicitud."
        ), 500
