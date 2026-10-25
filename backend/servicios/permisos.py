
"""Módulo de permisos para proteger las rutas de Aurora Libris.

Proporciona decoradores que verifican la existencia de una sesión
válida y el rol del usuario antes de permitir el acceso a operaciones
exclusivas para administradores, devolviendo respuestas JSON
cuando la autenticación o los permisos son insuficientes.
"""
from functools import wraps

from flask import jsonify, session

from repositorios.usuario_repositorio import UsuarioRepositorio


def requiere_admin(funcion):
    """Permite acceder únicamente a administradores autenticados."""

    @wraps(funcion)
    def decorada(*args, **kwargs):
        id_usuario = session.get("usuario_id")

        if not id_usuario:
            return jsonify(
                ok=False,
                mensaje="Debes iniciar sesión."
            ), 401

        usuario = UsuarioRepositorio().buscar_por_id(id_usuario)

        if usuario is None:
            session.clear()
            return jsonify(
                ok=False,
                mensaje="La sesión no es válida."
            ), 401

        if usuario.rol != "administrador":
            return jsonify(
                ok=False,
                mensaje="No tienes permisos para realizar esta operación."
            ), 403

        return funcion(*args, **kwargs)

    return decorada
