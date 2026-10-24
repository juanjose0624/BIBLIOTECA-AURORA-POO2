
"""Modelo: representa un libro de la biblioteca."""


class Libro:
    def __init__(
        self,
        titulo,
        autor,
        isbn=None,
        editorial=None,
        anio_publicacion=None,
        categoria=None,
        descripcion=None,
        cantidad_total=1,
        cantidad_disponible=1,
        id=None,
        creado_en=None,
    ):
        self.id = id
        self.titulo = titulo
        self.autor = autor
        self.isbn = isbn
        self.editorial = editorial
        self.anio_publicacion = anio_publicacion
        self.categoria = categoria
        self.descripcion = descripcion
        self.cantidad_total = cantidad_total
        self.cantidad_disponible = cantidad_disponible
        self.creado_en = creado_en

    def __repr__(self):
        return (
            f"Libro(id={self.id}, "
            f"titulo={self.titulo!r}, "
            f"autor={self.autor!r})"
        )
