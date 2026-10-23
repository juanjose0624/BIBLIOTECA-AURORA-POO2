"""Rutas del CRUD de usuarios, exclusivas para administradores."""

from flask import Blueprint, current_app, jsonify, request

from repositorios.usuario_repositorio import (
    UsuarioRepositorio,
    CorreoYaRegistrado,
    UltimoAdministrador,
)
from servicios.permisos import requiere_admin
from servicios.usuarios_servicio import (
    ErrorValidacionUsuarios,
    UsuarioNoEncontrado,
    UsuariosServicio,
)


usuarios_bp = Blueprint("usuarios", __name__, url_prefix="/api/usuarios")
servicio = UsuariosServicio()
repositorio_usuarios = UsuarioRepositorio()


def _usuario_a_dict(usuario):
    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "celular": usuario.celular,
        "correo": usuario.correo,
        "sexo": usuario.sexo,
        "rol": usuario.rol,
        "creado_en": repositorio_usuarios.obtener_fecha_creacion(usuario.id),
    }


@usuarios_bp.get("")
@requiere_admin
def listar_usuarios():
    """Lista usuarios y devuelve estadísticas para el panel."""
    try:
        usuarios = servicio.listar()
        datos = [_usuario_a_dict(usuario) for usuario in usuarios]

        administradores = sum(
            usuario["rol"] == "administrador" for usuario in datos
        )

        return jsonify(
            ok=True,
            usuarios=datos,
            total=len(datos),
            total_administradores=administradores,
            total_regulares=len(datos) - administradores,
        ), 200

    except Exception:
        current_app.logger.exception("Error al listar usuarios")
        return jsonify(
            ok=False,
            mensaje="No fue posible cargar los usuarios."
        ), 500


@usuarios_bp.get("/<int:id_usuario>")
@requiere_admin
def obtener_usuario(id_usuario):
    """Obtiene un usuario por su ID."""
    try:
        usuario = servicio.obtener(id_usuario)
        return jsonify(ok=True, usuario=_usuario_a_dict(usuario)), 200

    except UsuarioNoEncontrado:
        return jsonify(
            ok=False,
            mensaje="El usuario no existe."
        ), 404

    except Exception:
        current_app.logger.exception("Error al consultar usuario")
        return jsonify(
            ok=False,
            mensaje="No fue posible consultar el usuario."
        ), 500


@usuarios_bp.post("")
@requiere_admin
def crear_usuario():
    """Crea una cuenta con contraseña y rol validados."""
    if not request.is_json:
        return jsonify(
            ok=False,
            mensaje="Debes enviar los datos en formato JSON."
        ), 415

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify(
            ok=False,
            mensaje="Los datos enviados no son válidos."
        ), 400

    try:
        usuario = servicio.crear(datos)

        return jsonify(
            ok=True,
            mensaje="Usuario creado correctamente.",
            usuario=_usuario_a_dict(usuario),
        ), 201

    except ErrorValidacionUsuarios as error:
        return jsonify(ok=False, errores=error.errores), 400

    except CorreoYaRegistrado:
        return jsonify(
            ok=False,
            errores={"correo": "Este correo ya está registrado."}
        ), 409

    except Exception:
        current_app.logger.exception("Error al crear usuario")
        return jsonify(
            ok=False,
            mensaje="No fue posible crear el usuario."
        ), 500


@usuarios_bp.patch("/<int:id_usuario>")
@requiere_admin
def actualizar_usuario(id_usuario):
    """Actualiza los datos, el rol y opcionalmente la contraseña."""
    if not request.is_json:
        return jsonify(
            ok=False,
            mensaje="Debes enviar los datos en formato JSON."
        ), 415

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify(
            ok=False,
            mensaje="Los datos enviados no son válidos."
        ), 400

    try:
        usuario = servicio.actualizar(id_usuario, datos)

        return jsonify(
            ok=True,
            mensaje="Usuario actualizado correctamente.",
            usuario=_usuario_a_dict(usuario),
        ), 200

    except ErrorValidacionUsuarios as error:
        return jsonify(ok=False, errores=error.errores), 400

    except UsuarioNoEncontrado:
        return jsonify(
            ok=False,
            mensaje="El usuario no existe."
        ), 404

    except CorreoYaRegistrado:
        return jsonify(
            ok=False,
            errores={"correo": "Este correo ya está registrado."}
        ), 409

    except UltimoAdministrador:
        return jsonify(
            ok=False,
            mensaje="No puedes cambiar el rol del último administrador."
        ), 409

    except Exception:
        current_app.logger.exception("Error al actualizar usuario")
        return jsonify(
            ok=False,
            mensaje="No fue posible actualizar el usuario."
        ), 500


@usuarios_bp.delete("/<int:id_usuario>")
@requiere_admin
def eliminar_usuario(id_usuario):
    """Elimina una cuenta respetando la protección de administradores."""
    try:
        servicio.eliminar(id_usuario)

        return jsonify(
            ok=True,
            mensaje="Usuario eliminado correctamente."
        ), 200

    except UsuarioNoEncontrado:
        return jsonify(
            ok=False,
            mensaje="El usuario no existe."
        ), 404

    except UltimoAdministrador:
        return jsonify(
            ok=False,
            mensaje="No puedes eliminar al último administrador."
        ), 409

    except Exception:
        current_app.logger.exception("Error al eliminar usuario")
        return jsonify(
            ok=False,
            mensaje="No fue posible eliminar el usuario."
        ), 500