
"""Servicio de gestión administrativa de usuarios de Aurora Libris.

Centraliza las reglas de negocio para validar, crear, consultar,
actualizar y eliminar cuentas, incluyendo la gestión de roles,
la actualización de datos personales y la protección de contraseñas
mediante hashes con bcrypt.
"""
import re

import bcrypt

from modelos.usuario import Usuario
from repositorios.usuario_repositorio import (
    CorreoYaRegistrado,
    UltimoAdministrador,
    UsuarioRepositorio,
)


ROLES_PERMITIDOS = {"usuario", "administrador"}
SEXOS_PERMITIDOS = {"femenino", "masculino", "no_indica"}


class ErrorValidacionUsuarios(Exception):
    """Contiene los errores de validación de los datos del usuario."""

    def __init__(self, errores):
        super().__init__("Los datos del usuario no son válidos.")
        self.errores = errores


class UsuarioNoEncontrado(Exception):
    """Indica que el usuario solicitado no existe."""


class UsuariosServicio:
    """Centraliza las reglas de negocio del CRUD de usuarios."""

    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioRepositorio()

    @staticmethod
    def _texto(valor):
        return valor.strip() if isinstance(valor, str) else ""

    @staticmethod
    def _es_nombre(valor):
        return (
            2 <= len(valor) <= 60
            and valor[0].isalpha()
            and all(
                caracter.isalpha()
                or caracter.isspace()
                or caracter in ("'", "’", "-")
                for caracter in valor
            )
        )

    def _validar_datos(self, datos, crear=False):
        """Valida y normaliza los campos del usuario."""

        errores = {}

        nombre = " ".join(self._texto(datos.get("nombre")).split())
        apellido = " ".join(self._texto(datos.get("apellido")).split())
        celular = re.sub(r"\D", "", self._texto(datos.get("celular")))
        correo = self._texto(datos.get("correo")).lower()
        sexo = self._texto(datos.get("sexo"))
        rol = self._texto(datos.get("rol"))

        clave = datos.get("clave", "")
        clave = clave if isinstance(clave, str) else ""

        if not self._es_nombre(nombre):
            errores["nombre"] = (
                "El nombre debe tener entre 2 y 60 caracteres "
                "y contener letras válidas."
            )

        if not self._es_nombre(apellido):
            errores["apellido"] = (
                "El apellido debe tener entre 2 y 60 caracteres "
                "y contener letras válidas."
            )

        if not re.fullmatch(r"3\d{9}", celular):
            errores["celular"] = (
                "Ingresa un celular colombiano válido de 10 dígitos."
            )

        if (
            len(correo) > 254
            or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", correo)
        ):
            errores["correo"] = "Ingresa un correo electrónico válido."

        if sexo not in SEXOS_PERMITIDOS:
            errores["sexo"] = "Selecciona una opción de sexo válida."

        if rol not in ROLES_PERMITIDOS:
            errores["rol"] = "Selecciona un rol válido."

        if crear or clave:
            if len(clave.encode("utf-8")) > 72:
                errores["clave"] = (
                    "La contraseña no puede superar 72 bytes en UTF-8."
                )
            elif (
                len(clave) < 8
                or not any(caracter.isalpha() for caracter in clave)
                or not any(caracter.isdigit() for caracter in clave)
            ):
                errores["clave"] = (
                    "La contraseña debe tener al menos 8 caracteres, "
                    "una letra y un número."
                )

        if errores:
            raise ErrorValidacionUsuarios(errores)

        return {
            "nombre": nombre,
            "apellido": apellido,
            "celular": celular,
            "correo": correo,
            "sexo": sexo,
            "rol": rol,
            "clave": clave,
        }

    def crear(self, datos):
        """Crea una cuenta con contraseña obligatoria."""

        datos = self._validar_datos(datos, crear=True)

        clave_hash = bcrypt.hashpw(
            datos["clave"].encode("utf-8"),
            bcrypt.gensalt(),
        ).decode("utf-8")

        usuario = Usuario(
            nombre=datos["nombre"],
            apellido=datos["apellido"],
            celular=datos["celular"],
            correo=datos["correo"],
            sexo=datos["sexo"],
            clave_hash=clave_hash,
            rol="usuario",
        )

        self.repositorio.crear(usuario)

        usuario_creado = self.repositorio.buscar_por_correo(
            datos["correo"]
        )

        if usuario_creado is None:
            raise RuntimeError(
                "La cuenta se creó, pero no fue posible recuperarla."
            )

        # El repositorio actual asigna inicialmente el rol usuario.
        # Si se solicita administrador, se actualiza después de crear.
        if datos["rol"] == "administrador":
            self.repositorio.actualizar_rol(
                usuario_creado.id,
                "administrador",
            )

        return self.repositorio.buscar_por_id(usuario_creado.id)

    def listar(self):
        """Devuelve todos los usuarios registrados."""
        return self.repositorio.listar_todos()

    def obtener(self, id_usuario):
        """Busca un usuario por su identificador."""

        usuario = self.repositorio.buscar_por_id(id_usuario)

        if usuario is None:
            raise UsuarioNoEncontrado()

        return usuario

    def actualizar(self, id_usuario, datos):
        """Actualiza datos personales, rol y, opcionalmente, contraseña."""

        usuario_actual = self.obtener(id_usuario)
        datos = self._validar_datos(datos)

        actualizado = self.repositorio.actualizar_datos(
            id_usuario,
            {
                "nombre": datos["nombre"],
                "apellido": datos["apellido"],
                "celular": datos["celular"],
                "correo": datos["correo"],
                "sexo": datos["sexo"],
            },
        )

        if not actualizado:
            raise UsuarioNoEncontrado()

        if usuario_actual.rol != datos["rol"]:
            self.repositorio.actualizar_rol(
                id_usuario,
                datos["rol"],
            )

        if datos["clave"]:
            clave_hash = bcrypt.hashpw(
                datos["clave"].encode("utf-8"),
                bcrypt.gensalt(),
            ).decode("utf-8")

            self.repositorio.actualizar_clave_hash(
                id_usuario,
                clave_hash,
            )

        return self.obtener(id_usuario)

    def eliminar(self, id_usuario):
        """Elimina una cuenta respetando la protección de administradores."""

        self.obtener(id_usuario)

        eliminado = self.repositorio.eliminar(id_usuario)

        if not eliminado:
            raise UsuarioNoEncontrado()

        return True
