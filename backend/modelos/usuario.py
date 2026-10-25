
"""Modelo que representa a un usuario de la plataforma.

Almacena los datos personales, las credenciales cifradas mediante
hash y el rol de cada usuario dentro de Aurora Libris.
"""


class Usuario:
    def __init__(
        self,
        nombre,
        apellido,
        celular,
        correo,
        sexo,
        clave_hash,
        rol="usuario",
        id=None,
    ):
        self.id = id
        self.nombre = nombre
        self.apellido = apellido
        self.celular = celular
        self.correo = correo
        self.sexo = sexo
        self.clave_hash = clave_hash  # Hash de la contraseña, nunca la contraseña original.
        self.rol = rol

    def __repr__(self):
        return (
            f"Usuario(id={self.id}, "
            f"correo={self.correo!r}, "
            f"rol={self.rol!r})"
        )
