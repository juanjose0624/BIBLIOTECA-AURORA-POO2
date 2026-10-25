
"""Servicio de gestión de solicitudes, préstamos y sanciones de Aurora Libris.

Centraliza las reglas de negocio para crear y consultar solicitudes,
aprobarlas o rechazarlas, registrar devoluciones y gestionar sanciones.
Valida identificadores, fechas y datos recibidos antes de ejecutar
las operaciones correspondientes en el repositorio.
"""
from datetime import date

from repositorios.prestamo_repositorio import PrestamoRepositorio


class ErrorValidacionPrestamos(ValueError):
    """Indica que los datos o la operación del préstamo no son válidos."""


class PrestamosServicio:
    """Coordina las operaciones del flujo de préstamos."""

    def __init__(self, repositorio=None):
        self.repositorio = repositorio or PrestamoRepositorio()

    def listar_todos(self):
        """Devuelve solicitudes y préstamos para la administración."""
        return self.repositorio.listar_todos()
    
    def listar_mis_prestamos(self, usuario_id):
        """Devuelve las solicitudes y préstamos de un usuario."""
        usuario_id = self._convertir_entero(
            usuario_id,
            "El identificador del usuario",
        )

        try:
            return self.repositorio.listar_mis_prestamos(usuario_id)
        except ValueError as error:
            raise ErrorValidacionPrestamos(str(error)) from error


    def crear_solicitud(self, usuario_id, datos):
        """Valida y registra una solicitud de préstamo."""
        if not isinstance(datos, dict):
            raise ErrorValidacionPrestamos(
                "Debes enviar los datos de la solicitud."
            )

        libro_id = self._convertir_entero(
            datos.get("libro_id"), "El identificador del libro"
        )

        try:
            return self.repositorio.crear_solicitud(
                usuario_id, libro_id
            )
        except ValueError as error:
            raise ErrorValidacionPrestamos(str(error)) from error

    def aprobar(
        self,
        solicitud_id,
        administrador_id,
        datos,
    ):
        """Valida las fechas y aprueba una solicitud pendiente."""
        if not isinstance(datos, dict):
            raise ErrorValidacionPrestamos(
                "Debes enviar las fechas del préstamo."
            )

        fecha_prestamo = self._convertir_fecha(
            datos.get("fecha_prestamo"),
            "La fecha del préstamo",
            obligatoria=False,
        ) or date.today()

        fecha_vencimiento = self._convertir_fecha(
            datos.get("fecha_vencimiento"),
            "La fecha de vencimiento",
        )

        if fecha_vencimiento < fecha_prestamo:
            raise ErrorValidacionPrestamos(
                "La fecha de vencimiento no puede ser anterior "
                "a la fecha del préstamo."
            )

        try:
            return self.repositorio.resolver_solicitud(
                solicitud_id=solicitud_id,
                administrador_id=administrador_id,
                aprobar=True,
                fecha_prestamo=fecha_prestamo,
                fecha_vencimiento=fecha_vencimiento,
            )
        except ValueError as error:
            raise ErrorValidacionPrestamos(str(error)) from error

    def rechazar(self, solicitud_id, administrador_id):
        """Rechaza una solicitud pendiente."""
        try:
            self.repositorio.resolver_solicitud(
                solicitud_id=solicitud_id,
                administrador_id=administrador_id,
                aprobar=False,
            )
        except ValueError as error:
            raise ErrorValidacionPrestamos(str(error)) from error

    def devolver(self, prestamo_id, datos=None):
        """Registra la devolución de un préstamo."""
        if datos is not None and not isinstance(datos, dict):
            raise ErrorValidacionPrestamos(
                "Los datos de la devolución no son válidos."
            )

        datos = datos or {}

        fecha_devolucion = self._convertir_fecha(
            datos.get("fecha_devolucion"),
            "La fecha de devolución",
            obligatoria=False,
        ) or date.today()

        try:
            self.repositorio.devolver(
                prestamo_id,
                fecha_devolucion,
            )
        except ValueError as error:
            raise ErrorValidacionPrestamos(str(error)) from error

    def crear_sancion(self, prestamo_id, administrador_id, datos):
        """Valida y registra una sanción por retraso."""
        if not isinstance(datos, dict):
            raise ErrorValidacionPrestamos(
                "Debes enviar los datos de la sanción."
            )

        dias_sancion = self._convertir_entero(
            datos.get("dias_sancion"),
            "Los días de sanción",
        )

        motivo = datos.get("motivo")

        if not isinstance(motivo, str) or not motivo.strip():
            raise ErrorValidacionPrestamos(
                "El motivo de la sanción es obligatorio."
            )

        if len(motivo.strip()) > 1000:
            raise ErrorValidacionPrestamos(
                "El motivo no puede superar los 1000 caracteres."
            )

        try:
            self.repositorio.crear_sancion(
                prestamo_id=prestamo_id,
                administrador_id=administrador_id,
                dias_sancion=dias_sancion,
                motivo=motivo,
            )
        except ValueError as error:
            raise ErrorValidacionPrestamos(str(error)) from error

    @staticmethod
    def _convertir_entero(valor, nombre):
        """Convierte un valor a entero y rechaza formatos inválidos."""
        if isinstance(valor, bool):
            raise ErrorValidacionPrestamos(
                f"{nombre} debe ser un número entero válido."
            )

        try:
            convertido = int(valor)
        except (TypeError, ValueError):
            raise ErrorValidacionPrestamos(
                f"{nombre} debe ser un número entero válido."
            ) from None

        if isinstance(valor, float) and not valor.is_integer():
            raise ErrorValidacionPrestamos(
                f"{nombre} debe ser un número entero válido."
            )

        if isinstance(valor, str) and str(convertido) != valor.strip():
            raise ErrorValidacionPrestamos(
                f"{nombre} debe ser un número entero válido."
            )

        if convertido < 1:
            raise ErrorValidacionPrestamos(
                f"{nombre} debe ser mayor que cero."
            )

        return convertido

    @staticmethod
    def _convertir_fecha(valor, nombre, obligatoria=True):
        """Convierte una fecha ISO YYYY-MM-DD en datetime.date."""
        if valor is None or valor == "":
            if obligatoria:
                raise ErrorValidacionPrestamos(
                    f"{nombre} es obligatoria."
                )
            return None

        if not isinstance(valor, str):
            raise ErrorValidacionPrestamos(
                f"{nombre} debe tener el formato AAAA-MM-DD."
            )

        try:
            fecha = date.fromisoformat(valor)
        except ValueError:
            raise ErrorValidacionPrestamos(
                f"{nombre} debe tener el formato AAAA-MM-DD."
            ) from None

        if fecha.isoformat() != valor:
            raise ErrorValidacionPrestamos(
                f"{nombre} debe tener el formato AAAA-MM-DD."
            )

        return fecha
