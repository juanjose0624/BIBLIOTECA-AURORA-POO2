
"""Repositorio: la única parte del código que habla SQL con libros."""

from db import obtener_conexion
from modelos.libro import Libro


class LibroRepositorio:
    def listar_todos(self):
        """Devuelve todos los libros registrados."""
        sql = """
            SELECT
                id, titulo, autor, isbn, editorial,
                anio_publicacion, categoria, descripcion,
                cantidad_total, cantidad_disponible, creado_en
            FROM libros
            ORDER BY id DESC
        """

        with obtener_conexion() as conexion:
            filas = conexion.execute(sql).fetchall()

        return [self._convertir_libro(fila) for fila in filas]

    def buscar_por_id(self, id_libro):
        """Devuelve un libro por su ID o None."""
        sql = """
            SELECT
                id, titulo, autor, isbn, editorial,
                anio_publicacion, categoria, descripcion,
                cantidad_total, cantidad_disponible, creado_en
            FROM libros
            WHERE id = %s
        """

        with obtener_conexion() as conexion:
            fila = conexion.execute(sql, (id_libro,)).fetchone()

        return self._convertir_libro(fila) if fila else None

    def eliminar(self, id_libro):
        """Elimina un libro y devuelve si existía."""
        sql = """
            DELETE FROM libros
            WHERE id = %s
            RETURNING id
        """

        with obtener_conexion() as conexion:
            fila = conexion.execute(sql, (id_libro,)).fetchone()

        return fila is not None

    def crear(self, libro: Libro) -> int:
        """Registra un libro y devuelve su ID."""
        sql = """
            INSERT INTO libros (
                titulo, autor, isbn, editorial, anio_publicacion,
                categoria, descripcion, cantidad_total,
                cantidad_disponible
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """

        valores = (
            libro.titulo,
            libro.autor,
            libro.isbn,
            libro.editorial,
            libro.anio_publicacion,
            libro.categoria,
            libro.descripcion,
            libro.cantidad_total,
            libro.cantidad_disponible,
        )

        with obtener_conexion() as conexion:
            fila = conexion.execute(sql, valores).fetchone()

        return fila[0]

    def actualizar(self, id_libro, datos):
        """Actualiza un libro y ajusta su disponibilidad."""

        with obtener_conexion() as conexion:
            fila_actual = conexion.execute(
                """
                SELECT cantidad_total, cantidad_disponible
                FROM libros
                WHERE id = %s
                FOR UPDATE
                """,
                (id_libro,),
            ).fetchone()

            if fila_actual is None:
                return False

            total_anterior, disponibles_anteriores = fila_actual

            # Conserva los ejemplares que no están disponibles.
            no_disponibles = total_anterior - disponibles_anteriores
            nuevo_total = datos["cantidad_total"]

            if nuevo_total < no_disponibles:
                raise ValueError(
                    "La cantidad total no puede ser menor que "
                    "los ejemplares no disponibles."
                )

            nuevos_disponibles = nuevo_total - no_disponibles

            sql = """
                UPDATE libros
                SET titulo = %s,
                    autor = %s,
                    isbn = %s,
                    editorial = %s,
                    anio_publicacion = %s,
                    categoria = %s,
                    descripcion = %s,
                    cantidad_total = %s,
                    cantidad_disponible = %s
                WHERE id = %s
            """

            valores = (
                datos["titulo"],
                datos["autor"],
                datos.get("isbn"),
                datos.get("editorial"),
                datos.get("anio_publicacion"),
                datos.get("categoria"),
                datos.get("descripcion"),
                nuevo_total,
                nuevos_disponibles,
                id_libro,
            )

            conexion.execute(sql, valores)

        return True

    @staticmethod
    def _convertir_libro(fila):
        """Convierte una fila SQL en un objeto Libro."""
        return Libro(
            id=fila[0],
            titulo=fila[1],
            autor=fila[2],
            isbn=fila[3],
            editorial=fila[4],
            anio_publicacion=fila[5],
            categoria=fila[6],
            descripcion=fila[7],
            cantidad_total=fila[8],
            cantidad_disponible=fila[9],
            creado_en=fila[10],
        )
