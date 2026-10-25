
"""Módulo de rutas para solicitudes, préstamos y sanciones de Aurora Libris.

Gestiona la creación y consulta de solicitudes por parte de los usuarios,
así como la aprobación, el rechazo, la devolución de préstamos y el registro
de sanciones por parte de los administradores, mediante validaciones
y respuestas JSON para la API.
"""
from flask import Blueprint, jsonify, request, session

from servicios.permisos import requiere_admin
from servicios.prestamos_servicio import (
    ErrorValidacionPrestamos,
    PrestamosServicio,
)

prestamos_bp = Blueprint(
    "prestamos",
    __name__,
    url_prefix="/api/prestamos",
)

servicio = PrestamosServicio()


def _id_positivo(valor, nombre):
    """Valida un identificador entero positivo."""
    if isinstance(valor, bool):
        raise ErrorValidacionPrestamos(
            f"{nombre} no es válido."
        )

    try:
        identificador = int(valor)
    except (TypeError, ValueError):
        raise ErrorValidacionPrestamos(
            f"{nombre} no es válido."
        ) from None

    if identificador < 1 or str(identificador) != str(valor).strip():
        raise ErrorValidacionPrestamos(
            f"{nombre} no es válido."
        )

    return identificador


def _respuesta_error(error, codigo=400):
    """Genera una respuesta de error uniforme."""
    return jsonify(ok=False, mensaje=str(error)), codigo


@prestamos_bp.get("")
@requiere_admin
def listar_prestamos():
    """Lista las solicitudes y los préstamos para administración."""
    try:
        registros = servicio.listar_todos()
        return jsonify(
            ok=True,
            prestamos=registros,
            total=len(registros),
        ), 200
    except Exception:
        return jsonify(
            ok=False,
            mensaje="No fue posible consultar los préstamos.",
        ), 500


@prestamos_bp.post("/solicitudes")
def crear_solicitud():
    """Crea una solicitud para el usuario autenticado."""
    usuario_id = session.get("usuario_id")

    if not usuario_id:
        return jsonify(
            ok=False,
            mensaje="Debes iniciar sesión para solicitar un préstamo.",
        ), 401

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify(
            ok=False,
            mensaje="Debes enviar un objeto JSON válido.",
        ), 400

    try:
        solicitud_id = servicio.crear_solicitud(
            usuario_id,
            datos,
        )
        return jsonify(
            ok=True,
            mensaje="La solicitud fue registrada correctamente.",
            solicitud_id=solicitud_id,
        ), 201
    except ErrorValidacionPrestamos as error:
        return _respuesta_error(error, 400)


@prestamos_bp.get("/mis-prestamos")
def listar_mis_prestamos():
    """Lista únicamente las solicitudes y préstamos del usuario autenticado."""
    from flask import session

    usuario_id = session.get("usuario_id")

    if not usuario_id:
        return jsonify(
            ok=False,
            mensaje="Debes iniciar sesión.",
        ), 401

    try:
        registros = servicio.listar_mis_prestamos(usuario_id)

        return jsonify(
            ok=True,
            prestamos=registros,
            total=len(registros),
        ), 200

    except Exception:
        return jsonify(
            ok=False,
            mensaje="No fue posible consultar tus préstamos.",
        ), 500

@prestamos_bp.post("/<int:solicitud_id>/aprobar")
@requiere_admin
def aprobar_solicitud(solicitud_id):
    """Aprueba una solicitud y crea el préstamo."""
    datos = request.get_json(silent=True)

    try:
        solicitud_id = _id_positivo(
            solicitud_id, "El identificador de la solicitud"
        )
        administrador_id = _id_positivo(
            session.get("usuario_id"),
            "El identificador del administrador",
        )

        prestamo_id = servicio.aprobar(
            solicitud_id,
            administrador_id,
            datos,
        )

        return jsonify(
            ok=True,
            mensaje="Solicitud aprobada y préstamo registrado.",
            solicitud_id=solicitud_id,
            prestamo_id=prestamo_id,
        ), 200
    except ErrorValidacionPrestamos as error:
        return _respuesta_error(error, 400)


@prestamos_bp.post("/<int:solicitud_id>/rechazar")
@requiere_admin
def rechazar_solicitud(solicitud_id):
    """Rechaza una solicitud pendiente."""
    try:
        solicitud_id = _id_positivo(
            solicitud_id, "El identificador de la solicitud"
        )
        administrador_id = _id_positivo(
            session.get("usuario_id"),
            "El identificador del administrador",
        )

        servicio.rechazar(
            solicitud_id,
            administrador_id,
        )

        return jsonify(
            ok=True,
            mensaje="La solicitud fue rechazada.",
        ), 200
    except ErrorValidacionPrestamos as error:
        return _respuesta_error(error, 400)


@prestamos_bp.post("/<int:prestamo_id>/devolucion")
@requiere_admin
def registrar_devolucion(prestamo_id):
    """Registra la devolución de un préstamo."""
    datos = request.get_json(silent=True)

    if datos is not None and not isinstance(datos, dict):
        return jsonify(
            ok=False,
            mensaje="Debes enviar un objeto JSON válido.",
        ), 400

    try:
        prestamo_id = _id_positivo(
            prestamo_id, "El identificador del préstamo"
        )
        servicio.devolver(prestamo_id, datos)

        return jsonify(
            ok=True,
            mensaje="La devolución fue registrada correctamente.",
        ), 200
    except ErrorValidacionPrestamos as error:
        return _respuesta_error(error, 400)


@prestamos_bp.post("/<int:prestamo_id>/sancion")
@requiere_admin
def imponer_sancion(prestamo_id):
    """Registra una sanción para un préstamo con retraso."""
    datos = request.get_json(silent=True)

    try:
        prestamo_id = _id_positivo(
            prestamo_id, "El identificador del préstamo"
        )
        administrador_id = _id_positivo(
            session.get("usuario_id"),
            "El identificador del administrador",
        )

        servicio.crear_sancion(
            prestamo_id,
            administrador_id,
            datos,
        )

        return jsonify(
            ok=True,
            mensaje="La sanción fue registrada correctamente.",
        ), 201
    except ErrorValidacionPrestamos as error:
        return _respuesta_error(error, 400)
