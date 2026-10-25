"""Servicio de registro de usuarios de Aurora Libris.

Valida y normaliza los datos del formulario de registro, comprueba
los requisitos de los campos personales y de la contraseña, protege
las credenciales mediante hashes con bcrypt y guarda las cuentas
válidas en la base de datos a través del repositorio de usuarios.
"""
import re

import bcrypt

from modelos.usuario import Usuario
from repositorios.usuario_repositorio import UsuarioRepositorio

SEXOS = {"femenino", "masculino", "no_indica"}


class ErrorValidacion(Exception):
    """Los datos del formulario no cumplen las reglas. Guarda un mensaje por campo."""

    def __init__(self, errores):
        super().__init__("Datos de registro inválidos")
        self.errores = errores


def _texto(valor):
    return valor.strip() if isinstance(valor, str) else ""


def _es_nombre(valor):
    return (2 <= len(valor) <= 60
            and valor[0].isalpha()
            and all(c.isalpha() or c in " '’-" for c in valor))


def _validar(datos):
    """Limpia los datos y devuelve (datos_limpios, errores)."""
    nombre = " ".join(_texto(datos.get("nombre")).split())
    apellido = " ".join(_texto(datos.get("apellido")).split())
    celular = re.sub(r"\D", "", _texto(datos.get("celular")))
    correo = _texto(datos.get("correo")).lower()
    clave = datos.get("clave") if isinstance(datos.get("clave"), str) else ""
    sexo = _texto(datos.get("sexo"))

    errores = {}
    if not _es_nombre(nombre):
        errores["nombre"] = "Escribe tu nombre."
    if not _es_nombre(apellido):
        errores["apellido"] = "Escribe tu apellido."
    if not re.fullmatch(r"3\d{9}", celular):
        errores["celular"] = "Escribe un celular de 10 dígitos que empiece por 3."
    if len(correo) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", correo):
        errores["correo"] = "Escribe un correo válido."
    if len(clave.encode("utf-8")) > 72:
        errores["clave"] = "La contraseña es demasiado larga (máximo 72 caracteres)."
    elif not (len(clave) >= 8
              and any(c.isalpha() for c in clave)
              and any(c.isdigit() for c in clave)):
        errores["clave"] = "La contraseña necesita 8 caracteres o más, con letras y números."
    if sexo not in SEXOS:
        errores["sexo"] = "Elige una opción."

    limpios = {"nombre": nombre, "apellido": apellido, "celular": celular,
               "correo": correo, "clave": clave, "sexo": sexo}
    return limpios, errores


class RegistroServicio:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioRepositorio()

    def registrar(self, datos):
        limpios, errores = _validar(datos)
        if errores:
            raise ErrorValidacion(errores)

        clave_hash = bcrypt.hashpw(limpios["clave"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        usuario = Usuario(
            nombre=limpios["nombre"],
            apellido=limpios["apellido"],
            celular=limpios["celular"],
            correo=limpios["correo"],
            sexo=limpios["sexo"],
            clave_hash=clave_hash,
        )
        usuario.id = self.repositorio.crear(usuario)
        return usuario
