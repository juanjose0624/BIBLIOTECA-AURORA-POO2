
"""Decoradores para proteger rutas según la sesión y el rol."""

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
