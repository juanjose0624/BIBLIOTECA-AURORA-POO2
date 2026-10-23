
"""Repositorio: la única parte del código que habla SQL con usuarios."""

import psycopg

from db import obtener_conexion
from modelos.usuario import Usuario


class CorreoYaRegistrado(Exception):
    """El correo ya existe en la tabla usuarios."""


class UltimoAdministrador(Exception):
    """La operación dejaría el sistema sin administradores."""


class UsuarioRepositorio:
    def crear(self, usuario: Usuario) -> int:
        """Inserta un usuario con el rol indicado."""
        sql = """
            INSERT INTO usuarios (
                nombre, apellido, celular, correo,
                clave_hash, sexo, rol
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """

        valores = (
            usuario.nombre,
            usuario.apellido,
            usuario.celular,
            usuario.correo,
            usuario.clave_hash,
            usuario.sexo,
            usuario.rol,
        )

        try:
            with obtener_conexion() as conexion:
                fila = conexion.execute(sql, valores).fetchone()
        except psycopg.errors.UniqueViolation:
            raise CorreoYaRegistrado(usuario.correo) from None

        return fila[0]

    def obtener_fecha_creacion(self, id_usuario):
        """Devuelve la fecha de creación de un usuario."""
        sql = """
            SELECT creado_en
            FROM usuarios
            WHERE id = %s
        """

        with obtener_conexion() as conexion:
            fila = conexion.execute(sql, (id_usuario,)).fetchone()

        return fila[0].isoformat() if fila else None

    def buscar_por_correo(self, correo: str):
        """Devuelve el usuario con ese correo, o None."""
        return self._buscar("WHERE correo = %s", (correo,))

    def buscar_por_id(self, id_usuario: int):
        """Devuelve el usuario con ese ID, o None."""
        return self._buscar("WHERE id = %s", (id_usuario,))

    def _buscar(self, condicion, valores):
        sql = f"""
            SELECT
                id, nombre, apellido, celular, correo,
                sexo, clave_hash, rol
            FROM usuarios
            {condicion}
        """

        with obtener_conexion() as conexion:
            fila = conexion.execute(sql, valores).fetchone()

        if fila is None:
            return None

        return Usuario(
            id=fila[0],
            nombre=fila[1],
            apellido=fila[2],
            celular=fila[3],
            correo=fila[4],
            sexo=fila[5],
            clave_hash=fila[6],
            rol=fila[7],
        )

    def listar_todos(self):
        """Devuelve todos los usuarios."""
        sql = """
            SELECT
                id, nombre, apellido, celular, correo,
                sexo, clave_hash, rol
            FROM usuarios
            ORDER BY id
        """

        with obtener_conexion() as conexion:
            filas = conexion.execute(sql).fetchall()

        return [
            Usuario(
                id=fila[0],
                nombre=fila[1],
                apellido=fila[2],
                celular=fila[3],
                correo=fila[4],
                sexo=fila[5],
                clave_hash=fila[6],
                rol=fila[7],
            )
            for fila in filas
        ]

    def actualizar_datos(self, id_usuario, datos):
        """Actualiza los datos personales de una cuenta."""
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
            id_usuario,
        )

        try:
            with obtener_conexion() as conexion:
                resultado = conexion.execute(sql, valores)

                if resultado.rowcount == 0:
                    return False

        except psycopg.errors.UniqueViolation:
            raise CorreoYaRegistrado(datos["correo"]) from None

        return True

    def actualizar_rol(self, id_usuario, rol):
        """Cambia el rol sin permitir eliminar al último administrador."""
        with obtener_conexion() as conexion:
            with conexion.transaction():
                conexion.execute(
                    "LOCK TABLE usuarios IN EXCLUSIVE MODE"
                )

                usuario = conexion.execute(
                    "SELECT rol FROM usuarios WHERE id = %s",
                    (id_usuario,),
                ).fetchone()

                if usuario is None:
                    return False

                rol_actual = usuario[0]

                if (
                    rol_actual == "administrador"
                    and rol != "administrador"
                ):
                    cantidad = conexion.execute(
                        """
                        SELECT COUNT(*)
                        FROM usuarios
                        WHERE rol = 'administrador'
                        """
                    ).fetchone()[0]

                    if cantidad <= 1:
                        raise UltimoAdministrador()

                conexion.execute(
                    "UPDATE usuarios SET rol = %s WHERE id = %s",
                    (rol, id_usuario),
                )

        return True

    def actualizar_clave_hash(self, id_usuario, clave_hash):
        """Actualiza únicamente el hash de contraseña."""
        with obtener_conexion() as conexion:
            resultado = conexion.execute(
                """
                UPDATE usuarios
                SET clave_hash = %s
                WHERE id = %s
                """,
                (clave_hash, id_usuario),
            )

        return resultado.rowcount > 0

    def eliminar(self, id_usuario):
        """Elimina un usuario sin borrar al último administrador."""
        with obtener_conexion() as conexion:
            with conexion.transaction():
                conexion.execute(
                    "LOCK TABLE usuarios IN EXCLUSIVE MODE"
                )

                usuario = conexion.execute(
                    "SELECT rol FROM usuarios WHERE id = %s",
                    (id_usuario,),
                ).fetchone()

                if usuario is None:
                    return False

                if usuario[0] == "administrador":
                    cantidad = conexion.execute(
                        """
                        SELECT COUNT(*)
                        FROM usuarios
                        WHERE rol = 'administrador'
                        """
                    ).fetchone()[0]

                    if cantidad <= 1:
                        raise UltimoAdministrador()

                resultado = conexion.execute(
                    "DELETE FROM usuarios WHERE id = %s",
                    (id_usuario,),
                )

        return resultado.rowcount > 0
