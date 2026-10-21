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
