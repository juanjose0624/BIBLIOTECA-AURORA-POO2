"""Repositorio: la única parte del código que habla SQL con la tabla usuarios."""
import psycopg

from db import obtener_conexion
from modelos.usuario import Usuario


class CorreoYaRegistrado(Exception):
    """El correo ya existe en la tabla usuarios."""


class UsuarioRepositorio:
    def crear(self, usuario: Usuario) -> int:
        """Inserta un usuario y devuelve su id.

        No se envía el rol: la base de datos le pone 'usuario' por defecto.
        """
        sql = """
            INSERT INTO usuarios (nombre, apellido, celular, correo, clave_hash, sexo)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        valores = (usuario.nombre, usuario.apellido, usuario.celular,
                   usuario.correo, usuario.clave_hash, usuario.sexo)
        try:
            with obtener_conexion() as conexion:
                fila = conexion.execute(sql, valores).fetchone()
        except psycopg.errors.UniqueViolation:
            raise CorreoYaRegistrado(usuario.correo) from None
        return fila[0]

    def buscar_por_correo(self, correo: str):
        """Devuelve el Usuario con ese correo, o None si no existe."""
        return self._buscar("WHERE correo = %s", (correo,))

    def buscar_por_id(self, id_usuario: int):
        """Devuelve el Usuario con ese id, o None si no existe."""
        return self._buscar("WHERE id = %s", (id_usuario,))

    def _buscar(self, condicion, valores):
        sql = f"""
            SELECT id, nombre, apellido, celular, correo, sexo, clave_hash, rol
            FROM usuarios {condicion}
        """
        with obtener_conexion() as conexion:
            fila = conexion.execute(sql, valores).fetchone()
        if fila is None:
            return None
        return Usuario(id=fila[0], nombre=fila[1], apellido=fila[2], celular=fila[3],
                       correo=fila[4], sexo=fila[5], clave_hash=fila[6], rol=fila[7])

    def actualizar_datos(self, id_usuario, datos):
        sql = """
            UPDATE usuarios
            SET nombre = %s,
                apellido = %s,
                celular = %s,
                correo = %s,
                sexo = %s
            WHERE id = %s
        """

        valores = (
            datos["nombre"],
            datos["apellido"],
            datos["celular"],
            datos["correo"],
            datos["sexo"],
            id_usuario
        )

        try:
            with obtener_conexion() as conexion:
                resultado = conexion.execute(sql, valores)

                if resultado.rowcount == 0:
                    return False

        except psycopg.errors.UniqueViolation:
            raise CorreoYaRegistrado(datos["correo"]) from None

        return True