
"""Servicio de gestión y validación de PQRS de Aurora Libris.

Centraliza las reglas de negocio para registrar, consultar,
actualizar y eliminar peticiones, quejas, reclamos y sugerencias,
validando los datos de contacto, el contenido de los mensajes,
los estados de las solicitudes y las respuestas administrativas.
"""
import re

from repositorios.pqrs_repositorio import PqrsRepositorio


class PqrsServicio:
    """Valida y gestiona solicitudes PQRS."""

    TIPOS_VALIDOS = {
        "peticion",
        "queja",
        "reclamo",
        "sugerencia",
    }

    ESTADOS_VALIDOS = {
        "pendiente",
        "en_revision",
        "respondida",
        "cerrada",
    }

    def __init__(self):
        self.repositorio = PqrsRepositorio()

    def crear(self, datos):
        """Valida y registra una solicitud pública."""
        if not isinstance(datos, dict):
            raise ValueError("Los datos enviados no son válidos.")

        campos = ("nombre", "apellido", "correo", "tipo", "mensaje")

        if any(
            not isinstance(datos.get(campo), str)
            for campo in campos
        ):
            raise ValueError("Debes completar todos los campos.")

        datos = {
            campo: datos[campo].strip()
            for campo in campos
        }

        if not 2 <= len(datos["nombre"]) <= 120:
            raise ValueError(
                "El nombre debe tener entre 2 y 120 caracteres."
            )

        if not 2 <= len(datos["apellido"]) <= 120:
            raise ValueError(
                "El apellido debe tener entre 2 y 120 caracteres."
            )

        if not re.fullmatch(
            r"[^\s@]+@[^\s@]+\.[^\s@]+",
            datos["correo"],
        ):
            raise ValueError("Escribe un correo electrónico válido.")

        if len(datos["correo"]) > 254:
            raise ValueError("El correo supera la longitud permitida.")

        datos["correo"] = datos["correo"].lower()

        if datos["tipo"] not in self.TIPOS_VALIDOS:
            raise ValueError(
                "Selecciona un tipo de solicitud válido."
            )

        if not 5 <= len(datos["mensaje"]) <= 600:
            raise ValueError(
                "El mensaje debe tener entre 5 y 600 caracteres."
            )

        identificador = self.repositorio.crear(datos)

        return {
            "id": identificador,
            "mensaje": "Tu solicitud se registró correctamente.",
        }

    def listar(self):
        """Obtiene todas las solicitudes para el panel administrativo."""
        return self.repositorio.listar()

    def actualizar(self, identificador, datos):
        """Valida y actualiza el estado y la respuesta."""
        if not isinstance(datos, dict):
            raise ValueError("Los datos enviados no son válidos.")

        estado = datos.get("estado")
        respuesta = datos.get("respuesta", "")

        if not isinstance(estado, str):
            raise ValueError("Selecciona un estado válido.")

        estado = estado.strip()

        if estado not in self.ESTADOS_VALIDOS:
            raise ValueError("El estado seleccionado no es válido.")

        if not isinstance(respuesta, str):
            raise ValueError("La respuesta debe ser texto.")

        respuesta = respuesta.strip()

        if len(respuesta) > 5000:
            raise ValueError(
                "La respuesta no puede superar los 5000 caracteres."
            )

        if estado == "respondida" and not respuesta:
            raise ValueError(
                "Debes escribir una respuesta antes de marcar "
                "la solicitud como respondida."
            )

        actualizado = self.repositorio.actualizar(
            identificador,
            estado,
            respuesta or None,
        )

        if not actualizado:
            return None

        return {
            "id": identificador,
            "mensaje": "La solicitud se actualizó correctamente.",
        }

    def eliminar(self, identificador):
        """Elimina una solicitud existente."""
        return self.repositorio.eliminar(identificador)
