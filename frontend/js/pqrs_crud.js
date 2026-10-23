
"use strict";

/* =========================================================
   AURORA LIBRIS - GESTIÓN ADMINISTRATIVA DE PQRS
   Archivo: frontend/js/pqrs_admin.js

   Contrato de API previsto:
   GET    /api/pqrs
   PATCH  /api/pqrs/<id>
   DELETE /api/pqrs/<id>

   Estos endpoints administrativos deben implementarse
   y protegerse en Flask antes de tener CRUD funcional.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const API_PQRS = "/api/pqrs";
    const POR_PAGINA = 10;

    const elementos = {
        barraLateral: document.getElementById("barraLateral"),
        botonMenu: document.getElementById("botonMenu"),

        totalSolicitudes: document.getElementById("totalSolicitudes"),
        totalPendientes: document.getElementById("totalPendientes"),
        totalRespondidas: document.getElementById("totalRespondidas"),

        tabla: document.getElementById("tablaSolicitudes"),
        buscar: document.getElementById("buscarPqrs"),
        filtroTipo: document.getElementById("filtroTipo"),
        filtroEstado: document.getElementById("filtroEstado"),
        formFiltros: document.getElementById("formFiltros"),

        botonActualizar: document.getElementById("botonActualizar"),
        informacionPaginacion: document.getElementById(
            "informacionPaginacion"
        ),
        paginaActual: document.getElementById("paginaActual"),
        paginaAnterior: document.getElementById("paginaAnterior"),
        paginaSiguiente: document.getElementById("paginaSiguiente"),

        modalDetalles: document.getElementById("modalDetalles"),
        contenidoDetalles: document.getElementById("contenidoDetalles"),
        botonResponderDesdeDetalle: document.getElementById(
            "botonResponderDesdeDetalle"
        ),

        modalGestion: document.getElementById("modalGestion"),
        formGestion: document.getElementById("formGestion"),
        gestionId: document.getElementById("gestionId"),
        gestionEstado: document.getElementById("gestionEstado"),
        gestionRespuesta: document.getElementById("gestionRespuesta"),
        mensajeGestion: document.getElementById("mensajeGestion"),
        botonGuardarGestion: document.getElementById(
            "botonGuardarGestion"
        ),

        modalEliminar: document.getElementById("modalEliminar"),
        mensajeEliminar: document.getElementById("mensajeEliminar"),
        botonConfirmarEliminar: document.getElementById(
            "botonConfirmarEliminar"
        )
    };

    const estado = {
        solicitudes: [],
        solicitudesFiltradas: [],
        pagina: 1,
        solicitudSeleccionada: null,
        cargando: false
    };

    const ETIQUETAS_TIPO = {
        peticion: "Petición",
        queja: "Queja",
        reclamo: "Reclamo",
        sugerencia: "Sugerencia"
    };

    const ETIQUETAS_ESTADO = {
        pendiente: "Pendiente",
        en_revision: "En revisión",
        respondida: "Respondida"
    };

    /* ---------- Utilidades ---------- */

    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]);
    }

    function normalizarTexto(valor) {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("es");
    }

    function fechaLegible(valor) {
        if (!valor) {
            return "Sin fecha";
        }

        const fecha = new Date(valor);

        if (Number.isNaN(fecha.getTime())) {
            return "Fecha no disponible";
        }

        return new Intl.DateTimeFormat("es-CO", {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(fecha);
    }

    function etiquetaTipo(tipo) {
        const valor = String(tipo ?? "").toLowerCase();
        const nombre = ETIQUETAS_TIPO[valor] || valor || "Sin tipo";

        return `
            <span class="tipo-pqrs tipo-${escaparHTML(valor)}">
                ${escaparHTML(nombre)}
            </span>
        `;
    }

    function etiquetaEstado(valorEstado) {
        const valor = String(valorEstado ?? "").toLowerCase();
        const nombre = ETIQUETAS_ESTADO[valor] || valor || "Sin estado";

        return `
            <span class="estado-pqrs estado-${escaparHTML(valor)}">
                ${escaparHTML(nombre)}
            </span>
        `;
    }

    function mostrarMensaje(elemento, mensaje, tipo = "") {
        elemento.textContent = mensaje;
        elemento.className = "mensaje-formulario";

        if (tipo) {
            elemento.classList.add(tipo);
        }
    }

    async function solicitar(url, opciones = {}) {
        const respuesta = await fetch(url, {
            credentials: "same-origin",
            ...opciones,
            headers: {
                ...(opciones.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...opciones.headers
            }
        });

        const contenido = await respuesta.text();
        let datos = null;

        if (contenido) {
            try {
                datos = JSON.parse(contenido);
            } catch {
                throw new Error(
                    "El servidor devolvió una respuesta no válida."
                );
            }
        }

        if (!respuesta.ok) {
            if (respuesta.status === 401) {
                throw new Error(
                    "Tu sesión no está activa. Inicia sesión nuevamente."
                );
            }

            if (respuesta.status === 403) {
                throw new Error(
                    "No tienes permisos para gestionar las PQRS."
                );
            }

            if (respuesta.status === 404) {
                throw new Error(
                    "La operación solicitada no está disponible o el registro no existe."
                );
            }

            throw new Error(
                datos?.mensaje || "No fue posible completar la operación."
            );
        }

        return datos;
    }

    function extraerSolicitudes(datos) {
        if (Array.isArray(datos)) {
            return datos;
        }

        if (Array.isArray(datos?.solicitudes)) {
            return datos.solicitudes;
        }

        if (Array.isArray(datos?.resultados)) {
            return datos.resultados;
        }

        throw new Error(
            "La respuesta de la API no contiene una lista de solicitudes."
        );
    }

    function abrirModal(modal) {
        if (!modal.open) {
            modal.showModal();
        }
    }

    function cerrarModal(modal) {
        if (modal.open) {
            modal.close();
        }
    }

    /* ---------- Carga desde el backend ---------- */

    async function cargarSolicitudes() {
        if (estado.cargando) {
            return;
        }

        estado.cargando = true;
        elementos.botonActualizar.disabled = true;
        elementos.botonActualizar.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
            Cargando...
        `;

        elementos.tabla.innerHTML = `
            <tr>
                <td colspan="6" class="estado-tabla">
                    Cargando solicitudes...
                </td>
            </tr>
        `;

        try {
            const datos = await solicitar(API_PQRS);
            const solicitudes = extraerSolicitudes(datos);

            estado.solicitudes = solicitudes.map(solicitud => ({
                ...solicitud,
                id: solicitud.id,
                estado: String(solicitud.estado ?? "").toLowerCase(),
                tipo: String(solicitud.tipo ?? "").toLowerCase()
            }));

            actualizarResumen();
            aplicarFiltros();
        } catch (error) {
            estado.solicitudes = [];
            estado.solicitudesFiltradas = [];

            elementos.totalSolicitudes.textContent = "—";
            elementos.totalPendientes.textContent = "—";
            elementos.totalRespondidas.textContent = "—";

            elementos.tabla.innerHTML = `
                <tr>
                    <td colspan="6" class="estado-tabla">
                        ${escaparHTML(error.message)}
                    </td>
                </tr>
            `;

            elementos.informacionPaginacion.textContent =
                "No se pudieron cargar las solicitudes.";

            elementos.paginaActual.textContent = "—";
            elementos.paginaAnterior.disabled = true;
            elementos.paginaSiguiente.disabled = true;
        } finally {
            estado.cargando = false;
            elementos.botonActualizar.disabled = false;
            elementos.botonActualizar.innerHTML = `
                <i class="fa-solid fa-rotate" aria-hidden="true"></i>
                Actualizar
            `;
        }
    }

    /* ---------- Resumen ---------- */

    function actualizarResumen() {
        const solicitudes = estado.solicitudes;

        elementos.totalSolicitudes.textContent = solicitudes.length;

        elementos.totalPendientes.textContent = solicitudes.filter(
            solicitud => solicitud.estado === "pendiente"
        ).length;

        elementos.totalRespondidas.textContent = solicitudes.filter(
            solicitud => solicitud.estado === "respondida"
        ).length;
    }

    /* ---------- Búsqueda y filtros ---------- */

    function aplicarFiltros() {
        const busqueda = normalizarTexto(elementos.buscar.value.trim());
        const tipoSeleccionado = elementos.filtroTipo.value;
        const estadoSeleccionado = elementos.filtroEstado.value;

        estado.solicitudesFiltradas = estado.solicitudes.filter(
            solicitud => {
                const textoSolicitud = normalizarTexto([
                    solicitud.id,
                    solicitud.nombre,
                    solicitud.apellido,
                    solicitud.correo,
                    solicitud.tipo,
                    solicitud.mensaje
                ].join(" "));

                const coincideTexto =
                    !busqueda || textoSolicitud.includes(busqueda);

                const coincideTipo =
                    !tipoSeleccionado ||
                    solicitud.tipo === tipoSeleccionado;

                const coincideEstado =
                    !estadoSeleccionado ||
                    solicitud.estado === estadoSeleccionado;

                return coincideTexto && coincideTipo && coincideEstado;
            }
        );

        estado.pagina = 1;
        renderizarTabla();
    }

    /* ---------- Tabla y paginación ---------- */

    function renderizarTabla() {
        const solicitudes = estado.solicitudesFiltradas;
        const total = solicitudes.length;
        const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

        if (estado.pagina > totalPaginas) {
            estado.pagina = totalPaginas;
        }

        const inicio = (estado.pagina - 1) * POR_PAGINA;
        const visibles = solicitudes.slice(inicio, inicio + POR_PAGINA);

        if (visibles.length === 0) {
            elementos.tabla.innerHTML = `
                <tr>
                    <td colspan="6" class="estado-tabla">
                        No se encontraron solicitudes con esos criterios.
                    </td>
                </tr>
            `;
        } else {
            elementos.tabla.innerHTML = visibles.map(solicitud => `
                <tr>
                    <td>#${escaparHTML(solicitud.id)}</td>

                    <td>
                        <div class="solicitante">
                            <strong>
                                ${escaparHTML(
                                    `${solicitud.nombre ?? ""} ${solicitud.apellido ?? ""}`.trim()
                                    || "Sin nombre"
                                )}
                            </strong>
                            <small>${escaparHTML(solicitud.correo)}</small>
                        </div>
                    </td>

                    <td>${etiquetaTipo(solicitud.tipo)}</td>

                    <td>${escaparHTML(fechaLegible(solicitud.creado_en))}</td>

                    <td>${etiquetaEstado(solicitud.estado)}</td>

                    <td>
                        <div class="acciones-fila">
                            <button
                                type="button"
                                class="boton-accion"
                                data-accion="ver"
                                data-id="${escaparHTML(solicitud.id)}"
                                aria-label="Ver solicitud ${escaparHTML(solicitud.id)}"
                                title="Ver detalles"
                            >
                                <i class="fa-solid fa-eye" aria-hidden="true"></i>
                            </button>

                            <button
                                type="button"
                                class="boton-accion"
                                data-accion="gestionar"
                                data-id="${escaparHTML(solicitud.id)}"
                                aria-label="Gestionar solicitud ${escaparHTML(solicitud.id)}"
                                title="Gestionar y responder"
                            >
                                <i class="fa-solid fa-reply" aria-hidden="true"></i>
                            </button>

                            <button
                                type="button"
                                class="boton-accion eliminar"
                                data-accion="eliminar"
                                data-id="${escaparHTML(solicitud.id)}"
                                aria-label="Eliminar solicitud ${escaparHTML(solicitud.id)}"
                                title="Eliminar"
                            >
                                <i class="fa-solid fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join("");
        }

        elementos.informacionPaginacion.textContent = total === 0
            ? "Sin solicitudes para mostrar."
            : `Mostrando ${inicio + 1}–${Math.min(
                inicio + POR_PAGINA,
                total
            )} de ${total} solicitudes`;

        elementos.paginaActual.textContent =
            `${estado.pagina} / ${totalPaginas}`;

        elementos.paginaAnterior.disabled = estado.pagina <= 1;
        elementos.paginaSiguiente.disabled =
            estado.pagina >= totalPaginas;
    }

    /* ---------- Detalles ---------- */

    function buscarSolicitud(id) {
        return estado.solicitudes.find(
            solicitud => String(solicitud.id) === String(id)
        );
    }

    function mostrarDetalles(solicitud) {
        estado.solicitudSeleccionada = solicitud;

        elementos.contenidoDetalles.innerHTML = `
            <div class="detalles-lista">
                <div class="detalle-campo">
                    <span>Número de solicitud</span>
                    <p>#${escaparHTML(solicitud.id)}</p>
                </div>

                <div class="detalle-campo">
                    <span>Tipo</span>
                    <p>${escaparHTML(
                        ETIQUETAS_TIPO[solicitud.tipo] || solicitud.tipo
                    )}</p>
                </div>

                <div class="detalle-campo">
                    <span>Nombre completo</span>
                    <p>${escaparHTML(
                        `${solicitud.nombre ?? ""} ${solicitud.apellido ?? ""}`.trim()
                        || "No disponible"
                    )}</p>
                </div>

                <div class="detalle-campo">
                    <span>Correo electrónico</span>
                    <p>${escaparHTML(solicitud.correo || "No disponible")}</p>
                </div>

                <div class="detalle-campo">
                    <span>Fecha de creación</span>
                    <p>${escaparHTML(fechaLegible(solicitud.creado_en))}</p>
                </div>

                <div class="detalle-campo">
                    <span>Estado actual</span>
                    <p>${etiquetaEstado(solicitud.estado)}</p>
                </div>

                <div class="detalle-campo completo">
                    <span>Mensaje de la solicitud</span>
                    <p>${escaparHTML(solicitud.mensaje || "Sin mensaje")}</p>
                </div>

                <div class="detalle-campo completo">
                    <span>Respuesta registrada</span>
                    <p>${escaparHTML(
                        solicitud.respuesta || "Todavía no hay respuesta."
                    )}</p>
                </div>

                <div class="detalle-campo completo">
                    <span>Fecha de respuesta</span>
                    <p>${escaparHTML(
                        fechaLegible(solicitud.respondido_en)
                    )}</p>
                </div>
            </div>
        `;

        abrirModal(elementos.modalDetalles);
    }

    /* ---------- Editar estado y responder ---------- */

    function abrirGestion(solicitud) {
        estado.solicitudSeleccionada = solicitud;

        elementos.formGestion.reset();
        elementos.gestionId.value = solicitud.id;
        elementos.gestionEstado.value = solicitud.estado || "pendiente";
        elementos.gestionRespuesta.value = solicitud.respuesta || "";

        mostrarMensaje(elementos.mensajeGestion, "");
        abrirModal(elementos.modalGestion);
    }

    async function guardarGestion(evento) {
        evento.preventDefault();

        const id = elementos.gestionId.value;
        const solicitud = buscarSolicitud(id);

        if (!solicitud) {
            mostrarMensaje(
                elementos.mensajeGestion,
                "No se encontró la solicitud seleccionada.",
                "error"
            );
            return;
        }

        const nuevoEstado = elementos.gestionEstado.value;
        const respuesta = elementos.gestionRespuesta.value.trim();

        if (nuevoEstado === "respondida" && !respuesta) {
            mostrarMensaje(
                elementos.mensajeGestion,
                "Escribe una respuesta antes de marcar la solicitud como respondida.",
                "error"
            );
            elementos.gestionRespuesta.focus();
            return;
        }

        elementos.botonGuardarGestion.disabled = true;
        mostrarMensaje(elementos.mensajeGestion, "Guardando cambios...");

        try {
            await solicitar(`${API_PQRS}/${encodeURIComponent(id)}`, {
                method: "PATCH",
                body: JSON.stringify({
                    estado: nuevoEstado,
                    respuesta
                })
            });

            cerrarModal(elementos.modalGestion);
            await cargarSolicitudes();
        } catch (error) {
            mostrarMensaje(
                elementos.mensajeGestion,
                error.message,
                "error"
            );
        } finally {
            elementos.botonGuardarGestion.disabled = false;
        }
    }

    /* ---------- Eliminar ---------- */

    function confirmarEliminacion(solicitud) {
        estado.solicitudSeleccionada = solicitud;

        mostrarMensaje(elementos.mensajeEliminar, "");
        elementos.botonConfirmarEliminar.disabled = false;

        abrirModal(elementos.modalEliminar);
    }

    async function eliminarSolicitud() {
        const solicitud = estado.solicitudSeleccionada;

        if (!solicitud) {
            return;
        }

        elementos.botonConfirmarEliminar.disabled = true;
        mostrarMensaje(elementos.mensajeEliminar, "Eliminando solicitud...");

        try {
            await solicitar(
                `${API_PQRS}/${encodeURIComponent(solicitud.id)}`,
                { method: "DELETE" }
            );

            cerrarModal(elementos.modalEliminar);
            estado.solicitudSeleccionada = null;

            await cargarSolicitudes();
        } catch (error) {
            mostrarMensaje(
                elementos.mensajeEliminar,
                error.message,
                "error"
            );
        } finally {
            elementos.botonConfirmarEliminar.disabled = false;
        }
    }

    /* ---------- Eventos ---------- */

    elementos.botonActualizar.addEventListener(
        "click",
        cargarSolicitudes
    );

    elementos.buscar.addEventListener("input", aplicarFiltros);
    elementos.filtroTipo.addEventListener("change", aplicarFiltros);
    elementos.filtroEstado.addEventListener("change", aplicarFiltros);

    elementos.formFiltros.addEventListener("reset", () => {
        // Esperamos a que el navegador restablezca los campos.
        requestAnimationFrame(aplicarFiltros);
    });

    elementos.paginaAnterior.addEventListener("click", () => {
        if (estado.pagina > 1) {
            estado.pagina--;
            renderizarTabla();
        }
    });

    elementos.paginaSiguiente.addEventListener("click", () => {
        const totalPaginas = Math.max(
            1,
            Math.ceil(estado.solicitudesFiltradas.length / POR_PAGINA)
        );

        if (estado.pagina < totalPaginas) {
            estado.pagina++;
            renderizarTabla();
        }
    });

    elementos.tabla.addEventListener("click", evento => {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) {
            return;
        }

        const solicitud = buscarSolicitud(boton.dataset.id);

        if (!solicitud) {
            return;
        }

        switch (boton.dataset.accion) {
            case "ver":
                mostrarDetalles(solicitud);
                break;

            case "gestionar":
                abrirGestion(solicitud);
                break;

            case "eliminar":
                confirmarEliminacion(solicitud);
                break;
        }
    });

    elementos.formGestion.addEventListener("submit", guardarGestion);
    elementos.botonConfirmarEliminar.addEventListener(
        "click",
        eliminarSolicitud
    );

    elementos.botonResponderDesdeDetalle.addEventListener("click", () => {
        const solicitud = estado.solicitudSeleccionada;

        if (solicitud) {
            cerrarModal(elementos.modalDetalles);
            abrirGestion(solicitud);
        }
    });

    document.querySelectorAll("[data-cerrar-modal]").forEach(boton => {
        boton.addEventListener("click", () => {
            const modal = boton.closest("dialog");

            if (modal) {
                cerrarModal(modal);
            }
        });
    });

    [
        elementos.modalDetalles,
        elementos.modalGestion,
        elementos.modalEliminar
    ].forEach(modal => {
        modal.addEventListener("click", evento => {
            if (evento.target === modal) {
                cerrarModal(modal);
            }
        });
    });

    elementos.botonMenu.addEventListener("click", () => {
        const abierta = elementos.barraLateral.classList.toggle("abierta");

        elementos.botonMenu.setAttribute(
            "aria-expanded",
            String(abierta)
        );
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape") {
            elementos.barraLateral.classList.remove("abierta");
            elementos.botonMenu.setAttribute("aria-expanded", "false");
        }
    });

    /* ---------- Inicio ---------- */

    cargarSolicitudes();
});
