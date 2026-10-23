"use strict";

document.addEventListener("DOMContentLoaded", iniciarFormulario);

const CAMPOS = ["nombre", "apellido", "celular", "correo"];

const formulario = document.getElementById("formActualizarDatos");
const mensaje = document.getElementById("mensajeFormulario");
const botonGuardar = document.getElementById("btnGuardar");
const botonCancelar = document.getElementById("btnCancelar");
const botonVolver = document.getElementById("btnVolver");
const spinner = document.getElementById("spin");

document.getElementById("anio").textContent = new Date().getFullYear();

let datosOriginales = null;
let dashboardDestino = "/dashboards/usuario.html";

async function iniciarFormulario() {
    if (!formulario) return;

    botonGuardar.disabled = true;

    botonCancelar?.addEventListener("click", () => {
        if (datosOriginales) {
            cargarFormulario(datosOriginales);
            limpiarErrores();
            mostrarMensaje("", "");
        }

        window.location.href = dashboardDestino;
    });

    botonVolver?.addEventListener("click", (evento) => {
        evento.preventDefault();
        window.location.href = dashboardDestino;
    });

    formulario.addEventListener("submit", guardarCambios);

    try {
        const respuesta = await fetch("/api/yo", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });

        if (respuesta.status === 401) {
            window.location.href = "../paginas/login.html";
            return;
        }

        if (!respuesta.ok) {
            throw new Error("No fue posible cargar tus datos.");
        }

        const usuario = await respuesta.json();

        if (!usuario.ok) {
            throw new Error("No fue posible identificar tu cuenta.");
        }

        dashboardDestino = usuario.rol === "administrador"
            ? "/dashboards/administrador.html"
            : "/dashboards/usuario.html";

        datosOriginales = {
            nombre: usuario.nombre ?? "",
            apellido: usuario.apellido ?? "",
            celular: usuario.celular ?? "",
            correo: usuario.correo ?? "",
            sexo: usuario.sexo ?? ""
        };

        cargarFormulario(datosOriginales);
        botonGuardar.disabled = false;

    } catch (error) {
        mostrarMensaje(
            error.message || "Ocurrió un error al cargar tus datos.",
            "error"
        );
    }
}

function cargarFormulario(datos) {
    CAMPOS.forEach((campo) => {
        const entrada = document.getElementById(campo);

        if (entrada) {
            entrada.value = datos[campo] ?? "";
        }
    });

    const sexo = datos.sexo;

    document.querySelectorAll('input[name="sexo"]').forEach((opcion) => {
        opcion.checked = opcion.value === sexo;
    });
}

async function guardarCambios(evento) {
    evento.preventDefault();

    limpiarErrores();
    mostrarMensaje("", "");

    const datos = {
        nombre: obtenerValor("nombre"),
        apellido: obtenerValor("apellido"),
        celular: obtenerValor("celular"),
        correo: obtenerValor("correo").toLowerCase(),
        sexo: document.querySelector('input[name="sexo"]:checked')?.value ?? ""
    };

    if (!validarDatos(datos)) {
        mostrarMensaje("Revisa los campos señalados antes de continuar.", "error");
        return;
    }

    botonGuardar.disabled = true;
    spinner?.classList.remove("d-none");

    const textoOriginal = botonGuardar.textContent.trim();
    botonGuardar.lastChild.textContent = " Guardando...";

    try {
        const respuesta = await fetch("/api/yo", {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json().catch(() => ({}));

        if (respuesta.status === 401) {
            window.location.href = "../paginas/login.html";
            return;
        }

        if (respuesta.status === 409) {
            mostrarErrorCampo(
                "correo",
                resultado.errores?.correo || "Este correo ya está registrado."
            );
            mostrarMensaje("No se pudieron guardar los cambios.", "error");
            return;
        }

        if (!respuesta.ok || resultado.ok !== true) {
            if (resultado.errores) {
                Object.entries(resultado.errores).forEach(([campo, texto]) => {
                    mostrarErrorCampo(campo, texto);
                });
            }

            throw new Error(
                resultado.mensaje || "No se pudieron guardar los cambios."
            );
        }

        datosOriginales = { ...datos };
        cargarFormulario(datosOriginales);

        mostrarMensaje(
            resultado.mensaje || "Tus datos se actualizaron correctamente.",
            "exito"
        );

    } catch (error) {
        mostrarMensaje(
            error.message || "No fue posible conectar con el servidor.",
            "error"
        );
    } finally {
        botonGuardar.disabled = false;
        spinner?.classList.add("d-none");
        botonGuardar.lastChild.textContent = ` ${textoOriginal}`;
    }
}

function obtenerValor(id) {
    return document.getElementById(id)?.value.trim() ?? "";
}

function validarDatos(datos) {
    let valido = true;

    if (datos.nombre.length < 2) {
        mostrarErrorCampo("nombre", "Escribe un nombre de al menos 2 caracteres.");
        valido = false;
    }

    if (datos.apellido.length < 2) {
        mostrarErrorCampo("apellido", "Escribe un apellido de al menos 2 caracteres.");
        valido = false;
    }

    // El formulario solicita los 10 dígitos nacionales del celular colombiano.
    if (!/^\d{10}$/.test(datos.celular)) {
        mostrarErrorCampo("celular", "Escribe un celular de 10 dígitos, sin el +57.");
        valido = false;
    }

    if (
        datos.correo.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)
    ) {
        mostrarErrorCampo("correo", "Escribe un correo electrónico válido.");
        valido = false;
    }

    const sexoPermitido = ["femenino", "masculino", "no_indica"];

    if (!sexoPermitido.includes(datos.sexo)) {
        mostrarErrorCampo("sexo", "Selecciona una opción.");
        valido = false;
    }

    return valido;
}

function mostrarErrorCampo(campo, texto) {
    const elemento = document.getElementById(
        campo === "sexo" ? "errSexo" : `err${campo.charAt(0).toUpperCase()}${campo.slice(1)}`
    );

    if (elemento) {
        elemento.textContent = texto;
    }
}

function limpiarErrores() {
    document.querySelectorAll(".actualizar-card .error").forEach((elemento) => {
        elemento.textContent = "";
    });
}

function mostrarMensaje(texto, tipo) {
    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.classList.remove("error", "exito");

    if (tipo) {
        mensaje.classList.add(tipo);
    }

    mensaje.hidden = !texto;
}
