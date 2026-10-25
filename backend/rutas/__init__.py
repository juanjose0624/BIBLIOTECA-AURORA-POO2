"""Módulo encargado de centralizar el registro de las rutas
y los blueprints de la aplicación Biblioteca V2.
"""

def registrar_rutas(app):
    """Registra todos los blueprints de Biblioteca V2."""
    from rutas.paginas import paginas_bp
    from rutas.auth import auth_bp
    from rutas.pqrs import pqrs_bp
    from rutas.usuarios import usuarios_bp
    from rutas.libros import libros_bp
    from rutas.prestamos import prestamos_bp
    from rutas.estadisticas import estadisticas_bp
    from rutas.tabla_posiciones import tabla_posiciones_bp

    blueprints = (
        paginas_bp,
        auth_bp,
        pqrs_bp,
        usuarios_bp,
        libros_bp,
        prestamos_bp,
        estadisticas_bp,
        tabla_posiciones_bp,
    )

    for blueprint in blueprints:
        app.register_blueprint(blueprint)