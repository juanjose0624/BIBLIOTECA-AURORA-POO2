"""Rutas de autenticación: registro, login, logout y quién soy."""
from flask import Blueprint, current_app, jsonify, request, session

from repositorios.usuario_repositorio import CorreoYaRegistrado, UsuarioRepositorio
from servicios.login_servicio import ROLES, CredencialesInvalidas, LoginServicio, RolNoPermitido
from servicios.registro_servicio import ErrorValidacion, RegistroServicio

auth_bp = Blueprint("auth", __name__, url_prefix="/api")
registro_servicio = RegistroServicio()
login_servicio = LoginServicio()
repositorio = UsuarioRepositorio()


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


@auth_bp.post("/login")
def login():
    # Solo se aceptan peticiones JSON: un formulario enviado desde otra página no pasa
    if not request.is_json:
        return jsonify(ok=False, mensaje="Formato no válido."), 415

    datos = request.get_json(silent=True) or {}
    rol = datos.get("rol")
    if rol not in ROLES:
        return jsonify(ok=False, mensaje="Tipo de acceso no válido."), 400

    try:
        usuario = login_servicio.autenticar(datos.get("correo"), datos.get("clave"), rol)
    except CredencialesInvalidas:
        return jsonify(ok=False, mensaje="Correo o contraseña incorrectos."), 401
    except RolNoPermitido as error:
        if error.rol_real == "administrador":
            mensaje = "Esta cuenta es de administrador. Usa el acceso de Administrador."
        else:
            mensaje = "Esta cuenta no tiene permisos de administrador."
        return jsonify(ok=False, mensaje=mensaje), 403
    except Exception:
        current_app.logger.exception("Error al iniciar sesión")
        return jsonify(ok=False, mensaje="No pudimos iniciar sesión. Inténtalo de nuevo."), 500

    session.clear()
    session["usuario_id"] = usuario.id
    session.permanent = datos.get("recordar") is True  # "Recordarme": la sesión dura varios días
    return jsonify(ok=True, rol=usuario.rol, nombre=usuario.nombre)


@auth_bp.post("/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


@auth_bp.get("/yo")
def yo():
    """Dice quién tiene la sesión abierta (sirve para comprobar que el login funcionó)."""
    id_usuario = session.get("usuario_id")
    usuario = repositorio.buscar_por_id(id_usuario) if id_usuario else None
    if usuario is None:
        session.clear()
        return jsonify(ok=False), 401
    return jsonify(
    ok=True,
    id=usuario.id,
    nombre=usuario.nombre,
    apellido=usuario.apellido,
    celular=usuario.celular,
    correo=usuario.correo,
    sexo=usuario.sexo,
    rol=usuario.rol
)
@auth_bp.patch("/yo")
def actualizar_yo():
    id_usuario = session.get("usuario_id")

    if not id_usuario:
        return jsonify(
            ok=False,
            mensaje="Debes iniciar sesión."
        ), 401

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify(
            ok=False,
            mensaje="Debes enviar datos válidos."
        ), 400

    campos = ("nombre", "apellido", "celular", "correo", "sexo")

    if any(
        not isinstance(datos.get(campo), str)
        or not datos[campo].strip()
        for campo in campos
    ):
        return jsonify(
            ok=False,
            mensaje="Todos los campos son obligatorios."
        ), 400

    datos = {
        campo: datos[campo].strip()
        for campo in campos
    }

    datos["correo"] = datos["correo"].lower()

    if len(datos["nombre"]) < 2 or len(datos["apellido"]) < 2:
        return jsonify(
            ok=False,
            mensaje="El nombre y el apellido deben tener al menos 2 caracteres."
        ), 400

    if not datos["celular"].isdigit() or len(datos["celular"]) != 10:
        return jsonify(
            ok=False,
            mensaje="El celular debe tener 10 dígitos."
        ), 400

    if datos["sexo"] not in ("femenino", "masculino", "no_indica"):
        return jsonify(
            ok=False,
            mensaje="La opción de sexo no es válida."
        ), 400

    try:
        actualizado = repositorio.actualizar_datos(id_usuario, datos)

        if not actualizado:
            session.clear()
            return jsonify(
                ok=False,
                mensaje="No se encontró tu cuenta."
            ), 401

    except CorreoYaRegistrado:
        return jsonify(
            ok=False,
            errores={
                "correo": "Este correo ya está registrado."
            }
        ), 409

    except Exception:
        current_app.logger.exception(
            "Error al actualizar los datos del usuario"
        )
        return jsonify(
            ok=False,
            mensaje="No fue posible guardar los cambios."
        ), 500

    return jsonify(
        ok=True,
        mensaje="Tus datos se actualizaron correctamente."
    ), 200