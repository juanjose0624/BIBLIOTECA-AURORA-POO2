"""Modelo: representa a un usuario de la plataforma."""


class Usuario:
    def __init__(self, nombre, apellido, celular, correo, sexo, clave_hash,
                 rol="usuario", id=None):
        self.id = id
        self.nombre = nombre
        self.apellido = apellido
        self.celular = celular
        self.correo = correo
        self.sexo = sexo
        self.clave_hash = clave_hash  # el hash de la contraseña, nunca la contraseña
        self.rol = rol

    def __repr__(self):
        return f"Usuario(id={self.id}, correo={self.correo!r}, rol={self.rol!r})"
