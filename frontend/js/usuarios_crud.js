
"use strict";

/* =========================================================
   AURORA LIBRIS — CRUD DE USUARIOS
   Archivo: frontend/js/usuarios_crud.js

   API esperada:
   GET     /api/usuarios
   POST    /api/usuarios
   PATCH   /api/usuarios/:id
   DELETE  /api/usuarios/:id
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------
    // ELEMENTOS DEL DOM
    // -----------------------------------------------------

    const tablaUsuarios = document.getElementById("tablaUsuarios");
    const buscarUsuario = document.getElementById("buscarUsuario");
    const filtroRol = document.getElementById("filtroRol");

    const btnNuevoUsuario = document.getElementById("btnNuevoUsuario");
    const btnActualizar = document.getElementById("btnActualizar");
    const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

    const modalUsuario = document.getElementById("modalUsuario");
    const formularioUsuario = document.getElementById("formularioUsuario");
    const tituloModalUsuario = document.getElementById("tituloModalUsuario");
    const descripcionModalUsuario = document.getElementById(
        "descripcionModalUsuario"
    );

const usuarioId = document.getElementById("usuarioId");
const nombreUsuario = document.getElementById("nombreUsuario");
const apellidoUsuario = document.getElementById("apellidoUsuario");
const celularUsuario = document.getElementById("celularUsuario");
const correoUsuario = document.getElementById("correoUsuario");
const sexoUsuario = document.getElementById("sexoUsuario");
const rolUsuario = document.getElementById("rolUsuario");
const contrasenaUsuario = document.getElementById("contrasenaUsuario");
const ayudaContrasena = document.getElementById("ayudaContrasena");

    const btnCerrarModal = document.getElementById("btnCerrarModal");
    const btnCancelarUsuario = document.getElementById("btnCancelarUsuario");
    const btnGuardarUsuario = document.getElementById("btnGuardarUsuario");

    const modalEliminarUsuario = document.getElementById(
        "modalEliminarUsuario"
    );
    const mensajeEliminarUsuario = document.getElementById(
        "mensajeEliminarUsuario"
    );
    const btnCancelarEliminar = document.getElementById(
        "btnCancelarEliminar"
    );
    const btnConfirmarEliminar = document.getElementById(
        "btnConfirmarEliminar"
    );

    const mensajeEstado = document.getElementById("mensajeEstado");

    const totalUsuarios = document.getElementById("totalUsuarios");
    const totalAdministradores = document.getElementById(
        "totalAdministradores"
    );
    const totalRegulares = document.getElementById("totalRegulares");
    const contadorRegistros = document.getElementById("contadorRegistros");
    const textoPaginacion = document.getElementById("textoPaginacion");

    // -----------------------------------------------------
    // CONFIGURACIÓN
    // -----------------------------------------------------

    const API_USUARIOS = "/api/usuarios";

    let usuarios = [];
    let usuarioPendienteEliminar = null;
    let cargando = false;

    // -----------------------------------------------------
    // UTILIDADES
    // -----------------------------------------------------

    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, (caracter) => {
            const entidades = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entidades[caracter];
        });
    }

    function mostrarMensaje(texto, tipo = "exito") {
        mensajeEstado.textContent = texto;
        mensajeEstado.className = `mensaje-estado ${tipo}`;
        mensajeEstado.hidden = false;

        mensajeEstado.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    function ocultarMensaje() {
        mensajeEstado.hidden = true;
        mensajeEstado.textContent = "";
        mensajeEstado.className = "mensaje-estado";
    }

    async function procesarRespuesta(respuesta) {
        const contenido = await respuesta.text();
        let datos = {};

        if (contenido) {
            try {
                datos = JSON.parse(contenido);
            } catch {
                datos = { mensaje: contenido };
            }
        }

        if (!respuesta.ok) {
            const mensaje =
                datos.mensaje ||
                datos.error ||
                `Error en la solicitud (${respuesta.status}).`;

            throw new Error(mensaje);
        }

        return datos;
    }

    async function solicitarAPI(url, opciones = {}) {
        const respuesta = await fetch(url, {
            credentials: "same-origin",
            ...opciones,
            headers: {
                Accept: "application/json",
                ...(opciones.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...opciones.headers
            }
        });

        return procesarRespuesta(respuesta);
    }

    function obtenerNombreCompleto(usuario) {
        return usuario.nombre || "Usuario sin nombre";
    }

    function obtenerIniciales(nombre) {
        const partes = String(nombre || "").trim().split(/\s+/);

        return partes
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte.charAt(0))
            .join("")
            .toUpperCase() || "U";
    }

    function obtenerRolNormalizado(rol) {
        const valor = String(rol || "").trim().toLowerCase();

        if (valor === "administrador" || valor === "admin") {
            return "administrador";
        }

        return "usuario";
    }

    function obtenerNombreRol(rol) {
        return obtenerRolNormalizado(rol) === "administrador"
            ? "Administrador"
            : "Usuario";
    }

    function obtenerFecha(usuario) {
        const fecha =
            usuario.creado_en ||
            usuario.fecha_registro ||
            usuario.created_at;

        if (!fecha) {
            return "No disponible";
        }

        const fechaValida = new Date(fecha);

        if (Number.isNaN(fechaValida.getTime())) {
            return "No disponible";
        }

        return fechaValida.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // -----------------------------------------------------
    // RESUMEN
    // -----------------------------------------------------

    function actualizarResumen(lista = usuarios) {
        const administradores = lista.filter(
            (usuario) =>
                obtenerRolNormalizado(usuario.rol) === "administrador"
        ).length;

        totalUsuarios.textContent = lista.length;
        totalAdministradores.textContent = administradores;
        totalRegulares.textContent = lista.length - administradores;
        contadorRegistros.textContent =
            `${lista.length} ${lista.length === 1 ? "registro" : "registros"}`;
    }

    // -----------------------------------------------------
    // TABLA
    // -----------------------------------------------------

    function obtenerUsuariosFiltrados() {
        const texto = buscarUsuario.value.trim().toLowerCase();
        const rolSeleccionado = filtroRol.value;

        return usuarios.filter((usuario) => {
            const nombre = String(usuario.nombre || "").toLowerCase();
            const correo = String(usuario.correo || "").toLowerCase();
            const coincideTexto =
                nombre.includes(texto) || correo.includes(texto);

            const coincideRol =
                !rolSeleccionado ||
                obtenerRolNormalizado(usuario.rol) === rolSeleccionado;

            return coincideTexto && coincideRol;
        });
    }

    function renderizarTabla() {
        const filtrados = obtenerUsuariosFiltrados();

        actualizarResumen(usuarios);

        textoPaginacion.textContent =
            `Mostrando ${filtrados.length} de ${usuarios.length} usuarios`;

        if (filtrados.length === 0) {
            tablaUsuarios.innerHTML = `
                <tr>
                    <td colspan="5" class="estado-tabla">
                        <i class="fa-solid fa-user-slash" aria-hidden="true"></i>
                        <p>No se encontraron usuarios.</p>
                        <span>
                            Prueba con otra búsqueda o cambia los filtros.
                        </span>
                    </td>
                </tr>
            `;

            return;
        }

        tablaUsuarios.innerHTML = filtrados.map((usuario) => {
            const id = escaparHTML(usuario.id);
            const nombre = escaparHTML(obtenerNombreCompleto(usuario));
            const correo = escaparHTML(usuario.correo || "Sin correo");
            const iniciales = escaparHTML(
                obtenerIniciales(usuario.nombre)
            );

            const rol = obtenerRolNormalizado(usuario.rol);
            const claseRol =
                rol === "administrador"
                    ? "rol-administrador"
                    : "rol-usuario";

            const nombreRol = obtenerNombreRol(usuario.rol);
            const fecha = escaparHTML(obtenerFecha(usuario));

            return `
                <tr>
                    <td>
                        <div class="usuario-celda">
                            <div class="usuario-avatar" aria-hidden="true">
                                ${iniciales}
                            </div>

                            <div class="usuario-datos">
                                <span class="usuario-nombre">
                                    ${nombre}
                                </span>

                                <span class="usuario-identificador">
                                    ID: ${id}
                                </span>
                            </div>
                        </div>
                    </td>

                    <td>
                        <span class="correo-celda" title="${correo}">
                            ${correo}
                        </span>
                    </td>

                    <td>
                        <span class="etiqueta-rol ${claseRol}">
                            <i
                                class="fa-solid ${
                                    rol === "administrador"
                                        ? "fa-user-shield"
                                        : "fa-user"
                                }"
                                aria-hidden="true"
                            ></i>
                            ${nombreRol}
                        </span>
                    </td>

                    <td>${fecha}</td>

                    <td>
                        <div class="acciones-tabla">
                            <button
                                type="button"
                                class="boton-icono"
                                data-accion="editar"
                                data-id="${id}"
                                aria-label="Editar ${nombre}"
                                title="Editar usuario"
                            >
                                <i class="fa-solid fa-pen" aria-hidden="true"></i>
                            </button>

                            <button
                                type="button"
                                class="boton-icono eliminar"
                                data-accion="eliminar"
                                data-id="${id}"
                                aria-label="Eliminar ${nombre}"
                                title="Eliminar usuario"
                            >
                                <i class="fa-solid fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // -----------------------------------------------------
    // CARGAR USUARIOS
    // -----------------------------------------------------

    async function cargarUsuarios() {
        if (cargando) {
            return;
        }

        cargando = true;
        btnActualizar.disabled = true;

        tablaUsuarios.innerHTML = `
            <tr>
                <td colspan="5" class="estado-tabla">
                    <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                    <p>Cargando usuarios...</p>
                </td>
            </tr>
        `;

        try {
            const datos = await solicitarAPI(API_USUARIOS);

            // Admite una lista directa o un objeto con la propiedad usuarios.
            const lista = Array.isArray(datos)
                ? datos
                : datos.usuarios;

            if (!Array.isArray(lista)) {
                throw new Error(
                    "La API no devolvió una lista válida de usuarios."
                );
            }

            usuarios = lista;
            renderizarTabla();
        } catch (error) {
            tablaUsuarios.innerHTML = `
                <tr>
                    <td colspan="5" class="estado-tabla">
                        <i
                            class="fa-solid fa-triangle-exclamation"
                            aria-hidden="true"
                        ></i>
                        <p>No fue posible cargar los usuarios.</p>
                        <span>
                            Verifica la conexión con el backend y las rutas de la API.
                        </span>
                    </td>
                </tr>
            `;

            actualizarResumen([]);
            textoPaginacion.textContent = "No se pudo cargar el listado";

            mostrarMensaje(error.message, "error");
        } finally {
            cargando = false;
            btnActualizar.disabled = false;
        }
    }

    // -----------------------------------------------------
    // ABRIR Y CERRAR MODAL DE USUARIO
    // -----------------------------------------------------

    function abrirModalUsuario(usuario = null) {
        formularioUsuario.reset();
        ocultarMensaje();

        usuarioId.value = usuario ? usuario.id : "";

        if (usuario) {
            tituloModalUsuario.textContent = "Editar usuario";
            descripcionModalUsuario.textContent =
                "Actualiza los datos de la cuenta.";

            nombreUsuario.value = usuario.nombre || "";
            apellidoUsuario.value = usuario.apellido || "";
            celularUsuario.value = usuario.celular || "";
            correoUsuario.value = usuario.correo || "";
            sexoUsuario.value = usuario.sexo || "";
            rolUsuario.value = obtenerRolNormalizado(usuario.rol);

            // Por seguridad, no cargamos ni mostramos la contraseña guardada.
            contrasenaUsuario.value = "";
            contrasenaUsuario.required = false;
            contrasenaUsuario.placeholder =
                "Déjala vacía para no cambiarla";

            ayudaContrasena.textContent =
                "Solo completa este campo si deseas cambiar la contraseña.";

            btnGuardarUsuario.innerHTML = `
                <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
                <span>Guardar cambios</span>
            `;
        } else {
            tituloModalUsuario.textContent = "Nuevo usuario";
            descripcionModalUsuario.textContent =
                "Completa los datos de la nueva cuenta.";

            contrasenaUsuario.required = true;
            contrasenaUsuario.placeholder = "Mínimo 8 caracteres";

            ayudaContrasena.textContent =
                "Obligatoria al crear una cuenta.";

            btnGuardarUsuario.innerHTML = `
                <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
                <span>Guardar usuario</span>
            `;
        }

        modalUsuario.hidden = false;
        document.body.style.overflow = "hidden";

        nombreUsuario.focus();
    }

    function cerrarModalUsuario() {
        modalUsuario.hidden = true;
        restaurarDesplazamiento();
        formularioUsuario.reset();
    }

    function restaurarDesplazamiento() {
        if (
            modalUsuario.hidden &&
            modalEliminarUsuario.hidden
        ) {
            document.body.style.overflow = "";
        }
    }

    // -----------------------------------------------------
    // CREAR Y EDITAR
    // -----------------------------------------------------

    async function guardarUsuario(evento) {
        evento.preventDefault();
        ocultarMensaje();

        if (!formularioUsuario.reportValidity()) {
            return;
        }

        const id = usuarioId.value.trim();
        const esEdicion = Boolean(id);

      const datosUsuario = {
    nombre: nombreUsuario.value.trim(),
    apellido: apellidoUsuario.value.trim(),
    celular: celularUsuario.value.trim(),
    correo: correoUsuario.value.trim(),
    sexo: sexoUsuario.value,
    rol: rolUsuario.value
};

        if (!datosUsuario.nombre || !datosUsuario.correo) {
            mostrarMensaje(
                "El nombre y el correo son obligatorios.",
                "error"
            );
            return;
        }


const clave = contrasenaUsuario.value;

if (!esEdicion && !clave) {
    mostrarMensaje(
        "Debes establecer una contraseña para la nueva cuenta.",
        "error"
    );
    contrasenaUsuario.focus();
    return;
}

if (clave) {
    if (clave.length < 8) {
        mostrarMensaje(
            "La contraseña debe tener al menos 8 caracteres.",
            "error"
        );
        contrasenaUsuario.focus();
        return;
    }

    if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(clave) || !/\d/.test(clave)) {
        mostrarMensaje(
            "La contraseña debe contener al menos una letra y un número.",
            "error"
        );
        contrasenaUsuario.focus();
        return;
    }

    if (new TextEncoder().encode(clave).length > 72) {
        mostrarMensaje(
            "La contraseña no puede superar 72 bytes en UTF-8.",
            "error"
        );
        contrasenaUsuario.focus();
        return;
    }

    datosUsuario.clave = clave;
}


        const textoOriginal = btnGuardarUsuario.innerHTML;
        btnGuardarUsuario.disabled = true;
        btnGuardarUsuario.textContent = "Guardando...";

        try {
            const url = esEdicion
                ? `${API_USUARIOS}/${encodeURIComponent(id)}`
                : API_USUARIOS;

            await solicitarAPI(url, {
                method: esEdicion ? "PATCH" : "POST",
                body: JSON.stringify(datosUsuario)
            });

            cerrarModalUsuario();
            await cargarUsuarios();

            mostrarMensaje(
                esEdicion
                    ? "Usuario actualizado correctamente."
                    : "Usuario creado correctamente.",
                "exito"
            );
        } catch (error) {
            mostrarMensaje(error.message, "error");
        } finally {
            btnGuardarUsuario.disabled = false;
            btnGuardarUsuario.innerHTML = textoOriginal;
        }
    }

    // -----------------------------------------------------
    // CONFIRMAR Y ELIMINAR
    // -----------------------------------------------------

    function abrirModalEliminar(usuario) {
        usuarioPendienteEliminar = usuario;

        mensajeEliminarUsuario.textContent =
            `¿Deseas eliminar la cuenta de "${usuario.nombre}"? ` +
            "Esta operación puede ser irreversible.";

        modalEliminarUsuario.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function cerrarModalEliminar() {
        modalEliminarUsuario.hidden = true;
        usuarioPendienteEliminar = null;
        restaurarDesplazamiento();
    }

    async function eliminarUsuario() {
        if (!usuarioPendienteEliminar) {
            return;
        }

        const usuario = usuarioPendienteEliminar;

        btnConfirmarEliminar.disabled = true;
        btnConfirmarEliminar.textContent = "Eliminando...";

        try {
            await solicitarAPI(
                `${API_USUARIOS}/${encodeURIComponent(usuario.id)}`,
                { method: "DELETE" }
            );

            cerrarModalEliminar();
            await cargarUsuarios();

            mostrarMensaje(
                "Usuario eliminado correctamente.",
                "exito"
            );
        } catch (error) {
            cerrarModalEliminar();
            mostrarMensaje(error.message, "error");
        } finally {
            btnConfirmarEliminar.disabled = false;
            btnConfirmarEliminar.innerHTML = `
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
                <span>Eliminar</span>
            `;
        }
    }

    // -----------------------------------------------------
    // EVENTOS
    // -----------------------------------------------------

    btnNuevoUsuario.addEventListener("click", () => {
        abrirModalUsuario();
    });

    btnActualizar.addEventListener("click", () => {
        ocultarMensaje();
        cargarUsuarios();
    });

    btnCerrarModal.addEventListener("click", cerrarModalUsuario);
    btnCancelarUsuario.addEventListener("click", cerrarModalUsuario);

    formularioUsuario.addEventListener("submit", guardarUsuario);

    btnCancelarEliminar.addEventListener(
        "click",
        cerrarModalEliminar
    );

    btnConfirmarEliminar.addEventListener(
        "click",
        eliminarUsuario
    );

    buscarUsuario.addEventListener("input", renderizarTabla);
    filtroRol.addEventListener("change", renderizarTabla);

    btnLimpiarFiltros.addEventListener("click", () => {
        buscarUsuario.value = "";
        filtroRol.value = "";
        renderizarTabla();
    });

    tablaUsuarios.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) {
            return;
        }

        const id = boton.dataset.id;
        const accion = boton.dataset.accion;

        const usuario = usuarios.find(
            (elemento) => String(elemento.id) === String(id)
        );

        if (!usuario) {
            mostrarMensaje(
                "No se encontró el usuario seleccionado.",
                "error"
            );
            return;
        }

        if (accion === "editar") {
            abrirModalUsuario(usuario);
        } else if (accion === "eliminar") {
            abrirModalEliminar(usuario);
        }
    });

    // Cerrar al pulsar fuera de la ventana modal.
    modalUsuario.addEventListener("click", (evento) => {
        if (evento.target === modalUsuario) {
            cerrarModalUsuario();
        }
    });

    modalEliminarUsuario.addEventListener("click", (evento) => {
        if (evento.target === modalEliminarUsuario) {
            cerrarModalEliminar();
        }
    });

    // Cerrar con Escape.
    document.addEventListener("keydown", (evento) => {
        if (evento.key !== "Escape") {
            return;
        }

        if (!modalEliminarUsuario.hidden) {
            cerrarModalEliminar();
        } else if (!modalUsuario.hidden) {
            cerrarModalUsuario();
        }
    });

    // -----------------------------------------------------
    // INICIALIZACIÓN
    // -----------------------------------------------------

    cargarUsuarios();
});
