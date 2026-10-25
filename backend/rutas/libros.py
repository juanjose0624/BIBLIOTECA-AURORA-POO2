
"""Módulo de rutas del CRUD de libros de Aurora Libris.

Gestiona la consulta, creación, actualización y eliminación
de libros mediante la API, restringiendo las operaciones
de modificación a los usuarios con rol de administrador.
"""
from flask import Blueprint, jsonify, request

from servicios.permisos import requiere_admin
from servicios.libros_servicio import (
    ErrorValidacionLibros,
    LibroNoEncontrado,
    LibrosServicio,
)
from repositorios.libro_repositorio import LibroRepositorio

libros_bp = Blueprint("libros", __name__, url_prefix="/api/libros")

servicio = LibrosServicio(LibroRepositorio())


def _libro_a_dict(libro):
    """Convierte un libro en un diccionario serializable como JSON."""
    return {
        "id": libro.id,
        "titulo": libro.titulo,
        "autor": libro.autor,
        "isbn": libro.isbn,
        "editorial": libro.editorial,
        "anio_publicacion": libro.anio_publicacion,
        "categoria": libro.categoria,
        "descripcion": libro.descripcion,
        "cantidad_total": libro.cantidad_total,
        "cantidad_disponible": libro.cantidad_disponible,
        "creado_en": (
            libro.creado_en.isoformat()
            if libro.creado_en
            else None
        ),
    }


@libros_bp.get("")
def listar_libros():
    """Devuelve todos los libros."""
    libros = servicio.listar_todos()
    return jsonify([_libro_a_dict(libro) for libro in libros]), 200


@libros_bp.get("/<int:id_libro>")
def obtener_libro(id_libro):
    """Devuelve un libro por su ID."""
    try:
        libro = servicio.buscar_por_id(id_libro)
    except LibroNoEncontrado as error:
        return jsonify({"error": str(error)}), 404

    return jsonify(_libro_a_dict(libro)), 200


@libros_bp.post("")
@requiere_admin
def crear_libro():
    """Registra un libro."""
    datos = request.get_json(silent=True)

    try:
        id_libro = servicio.crear(datos)
        libro = servicio.buscar_por_id(id_libro)
    except ErrorValidacionLibros as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(_libro_a_dict(libro)), 201


@libros_bp.put("/<int:id_libro>")
@requiere_admin
def actualizar_libro(id_libro):
    """Actualiza los datos de un libro."""
    datos = request.get_json(silent=True)

    try:
        servicio.actualizar(id_libro, datos)
        libro = servicio.buscar_por_id(id_libro)
    except ErrorValidacionLibros as error:
        return jsonify({"error": str(error)}), 400
    except LibroNoEncontrado as error:
        return jsonify({"error": str(error)}), 404
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(_libro_a_dict(libro)), 200


@libros_bp.delete("/<int:id_libro>")
@requiere_admin
def eliminar_libro(id_libro):
    """Elimina un libro por su ID."""
    try:
        servicio.eliminar(id_libro)
    except LibroNoEncontrado as error:
        return jsonify({"error": str(error)}), 404

    return jsonify({
        "mensaje": "Libro eliminado correctamente."
    }), 200
