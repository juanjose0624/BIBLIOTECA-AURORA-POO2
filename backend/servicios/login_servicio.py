"""Servicio de autenticación de Aurora Libris.

Verifica las credenciales de los usuarios mediante hashes seguros
con bcrypt, valida el rol solicitado y aplica medidas para reducir
la posibilidad de identificar cuentas mediante respuestas o tiempos
de autenticación diferentes.
"""
import bcrypt

from repositorios.usuario_repositorio import UsuarioRepositorio

# Lo que manda el interruptor del login -> el rol tal como está en la base de datos
ROLES = {"usuario": "usuario", "admin": "administrador"}


class CredencialesInvalidas(Exception):
    """El correo no existe o la contraseña no es la correcta."""


class RolNoPermitido(Exception):
    """La contraseña es correcta, pero la cuenta no tiene el rol que se pidió."""

    def __init__(self, rol_real):
        super().__init__("Rol no permitido")
        self.rol_real = rol_real


# Hash de mentira. Se compara cuando el correo no existe, para que la respuesta
# tarde casi lo mismo y nadie pueda adivinar qué correos están registrados.
_HASH_FALSO = bcrypt.hashpw(b"contrasena-falsa", bcrypt.gensalt())


class LoginServicio:
    def __init__(self, repositorio=None):
        self.repositorio = repositorio or UsuarioRepositorio()

    def autenticar(self, correo, clave, rol_pedido):
        """Devuelve el Usuario si todo es correcto; si no, lanza una excepción."""
        correo = correo.strip().lower() if isinstance(correo, str) else ""
        clave = clave if isinstance(clave, str) else ""

        usuario = self.repositorio.buscar_por_correo(correo) if correo else None
        hash_guardado = usuario.clave_hash.encode("utf-8") if usuario else _HASH_FALSO

        clave_bytes = clave.encode("utf-8")
        if len(clave_bytes) > 72:  # bcrypt no admite más; no puede ser una contraseña real
            clave_correcta = False
        else:
            clave_correcta = bcrypt.checkpw(clave_bytes, hash_guardado)

        if usuario is None or not clave_correcta:
            raise CredencialesInvalidas()

        if usuario.rol != ROLES[rol_pedido]:
            raise RolNoPermitido(usuario.rol)

        return usuario