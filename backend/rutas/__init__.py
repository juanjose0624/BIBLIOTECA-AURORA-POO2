"""Registro centralizado de las rutas de la aplicación."""


def registrar_rutas(app):
    """Registra todos los blueprints de Biblioteca V2."""
    from rutas.auth import auth_bp
    from rutas.pqrs import pqrs_bp
    from rutas.paginas import paginas_bp
    from rutas.usuarios import usuarios_bp
    from rutas.libros import libros_bp
    from rutas.estadisticas import estadisticas_bp
    from rutas.prestamos import prestamos_bp

    app.register_blueprint(paginas_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(pqrs_bp)
    app.register_blueprint(usuarios_bp)
    app.register_blueprint(libros_bp)
    app.register_blueprint(prestamos_bp)
    app.register_blueprint(estadisticas_bp)