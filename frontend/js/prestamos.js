
"use strict";

/* =========================================================
   AURORA LIBRIS — CRUD DE SOLICITUDES Y PRÉSTAMOS
   Archivo: cruds/js/prestamos.js

   Contrato esperado de la API:
   GET    /api/prestamos
   POST   /api/prestamos/:id/aprobar
   POST   /api/prestamos/:id/rechazar
   POST   /api/prestamos/:id/devolucion
   POST   /api/prestamos/:id/sancion

   Estas rutas son propuestas; todavía deben implementarse
   y validarse en el backend Flask.
   ========================================================= */

const CONFIG_PRESTAMOS = {
    api: "/api/prestamos",
    registrosPorPagina: 8
};

const estadoPrestamos = {
    registros: [],
    filtrados: [],
    pagina: 1,
    cargando: false
};

const $ = (selector) => document.querySelector(selector);

const elementos = {
    conexion: $("#estado-conexion"),
    actualizar: $("#btnActualizar"),

    pendientes: $("#total-pendientes"),
    activos: $("#total-activos"),
    vencidos: $("#total-vencidos"),
    devueltos: $("#total-devueltos"),

    buscar: $("#buscar-prestamo"),
    filtroEstado: $("#filtro-estado"),
    filtroVencimiento: $("#filtro-vencimiento"),
    limpiarFiltros: $("#btnLimpiarFiltros"),

    tabla: $("#tabla-prestamos-body"),
    sinResultados: $("#sin-resultados"),
    contador: $("#contador-registros"),
    resumenPaginacion: $("#resumen-paginacion"),
    paginaActual: $("#pagina-actual"),
    anterior: $("#btnPaginaAnterior"),
    siguiente: $("#btnPaginaSiguiente"),

    formAprobar: $("#formAprobar"),
    aprobarId: $("#aprobar-prestamo-id"),
    aprobarUsuario: $("#aprobar-usuario"),
    aprobarLibro: $("#aprobar-libro"),
    fechaPrestamo: $("#fecha-prestamo"),
    fechaVencimiento: $("#fecha-vencimiento"),

    formDevolucion: $("#formDevolucion"),
    devolucionId: $("#devolucion-prestamo-id"),
    devolucionUsuario: $("#devolucion-usuario"),
    devolucionLibro: $("#devolucion-libro"),
    devolucionAtraso: $("#devolucion-atraso"),
    fechaDevolucion: $("#fecha-devolucion"),

    formSancion: $("#formSancion"),
    sancionId: $("#sancion-prestamo-id"),
    sancionUsuario: $("#sancion-usuario"),
    sancionLibro: $("#sancion-libro"),
    sancionAtraso: $("#sancion-atraso"),
    diasSancion: $("#dias-sancion"),
    motivoSancion: $("#motivo-sancion")
};

const modales = {
    aprobar: bootstrap.Modal.getOrCreateInstance($("#modalAprobar")),
    devolucion: bootstrap.Modal.getOrCreateInstance($("#modalDevolucion")),
    sancion: bootstrap.Modal.getOrCreateInstance($("#modalSancion"))
};

/* ---------- Utilidades ---------- */

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function fechaLocalISO(fecha = new Date()) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function convertirFecha(valor) {
    if (!valor) return null;

    const texto = String(valor).slice(0, 10);
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);

    if (!coincidencia) return null;

    const fecha = new Date(
        Number(coincidencia[1]),
        Number(coincidencia[2]) - 1,
        Number(coincidencia[3])
    );

    if (
        fecha.getFullYear() !== Number(coincidencia[1]) ||
        fecha.getMonth() !== Number(coincidencia[2]) - 1 ||
        fecha.getDate() !== Number(coincidencia[3])
    ) {
        return null;
    }

    return fecha;
}

function formatearFecha(valor) {
    const fecha = convertirFecha(valor);

    if (!fecha) return "—";

    return new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(fecha);
}

function diasEntre(inicio, fin) {
    const fechaInicio = convertirFecha(inicio);
    const fechaFin = convertirFecha(fin);

    if (!fechaInicio || !fechaFin) return 0;

    const diferencia = fechaFin.getTime() - fechaInicio.getTime();

    return Math.max(0, Math.floor(diferencia / 86400000));
}

function nombreUsuario(registro) {
    const nombre = [
        registro.usuario_nombre ?? registro.nombre,
        registro.usuario_apellido ?? registro.apellido
    ].filter(Boolean).join(" ").trim();

    return nombre || (
        registro.usuario_id != null
            ? `Usuario #${registro.usuario_id}`
            : "Usuario sin identificar"
    );
}

function nombreLibro(registro) {
    return registro.libro_titulo ??
        registro.titulo_libro ??
        (registro.libro_id != null
            ? `Libro #${registro.libro_id}`
            : "Libro sin identificar");
}

function normalizarEstado(registro) {
    const original = String(registro.estado ?? "")
        .trim()
        .toLowerCase();

    if (["solicitado", "pendiente", "pendiente_aprobacion"].includes(original)) {
        return "solicitado";
    }

    if (["rechazado", "cancelado"].includes(original)) {
        return "rechazado";
    }

    if (["devuelto", "devolucion", "devolución", "completado"].includes(original)) {
        return "devuelto";
    }

    if (["activo", "aprobado", "prestado", "en_prestamo"].includes(original)) {
        if (registro.fecha_devolucion) return "devuelto";

        const vencimiento = convertirFecha(registro.fecha_vencimiento);

        if (
            vencimiento &&
            fechaLocalISO() > String(registro.fecha_vencimiento).slice(0, 10)
        ) {
            return "vencido";
        }

        return "activo";
    }

    return original || "desconocido";
}

function obtenerAtraso(registro) {
    if (registro.fecha_devolucion) {
        return diasEntre(
            registro.fecha_vencimiento,
            registro.fecha_devolucion
        );
    }

    if (["activo", "vencido"].includes(normalizarEstado(registro))) {
        return diasEntre(
            registro.fecha_vencimiento,
            fechaLocalISO()
        );
    }

    return 0;
}

function mostrarMensaje(mensaje) {
    window.alert(mensaje);
}

function actualizarConexion(mensaje, correcta = true) {
    if (!elementos.conexion) return;

    elementos.conexion.replaceChildren();

    const punto = document.createElement("span");
    punto.className = "estado-punto";

    elementos.conexion.append(punto, document.createTextNode(mensaje));
    elementos.conexion.dataset.estado = correcta ? "conectado" : "error";
}

async function leerRespuesta(respuesta) {
    const texto = await respuesta.text();

    let datos = {};

    if (texto) {
        try {
            datos = JSON.parse(texto);
        } catch {
            datos = { mensaje: texto };
        }
    }

    if (!respuesta.ok) {
        throw new Error(
            datos.mensaje ||
            datos.error ||
            `El servidor respondió con el estado ${respuesta.status}.`
        );
    }

    return datos;
}

async function solicitarAPI(ruta, opciones = {}) {
    const respuesta = await fetch(ruta, {
        credentials: "same-origin",
        ...opciones,
        headers: {
            Accept: "application/json",
            ...(opciones.body ? { "Content-Type": "application/json" } : {}),
            ...opciones.headers
        }
    });

    return leerRespuesta(respuesta);
}

function datosDeLista(datos) {
    if (Array.isArray(datos)) return datos;
    if (Array.isArray(datos.prestamos)) return datos.prestamos;
    if (Array.isArray(datos.registros)) return datos.registros;

    throw new Error(
        "La respuesta de /api/prestamos no contiene una lista reconocible."
    );
}

/* ---------- Carga de datos ---------- */

async function cargarPrestamos() {
    if (estadoPrestamos.cargando) return;

    estadoPrestamos.cargando = true;
    elementos.actualizar.disabled = true;

    elementos.tabla.innerHTML = `
        <tr>
            <td colspan="8" class="tabla-cargando">
                <span class="spinner-border spinner-border-sm"
                      role="status" aria-hidden="true"></span>
                Consultando préstamos...
            </td>
        </tr>
    `;

    elementos.sinResultados.hidden = true;
    actualizarConexion("Conectando con el servidor...");

    try {
        const respuesta = await solicitarAPI(CONFIG_PRESTAMOS.api);

        estadoPrestamos.registros = datosDeLista(respuesta);
        estadoPrestamos.pagina = 1;

        actualizarResumen();
        aplicarFiltros();

        actualizarConexion(
            `${estadoPrestamos.registros.length} registros recibidos del servidor.`,
            true
        );
    } catch (error) {
        console.error("Error al cargar los préstamos:", error);

        estadoPrestamos.registros = [];
        estadoPrestamos.filtrados = [];

        actualizarResumen();
        renderizarTabla();

        actualizarConexion(
            "No se pudieron cargar los préstamos. Verifica la API y tu sesión.",
            false
        );
    } finally {
        estadoPrestamos.cargando = false;
        elementos.actualizar.disabled = false;
    }
}

/* ---------- Resumen ---------- */

function actualizarResumen() {
    const estados = estadoPrestamos.registros.map(normalizarEstado);

    elementos.pendientes.textContent =
        estados.filter((estado) => estado === "solicitado").length;

    elementos.activos.textContent =
        estados.filter((estado) => estado === "activo").length;

    elementos.vencidos.textContent =
        estados.filter((estado) => estado === "vencido").length;

    elementos.devueltos.textContent =
        estados.filter((estado) => estado === "devuelto").length;
}

/* ---------- Filtros ---------- */

function aplicarFiltros() {
    const busqueda = elementos.buscar.value.trim().toLocaleLowerCase("es");
    const estadoElegido = elementos.filtroEstado.value;
    const vencimientoElegido = elementos.filtroVencimiento.value;

    estadoPrestamos.filtrados = estadoPrestamos.registros.filter((registro) => {
        const usuario = nombreUsuario(registro).toLocaleLowerCase("es");
        const libro = String(nombreLibro(registro)).toLocaleLowerCase("es");
        const idUsuario = String(registro.usuario_id ?? "");
        const idLibro = String(registro.libro_id ?? "");
        const estado = normalizarEstado(registro);
        const atraso = obtenerAtraso(registro);

        const coincideBusqueda = !busqueda ||
            usuario.includes(busqueda) ||
            libro.includes(busqueda) ||
            idUsuario.includes(busqueda) ||
            idLibro.includes(busqueda) ||
            String(registro.id ?? "").includes(busqueda);

        const coincideEstado =
            estadoElegido === "todos" ||
            estado === estadoElegido;

        const coincideVencimiento =
            vencimientoElegido === "todos" ||
            (vencimientoElegido === "al-dia" &&
                ["activo", "devuelto"].includes(estado) && atraso === 0) ||
            (vencimientoElegido === "vencidos" && atraso > 0);

        return coincideBusqueda && coincideEstado && coincideVencimiento;
    });

    estadoPrestamos.pagina = 1;
    renderizarTabla();
}

/* ---------- Tabla ---------- */

function etiquetaEstado(estado) {
    const etiquetas = {
        solicitado: ["estado-pendiente", "Pendiente"],
        activo: ["estado-activo", "Activo"],
        vencido: ["estado-vencido", "Vencido"],
        devuelto: ["estado-devuelto", "Devuelto"],
        rechazado: ["estado-rechazado", "Rechazado"],
        desconocido: ["estado-rechazado", "Sin estado"]
    };

    const [clase, texto] = etiquetas[estado] ??
        ["estado-rechazado", estado];

    return `<span class="estado-badge ${clase}">${escaparHTML(texto)}</span>`;
}

function renderizarAcciones(registro, estado) {
    const id = Number(registro.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return '<span class="text-secondary">ID no válido</span>';
    }

    if (estado === "solicitado") {
        return `
            <div class="acciones-celda">
                <button type="button"
                        class="btn-accion btn-accion-aprobar"
                        data-accion="aprobar" data-id="${id}"
                        title="Aprobar solicitud" aria-label="Aprobar solicitud">
                    <i class="bi bi-check-lg"></i>
                </button>
                <button type="button"
                        class="btn-accion btn-accion-rechazar"
                        data-accion="rechazar" data-id="${id}"
                        title="Rechazar solicitud" aria-label="Rechazar solicitud">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
    }

    if (["activo", "vencido"].includes(estado)) {
        return `
            <div class="acciones-celda">
                <button type="button"
                        class="btn-accion btn-accion-devolver"
                        data-accion="devolver" data-id="${id}"
                        title="Registrar devolución" aria-label="Registrar devolución">
                    <i class="bi bi-box-arrow-in-left"></i>
                </button>
                <button type="button"
                        class="btn-accion btn-accion-sancionar"
                        data-accion="sancionar" data-id="${id}"
                        title="Registrar sanción" aria-label="Registrar sanción"
                        ${obtenerAtraso(registro) < 1 ? "disabled" : ""}>
                    <i class="bi bi-shield-exclamation"></i>
                </button>
            </div>
        `;
    }

    return '<span class="text-secondary">Sin acciones</span>';
}

function filaHTML(registro) {
    const estado = normalizarEstado(registro);
    const atraso = obtenerAtraso(registro);
    const vencido = estado === "vencido";

    const fechaSolicitud =
        registro.fecha_solicitud ?? registro.creado_en;

    const fechaPrestamo = registro.fecha_prestamo;
    const fechaVencimiento = registro.fecha_vencimiento;

    return `
        <tr class="${vencido ? "fila-vencida" : ""}">
            <td>
                <div class="usuario-celda">
                    <span class="usuario-avatar">
                        <i class="bi bi-person"></i>
                    </span>
                    <div class="usuario-info">
                        <strong>${escaparHTML(nombreUsuario(registro))}</strong>
                        <small>ID: ${escaparHTML(registro.usuario_id ?? "—")}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="libro-celda">
                    <span class="libro-avatar">
                        <i class="bi bi-book"></i>
                    </span>
                    <div class="libro-info">
                        <strong>${escaparHTML(nombreLibro(registro))}</strong>
                        <small>ID: ${escaparHTML(registro.libro_id ?? "—")}</small>
                    </div>
                </div>
            </td>
            <td class="fecha-celda">${escaparHTML(formatearFecha(fechaSolicitud))}</td>
            <td class="fecha-celda">${escaparHTML(formatearFecha(fechaPrestamo))}</td>
            <td class="fecha-celda">${escaparHTML(formatearFecha(fechaVencimiento))}</td>
            <td>${etiquetaEstado(estado)}</td>
            <td>
                ${atraso > 0
                    ? `<span class="atraso-indicador atraso-vencido">${atraso} día${atraso === 1 ? "" : "s"}</span>`
                    : '<span class="leyenda-al-dia">Al día</span>'}
            </td>
            <td>${renderizarAcciones(registro, estado)}</td>
        </tr>
    `;
}

function renderizarTabla() {
    const total = estadoPrestamos.filtrados.length;
    const paginas = Math.max(1, Math.ceil(total / CONFIG_PRESTAMOS.registrosPorPagina));

    estadoPrestamos.pagina = Math.min(estadoPrestamos.pagina, paginas);

    const inicio = (estadoPrestamos.pagina - 1) *
        CONFIG_PRESTAMOS.registrosPorPagina;

    const registrosPagina = estadoPrestamos.filtrados.slice(
        inicio,
        inicio + CONFIG_PRESTAMOS.registrosPorPagina
    );

    elementos.contador.textContent =
        `${total} registro${total === 1 ? "" : "s"}`;

    elementos.paginaActual.textContent = estadoPrestamos.pagina;
    elementos.anterior.disabled = estadoPrestamos.pagina <= 1;
    elementos.siguiente.disabled = estadoPrestamos.pagina >= paginas;

    elementos.resumenPaginacion.textContent = total === 0
        ? "Mostrando 0 registros"
        : `Mostrando ${inicio + 1}–${Math.min(inicio + registrosPagina.length, total)} de ${total} registros`;

    elementos.sinResultados.hidden = total !== 0;

    if (total === 0) {
        elementos.tabla.innerHTML = `
            <tr>
                <td colspan="8" class="tabla-cargando">
                    No hay registros para mostrar.
                </td>
            </tr>
        `;
        return;
    }

    elementos.tabla.innerHTML = registrosPagina.map(filaHTML).join("");
}

/* ---------- Modales ---------- */

function buscarRegistro(id) {
    return estadoPrestamos.registros.find(
        (registro) => Number(registro.id) === Number(id)
    );
}

function abrirAprobacion(registro) {
    elementos.formAprobar.reset();

    elementos.aprobarId.value = registro.id;
    elementos.aprobarUsuario.textContent = nombreUsuario(registro);
    elementos.aprobarLibro.textContent = nombreLibro(registro);

    const hoy = fechaLocalISO();
    elementos.fechaPrestamo.value = hoy;
    elementos.fechaPrestamo.min = hoy;

    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 14);

    elementos.fechaVencimiento.value = fechaLocalISO(vencimiento);
    elementos.fechaVencimiento.min = hoy;

    modales.aprobar.show();
}

function abrirDevolucion(registro) {
    elementos.formDevolucion.reset();

    elementos.devolucionId.value = registro.id;
    elementos.devolucionUsuario.textContent = nombreUsuario(registro);
    elementos.devolucionLibro.textContent = nombreLibro(registro);
    elementos.devolucionAtraso.textContent =
        `${obtenerAtraso(registro)} día(s)`;

    elementos.fechaDevolucion.value = fechaLocalISO();
    elementos.fechaDevolucion.min =
        String(registro.fecha_prestamo ?? "").slice(0, 10);

    modales.devolucion.show();
}

function abrirSancion(registro) {
    const atraso = obtenerAtraso(registro);

    if (atraso < 1) {
        mostrarMensaje("Este préstamo no presenta días de atraso.");
        return;
    }

    elementos.formSancion.reset();

    elementos.sancionId.value = registro.id;
    elementos.sancionUsuario.textContent = nombreUsuario(registro);
    elementos.sancionLibro.textContent = nombreLibro(registro);
    elementos.sancionAtraso.textContent = `${atraso} día(s)`;

    modales.sancion.show();
}

/* ---------- Acciones de la tabla ---------- */

elementos.tabla.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;

    const registro = buscarRegistro(boton.dataset.id);
    if (!registro) {
        mostrarMensaje("No se encontró el registro seleccionado.");
        return;
    }

    switch (boton.dataset.accion) {
        case "aprobar":
            abrirAprobacion(registro);
            break;

        case "rechazar":
            rechazarSolicitud(registro);
            break;

        case "devolver":
            abrirDevolucion(registro);
            break;

        case "sancionar":
            abrirSancion(registro);
            break;
    }
});

async function ejecutarAccion(ruta, datos, mensajeExito) {
    try {
        await solicitarAPI(ruta, {
            method: "POST",
            body: JSON.stringify(datos)
        });

        mostrarMensaje(mensajeExito);
        await cargarPrestamos();
        return true;
    } catch (error) {
        console.error("Error al ejecutar la acción:", error);
        mostrarMensaje(
            `No fue posible completar la operación.\n${error.message}`
        );
        return false;
    }
}

async function rechazarSolicitud(registro) {
    const confirmar = window.confirm(
        `¿Deseas rechazar la solicitud de ${nombreUsuario(registro)} para el libro "${nombreLibro(registro)}"?`
    );

    if (!confirmar) return;

    await ejecutarAccion(
        `${CONFIG_PRESTAMOS.api}/${registro.id}/rechazar`,
        {},
        "La solicitud fue rechazada."
    );
}

/* ---------- Formulario: aprobar ---------- */

elementos.formAprobar.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const id = Number(elementos.aprobarId.value);
    const fechaPrestamo = elementos.fechaPrestamo.value;
    const fechaVencimiento = elementos.fechaVencimiento.value;

    if (!id || !fechaPrestamo || !fechaVencimiento) {
        mostrarMensaje("Completa las fechas del préstamo.");
        return;
    }

    if (fechaVencimiento < fechaPrestamo) {
        mostrarMensaje(
            "La fecha límite de entrega no puede ser anterior a la fecha del préstamo."
        );
        return;
    }

    const boton = elementos.formAprobar.querySelector('[type="submit"]');
    boton.disabled = true;

    try {
        const correcto = await ejecutarAccion(
            `${CONFIG_PRESTAMOS.api}/${id}/aprobar`,
            {
                fecha_prestamo: fechaPrestamo,
                fecha_vencimiento: fechaVencimiento
            },
            "La solicitud fue aprobada."
        );

        if (correcto) modales.aprobar.hide();
    } finally {
        boton.disabled = false;
    }
});

/* ---------- Formulario: devolución ---------- */

elementos.formDevolucion.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const id = Number(elementos.devolucionId.value);
    const fechaDevolucion = elementos.fechaDevolucion.value;
    const registro = buscarRegistro(id);

    if (!id || !fechaDevolucion || !registro) {
        mostrarMensaje("Verifica los datos de la devolución.");
        return;
    }

    if (
        registro.fecha_prestamo &&
        fechaDevolucion < String(registro.fecha_prestamo).slice(0, 10)
    ) {
        mostrarMensaje(
            "La fecha de devolución no puede ser anterior al préstamo."
        );
        return;
    }

    const boton = elementos.formDevolucion.querySelector('[type="submit"]');
    boton.disabled = true;

    try {
        const correcto = await ejecutarAccion(
            `${CONFIG_PRESTAMOS.api}/${id}/devolucion`,
            { fecha_devolucion: fechaDevolucion },
            "La devolución fue registrada."
        );

        if (correcto) modales.devolucion.hide();
    } finally {
        boton.disabled = false;
    }
});

/* ---------- Formulario: sanción ---------- */

elementos.formSancion.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const id = Number(elementos.sancionId.value);
    const dias = Number(elementos.diasSancion.value);
    const motivo = elementos.motivoSancion.value.trim();
    const registro = buscarRegistro(id);

    if (
        !id ||
        !registro ||
        !Number.isInteger(dias) ||
        dias < 1 ||
        dias > 365 ||
        !motivo
    ) {
        mostrarMensaje(
            "Indica una duración válida entre 1 y 365 días y un motivo."
        );
        return;
    }

    if (obtenerAtraso(registro) < 1) {
        mostrarMensaje(
            "Solo puedes registrar esta sanción si hay días de atraso."
        );
        return;
    }

    const confirmar = window.confirm(
        `¿Confirmas una sanción de ${dias} día(s) para ${nombreUsuario(registro)}?\n\nMotivo: ${motivo}`
    );

    if (!confirmar) return;

    const boton = elementos.formSancion.querySelector('[type="submit"]');
    boton.disabled = true;

    try {
        const correcto = await ejecutarAccion(
            `${CONFIG_PRESTAMOS.api}/${id}/sancion`,
            {
                dias_sancion: dias,
                motivo
            },
            "La sanción fue registrada."
        );

        if (correcto) modales.sancion.hide();
    } finally {
        boton.disabled = false;
    }
});

/* ---------- Eventos de interfaz ---------- */

elementos.actualizar.addEventListener("click", cargarPrestamos);

elementos.buscar.addEventListener("input", aplicarFiltros);
elementos.filtroEstado.addEventListener("change", aplicarFiltros);
elementos.filtroVencimiento.addEventListener("change", aplicarFiltros);

elementos.limpiarFiltros.addEventListener("click", () => {
    elementos.buscar.value = "";
    elementos.filtroEstado.value = "todos";
    elementos.filtroVencimiento.value = "todos";

    aplicarFiltros();
});

elementos.anterior.addEventListener("click", () => {
    if (estadoPrestamos.pagina > 1) {
        estadoPrestamos.pagina--;
        renderizarTabla();
    }
});

elementos.siguiente.addEventListener("click", () => {
    const paginas = Math.max(
        1,
        Math.ceil(
            estadoPrestamos.filtrados.length /
            CONFIG_PRESTAMOS.registrosPorPagina
        )
    );

    if (estadoPrestamos.pagina < paginas) {
        estadoPrestamos.pagina++;
        renderizarTabla();
    }
});

elementos.fechaPrestamo.addEventListener("change", () => {
    elementos.fechaVencimiento.min = elementos.fechaPrestamo.value;

    if (
        elementos.fechaVencimiento.value &&
        elementos.fechaVencimiento.value < elementos.fechaPrestamo.value
    ) {
        elementos.fechaVencimiento.value = elementos.fechaPrestamo.value;
    }
});

/* ---------- Inicio ---------- */

document.addEventListener("DOMContentLoaded", () => {
    cargarPrestamos();
});
