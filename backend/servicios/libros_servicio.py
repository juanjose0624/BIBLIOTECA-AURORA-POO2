
"""Servicio: validaciones y reglas de negocio de los libros."""

from modelos.libro import Libro


class ErrorValidacionLibros(Exception):
    """Los datos recibidos para un libro no son válidos."""


class LibroNoEncontrado(Exception):
    """El libro solicitado no existe."""


class LibrosServicio:
    def __init__(self, repositorio):
        self.repositorio = repositorio

    def listar_todos(self):
        return self.repositorio.listar_todos()

    def buscar_por_id(self, id_libro):
        libro = self.repositorio.buscar_por_id(id_libro)

        if libro is None:
            raise LibroNoEncontrado(
                f"No existe un libro con ID {id_libro}."
            )

        return libro

    def crear(self, datos):
        datos = self._validar(datos)

        libro = Libro(
            titulo=datos["titulo"],
            autor=datos["autor"],
            isbn=datos["isbn"],
            editorial=datos["editorial"],
            anio_publicacion=datos["anio_publicacion"],
            categoria=datos["categoria"],
            descripcion=datos["descripcion"],
            cantidad_total=datos["cantidad_total"],
            cantidad_disponible=datos["cantidad_total"],
        )

        return self.repositorio.crear(libro)

    def actualizar(self, id_libro, datos):
        self.buscar_por_id(id_libro)
        datos = self._validar(datos)

        if not self.repositorio.actualizar(id_libro, datos):
            raise LibroNoEncontrado(
                f"No existe un libro con ID {id_libro}."
            )

        return True
    
    def eliminar(self, id_libro):
        """Elimina un libro después de comprobar que existe."""
        self.buscar_por_id(id_libro)

        if not self.repositorio.eliminar(id_libro):
            raise LibroNoEncontrado(
                f"No existe un libro con ID {id_libro}."
            )

        return True

    @staticmethod
    def _validar(datos):
        if not isinstance(datos, dict):
            raise ErrorValidacionLibros(
                "El cuerpo de la solicitud debe ser un objeto JSON."
            )

        titulo = datos.get("titulo")
        autor = datos.get("autor")

        if not isinstance(titulo, str) or not titulo.strip():
            raise ErrorValidacionLibros(
                "El título es obligatorio."
            )

        if not isinstance(autor, str) or not autor.strip():
            raise ErrorValidacionLibros(
                "El autor es obligatorio."
            )

        cantidad = datos.get(
            "cantidad_total",
            datos.get("cantidad"),
        )

        if isinstance(cantidad, bool) or not isinstance(cantidad, int):
            raise ErrorValidacionLibros(
                "La cantidad debe ser un número entero."
            )

        if cantidad < 1:
            raise ErrorValidacionLibros(
                "La cantidad debe ser al menos 1."
            )

        anio = datos.get("anio_publicacion")

        if anio in ("", None):
            anio = None
        elif isinstance(anio, bool) or not isinstance(anio, int):
            raise ErrorValidacionLibros(
                "El año de publicación debe ser un número entero."
            )
        elif not 1 <= anio <= 32767:
            raise ErrorValidacionLibros(
                "El año de publicación está fuera del rango permitido."
            )

        def texto_opcional(campo):
            valor = datos.get(campo)

            if valor is None or valor == "":
                return None

            if not isinstance(valor, str):
                raise ErrorValidacionLibros(
                    f"El campo {campo} debe ser texto."
                )

            valor = valor.strip()
            return valor or None

        return {
            "titulo": titulo.strip(),
            "autor": autor.strip(),
            "isbn": texto_opcional("isbn"),
            "editorial": texto_opcional("editorial"),
            "anio_publicacion": anio,
            "categoria": texto_opcional("categoria"),
            "descripcion": texto_opcional("descripcion"),
            "cantidad_total": cantidad,
        }
