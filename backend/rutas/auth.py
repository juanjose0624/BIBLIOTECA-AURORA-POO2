"""Rutas de autenticación. Por ahora solo el registro."""
from flask import Blueprint, current_app, jsonify, request

from repositorios.usuario_repositorio import CorreoYaRegistrado
from servicios.registro_servicio import ErrorValidacion, RegistroServicio

auth_bp = Blueprint("auth", __name__, url_prefix="/api")
registro_servicio = RegistroServicio()


@auth_bp.post("/registro")
def registro():
    datos = request.get_json(silent=True) or {}
    try:
        registro_servicio.registrar(datos)
    except ErrorValidacion as error:
        return jsonify(ok=False, errores=error.errores), 400
    except CorreoYaRegistrado:
        return jsonify(ok=False, errores={"correo": "Este correo ya está registrado."}), 409
    except Exception:
        current_app.logger.exception("Error al registrar un usuario")
        return jsonify(ok=False, mensaje="No pudimos crear la cuenta. Inténtalo de nuevo."), 500
    return jsonify(ok=True, mensaje="Cuenta creada."), 201
