
"use strict";

/* =========================================================
   AURORA LIBRIS — CRUD DE LIBROS
   Operaciones: listar, consultar, crear, editar y eliminar.
   ========================================================= */

/*
 * IMPORTANTE:
 * Ajusta estas rutas y los nombres de los campos a tu backend.
 * Se asume inicialmente una API REST en /api/libros.
 */
const CONFIG_LIBROS = {
    api: "/api/libros",
    registrosPorPagina: 8,
    campos: {
        id: "id",
        titulo: "titulo",
        autor: "autor",
        isbn: "isbn",
        editorial: "editorial",
        categoria: "categoria",
        anio: "anio_publicacion",
        cantidad: "cantidad_total",
        disponibles: "cantidad_disponible",
        descripcion: "descripcion"
    }
};

/* ---------- 1. Estado de la aplicación ---------- */

const estadoLibros = {
    libros: [],
    librosFiltrados: [],
    pagina: 1,
    modo: "crear",
    libroDetalle: null,
    cargando: false
};

/* ---------- 2. Referencias al DOM ---------- */

const $ = (selector) => document.querySelector(selector);

const elementosLibros = {
    tabla: $("#tablaLibros"),
    buscar: $("#buscarLibro"),
    filtroEstado: $("#filtroEstado"),
    filtroOrden: $("#filtroOrden"),

    total: $("#totalLibros"),
    disponibles: $("#librosDisponibles"),
    activos: $("#librosActivos"),

    informacionPagina: $("#infoPaginacion"),
    paginaActual: $("#paginaActual"),
    anterior: $("#paginaAnterior"),
    siguiente: $("#paginaSiguiente"),

    formulario: $("#formularioLibro"),
    modal: $("#modalLibro"),
    modalTitulo: $("#tituloModal"),
    modalDescripcion: $("#descripcionModal"),
    id: $("#libroId"),
    guardar: $("#btnGuardarLibro"),

    modalDetalle: $("#modalDetalleLibro"),
    tituloDetalle: $("#tituloDetalle"),
    contenidoDetalle: $("#contenidoDetalle"),
    editarDetalle: $("#btnEditarDesdeDetalle")
};

/* ---------- 3. Utilidades ---------- */

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

function obtenerCampo(libro, campo) {
    return libro?.[CONFIG_LIBROS.campos[campo]] ?? "";
}

function obtenerId(libro) {
    return obtenerCampo(libro, "id");
}

function texto(valor, alternativa = "—") {
    const resultado = String(valor ?? "").trim();
    return resultado || alternativa;
}

function normalizarEstado(valor) {
    const estado = String(valor ?? "").trim().toLowerCase();

    if (["inactivo", "inactive", "false", "0"].includes(estado)) {
        return "inactivo";
    }

    return "activo";
}

function cantidadLibro(libro) {
    const cantidad = Number(obtenerCampo(libro, "cantidad"));

    return Number.isFinite(cantidad) && cantidad >= 0
        ? cantidad
        : 0;
}

function disponiblesLibro(libro) {
    const cantidad = Number(obtenerCampo(libro, "disponibles"));

    return Number.isFinite(cantidad) && cantidad >= 0
        ? cantidad
        : 0;
}

function mostrarError(mensaje) {
    if (window.Swal) {
        return Swal.fire({
            icon: "error",
            title: "No se pudo completar la operación",
            text: mensaje
        });
    }

    window.alert(mensaje);
}

function mostrarExito(mensaje) {
    if (window.Swal) {
        return Swal.fire({
            icon: "success",
            title: "Operación exitosa",
            text: mensaje,
            timer: 1800,
            showConfirmButton: false
        });
    }

    window.alert(mensaje);
}

/* ---------- 4. Comunicación con la API ---------- */

async function solicitarAPI(ruta, opciones = {}) {
    const configuracion = {
        ...opciones,
        headers: {
            Accept: "application/json",
            ...(opciones.body ? { "Content-Type": "application/json" } : {}),
            ...opciones.headers
        },
        credentials: "same-origin"
    };

    let respuesta;

    try {
        respuesta = await fetch(ruta, configuracion);
    } catch {
        throw new Error(
            "No fue posible conectar con el servidor. Verifica que Flask esté ejecutándose."
        );
    }

    const contenido = await respuesta.text();
    let datos = null;

    if (contenido) {
        try {
            datos = JSON.parse(contenido);
        } catch {
            datos = contenido;
        }
    }

    if (!respuesta.ok) {
        const mensaje =
            typeof datos === "object" && datos !== null
                ? datos.error || datos.mensaje || datos.message
                : null;

        throw new Error(
            mensaje || `Error HTTP ${respuesta.status}: la solicitud falló.`
        );
    }

    return datos;
}

/*
 * Admite distintas estructuras habituales:
 * - [...]
 * - { libros: [...] }
 * - { data: [...] }
 * - { items: [...] }
 *
 * Si tu API utiliza otra estructura, ajustaremos esta función.
 */
function extraerListaLibros(respuesta) {
    if (Array.isArray(respuesta)) {
        return respuesta;
    }

    if (respuesta && typeof respuesta === "object") {
        for (const propiedad of ["libros", "data", "items", "resultados"]) {
            if (Array.isArray(respuesta[propiedad])) {
                return respuesta[propiedad];
            }
        }
    }

    throw new Error(
        "La respuesta del servidor no contiene una lista de libros reconocible."
    );
}

/* ---------- 5. Carga inicial ---------- */

async function cargarLibros() {
    if (estadoLibros.cargando) return;

    estadoLibros.cargando = true;

    if (elementosLibros.tabla) {
        elementosLibros.tabla.innerHTML = `
            <tr>
                <td colspan="7" class="estado-tabla">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Cargando catálogo...
                </td>
            </tr>
        `;
    }

    try {
        const respuesta = await solicitarAPI(CONFIG_LIBROS.api);

estadoLibros.libros = extraerListaLibros(respuesta);
actualizarResumen();
actualizarCatalogo();
    } catch (error) {
        estadoLibros.libros = [];
        estadoLibros.librosFiltrados = [];

        actualizarResumen();
        mostrarError(error.message);

        if (elementosLibros.tabla) {
            elementosLibros.tabla.innerHTML = `
                <tr>
                    <td colspan="7" class="estado-tabla">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        No fue posible cargar los libros.
                    </td>
                </tr>
            `;
        }

        if (elementosLibros.informacionPagina) {
            elementosLibros.informacionPagina.textContent =
                "No se pudieron cargar los registros.";
        }
    } finally {
        estadoLibros.cargando = false;
    }
}

/* ---------- 6. Resumen del catálogo ---------- */

function actualizarResumen() {
    const libros = estadoLibros.libros;

    // Cantidad de títulos registrados.
    if (elementosLibros.total) {
        elementosLibros.total.textContent = libros.length;
    }

    // Suma de todos los ejemplares físicos registrados.
    const totalEjemplares = libros.reduce(
        (suma, libro) => suma + cantidadLibro(libro),
        0
    );

    // Suma de los ejemplares disponibles para préstamo.
    const totalDisponibles = libros.reduce(
        (suma, libro) => suma + disponiblesLibro(libro),
        0
    );

    if (elementosLibros.disponibles) {
        elementosLibros.disponibles.textContent = totalDisponibles;
    }

    // Mantiene el comportamiento actual de este contador.
    if (elementosLibros.activos) {
        elementosLibros.activos.textContent = libros.length;
    }
}

/* ---------- 7. Búsqueda, filtros y orden ---------- */

function actualizarCatalogo() {
    const busqueda = String(elementosLibros.buscar?.value ?? "")
        .trim()
        .toLocaleLowerCase("es");

    const filtroEstado = elementosLibros.filtroEstado?.value ?? "";
    const orden = elementosLibros.filtroOrden?.value ?? "recientes";

    estadoLibros.librosFiltrados = estadoLibros.libros.filter((libro) => {
        const valoresBusqueda = [
            obtenerCampo(libro, "titulo"),
            obtenerCampo(libro, "autor"),
            obtenerCampo(libro, "isbn"),
            obtenerCampo(libro, "editorial"),
            obtenerCampo(libro, "categoria")
        ];

        const coincideBusqueda = valoresBusqueda.some((valor) =>
            String(valor ?? "")
                .toLocaleLowerCase("es")
                .includes(busqueda)
        );

        const estadoLibro = normalizarEstado(
            obtenerCampo(libro, "estado")
        );

        const coincideEstado =
            !filtroEstado || estadoLibro === filtroEstado;

        return coincideBusqueda && coincideEstado;
    });

    estadoLibros.librosFiltrados.sort((a, b) => {
        if (orden === "titulo") {
            return String(obtenerCampo(a, "titulo")).localeCompare(
                String(obtenerCampo(b, "titulo")),
                "es"
            );
        }

        if (orden === "autor") {
            return String(obtenerCampo(a, "autor")).localeCompare(
                String(obtenerCampo(b, "autor")),
                "es"
            );
        }

        // Orden reciente: utiliza el ID como criterio provisional.
        // Si la API entrega fecha de creación, usaremos esa fecha.
        const idA = Number(obtenerId(a));
        const idB = Number(obtenerId(b));

        if (Number.isFinite(idA) && Number.isFinite(idB)) {
            return idB - idA;
        }

        return String(obtenerId(b)).localeCompare(String(obtenerId(a)));
    });

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            estadoLibros.librosFiltrados.length /
            CONFIG_LIBROS.registrosPorPagina
        )
    );

    estadoLibros.pagina = Math.min(estadoLibros.pagina, totalPaginas);

    if (estadoLibros.pagina < 1) {
        estadoLibros.pagina = 1;
    }

    renderizarTabla();
}

/* ---------- 8. Renderizado de la tabla ---------- */

function renderizarTabla() {
    const {
        tabla,
        informacionPagina,
        paginaActual,
        anterior,
        siguiente
    } = elementosLibros;

    if (!tabla) return;

    const libros = estadoLibros.librosFiltrados;
    const porPagina = CONFIG_LIBROS.registrosPorPagina;
    const total = libros.length;
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

    const inicio = (estadoLibros.pagina - 1) * porPagina;
    const librosPagina = libros.slice(inicio, inicio + porPagina);

    if (total === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7" class="estado-tabla">
                    <i class="fa-solid fa-book-open"></i>
                    No se encontraron libros con esos criterios.
                </td>
            </tr>
        `;
    } else {
        tabla.innerHTML = librosPagina.map((libro) => {
            const id = obtenerId(libro);
            const titulo = texto(obtenerCampo(libro, "titulo"), "Sin título");
            const autor = texto(obtenerCampo(libro, "autor"));
            const isbn = texto(obtenerCampo(libro, "isbn"));
            const categoria = texto(obtenerCampo(libro, "categoria"));
            const cantidad = cantidadLibro(libro);
            const estado = normalizarEstado(obtenerCampo(libro, "estado"));

            const claseEstado =
                estado === "activo" ? "estado-activo" : "estado-inactivo";

            const etiquetaEstado =
                estado === "activo" ? "Activo" : "Inactivo";

            return `
                <tr>
                    <td>
                        <div class="libro-identidad">
                            <div class="libro-miniatura" aria-hidden="true">
                                <i class="fa-solid fa-book"></i>
                            </div>

                            <div class="libro-datos">
                                <strong title="${escaparHTML(titulo)}">
                                    ${escaparHTML(titulo)}
                                </strong>
                                <small>
                                    ${escaparHTML(texto(obtenerCampo(libro, "editorial")))}
                                </small>
                            </div>
                        </div>
                    </td>

                    <td>${escaparHTML(autor)}</td>
                    <td>${escaparHTML(isbn)}</td>
                    <td>${escaparHTML(categoria)}</td>
                    <td>${cantidad}</td>

                    <td>
                        <span class="estado-etiqueta ${claseEstado}">
                            ${etiquetaEstado}
                        </span>
                    </td>

                    <td>
                        <div class="acciones-libro">
                            <button
                                type="button"
                                class="accion-tabla"
                                data-accion="ver"
                                data-id="${escaparHTML(id)}"
                                aria-label="Consultar ${escaparHTML(titulo)}"
                                title="Consultar">
                                <i class="fa-solid fa-eye"></i>
                            </button>

                            <button
                                type="button"
                                class="accion-tabla"
                                data-accion="editar"
                                data-id="${escaparHTML(id)}"
                                aria-label="Editar ${escaparHTML(titulo)}"
                                title="Editar">
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                type="button"
                                class="accion-tabla eliminar"
                                data-accion="eliminar"
                                data-id="${escaparHTML(id)}"
                                aria-label="Eliminar ${escaparHTML(titulo)}"
                                title="Eliminar">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    if (informacionPagina) {
        informacionPagina.textContent = total === 0
            ? "0 registros"
            : `Mostrando ${inicio + 1}–${Math.min(inicio + porPagina, total)} de ${total} registros`;
    }

    if (paginaActual) {
        paginaActual.textContent = estadoLibros.pagina;
    }

    if (anterior) {
        anterior.disabled = estadoLibros.pagina <= 1 || total === 0;
    }

    if (siguiente) {
        siguiente.disabled =
            estadoLibros.pagina >= totalPaginas || total === 0;
    }
}

/* ---------- 9. Apertura y cierre de modales ---------- */

function abrirModal(modal) {
    if (!modal) return;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function cerrarModal(modal) {
    if (!modal) return;

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");

    const hayModalAbierto = [
        elementosLibros.modal,
        elementosLibros.modalDetalle
    ].some((otroModal) => otroModal && !otroModal.hidden);

    if (!hayModalAbierto) {
        document.body.style.overflow = "";
    }
}

function cerrarTodosLosModales() {
    cerrarModal(elementosLibros.modal);
    cerrarModal(elementosLibros.modalDetalle);
}

/* ---------- 10. Formulario: crear y editar ---------- */

function abrirFormulario(modo = "crear", libro = null) {
    const formulario = elementosLibros.formulario;

    if (!formulario) return;

    estadoLibros.modo = modo;

    formulario.reset();

    elementosLibros.id.value = libro ? obtenerId(libro) : "";

    if (modo === "editar" && libro) {
        $("#titulo").value = obtenerCampo(libro, "titulo");
        $("#autor").value = obtenerCampo(libro, "autor");
        $("#isbn").value = obtenerCampo(libro, "isbn");
        $("#editorial").value = obtenerCampo(libro, "editorial");
        $("#categoria").value = obtenerCampo(libro, "categoria");
        $("#anioPublicacion").value = obtenerCampo(libro, "anio");
        $("#cantidad").value = cantidadLibro(libro);
        $("#ubicacion").value = obtenerCampo(libro, "ubicacion");
        $("#estado").value = normalizarEstado(obtenerCampo(libro, "estado"));
        $("#descripcion").value = obtenerCampo(libro, "descripcion");

        elementosLibros.modalTitulo.textContent = "Editar libro";
        elementosLibros.modalDescripcion.textContent =
            "Modifica la información del libro seleccionado.";
        elementosLibros.guardar.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
    } else {
        $("#cantidad").value = 1;
        $("#estado").value = "activo";

        elementosLibros.modalTitulo.textContent = "Registrar libro";
        elementosLibros.modalDescripcion.textContent =
            "Completa la información de la publicación.";
        elementosLibros.guardar.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Guardar libro';
    }

    cerrarModal(elementosLibros.modalDetalle);
    abrirModal(elementosLibros.modal);

    $("#titulo")?.focus();
}

function construirDatosFormulario() {
    const formData = new FormData(elementosLibros.formulario);
    const campos = CONFIG_LIBROS.campos;

    const anioTexto = String(formData.get("anio_publicacion") ?? "").trim();
    const cantidadTexto = String(formData.get("cantidad") ?? "").trim();

    const cantidad = Number(cantidadTexto);

    if (cantidadTexto === "" || !Number.isInteger(cantidad) || cantidad < 0) {
        throw new Error("La cantidad debe ser un número entero igual o mayor que cero.");
    }

    const anio = anioTexto === "" ? null : Number(anioTexto);

    if (
        anio !== null &&
        (!Number.isInteger(anio) || anio < 1 || anio > 9999)
    ) {
        throw new Error("El año de publicación no es válido.");
    }

    const datos = {
        [campos.titulo]: String(formData.get("titulo") ?? "").trim(),
        [campos.autor]: String(formData.get("autor") ?? "").trim(),
        [campos.isbn]: String(formData.get("isbn") ?? "").trim() || null,
        [campos.editorial]: String(formData.get("editorial") ?? "").trim() || null,
        [campos.categoria]: String(formData.get("categoria") ?? "").trim() || null,
        [campos.anio]: anio,
        [campos.cantidad]: cantidad,
        [campos.ubicacion]: String(formData.get("ubicacion") ?? "").trim() || null,
        [campos.estado]: formData.get("estado"),
        [campos.descripcion]: String(formData.get("descripcion") ?? "").trim() || null
    };

    if (!datos[campos.titulo] || !datos[campos.autor]) {
        throw new Error("El título y el autor son obligatorios.");
    }

    return datos;
}

async function guardarLibro(evento) {
    evento.preventDefault();

    const boton = elementosLibros.guardar;

    if (boton.disabled) return;

    let datos;

    try {
        datos = construirDatosFormulario();
    } catch (error) {
        await mostrarError(error.message);
        return;
    }

    const esEdicion = estadoLibros.modo === "editar";
    const id = elementosLibros.id.value;

    if (esEdicion && !id) {
        await mostrarError("No se encontró el identificador del libro.");
        return;
    }

    const ruta = esEdicion
        ? `${CONFIG_LIBROS.api}/${encodeURIComponent(id)}`
        : CONFIG_LIBROS.api;

    boton.disabled = true;
    boton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
        await solicitarAPI(ruta, {
            method: esEdicion ? "PUT" : "POST",
            body: JSON.stringify(datos)
        });

        cerrarModal(elementosLibros.modal);

        await mostrarExito(
            esEdicion
                ? "Los cambios del libro se guardaron correctamente."
                : "El libro se registró correctamente."
        );

        await cargarLibros();
    } catch (error) {
        await mostrarError(error.message);
    } finally {
        boton.disabled = false;
        boton.innerHTML = esEdicion
            ? '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios'
            : '<i class="fa-solid fa-floppy-disk"></i> Guardar libro';
    }
}

/* ---------- 11. Consultar detalle ---------- */

function agregarCampoDetalle(etiqueta, valor, completo = false) {
    return `
        <div class="detalle-campo ${completo ? "detalle-completo" : ""}">
            <span>${escaparHTML(etiqueta)}</span>
            <strong>${escaparHTML(texto(valor))}</strong>
        </div>
    `;
}

function mostrarDetalle(libro) {
    estadoLibros.libroDetalle = libro;

    elementosLibros.tituloDetalle.textContent =
        texto(obtenerCampo(libro, "titulo"), "Detalle del libro");

    elementosLibros.contenidoDetalle.innerHTML = [
        agregarCampoDetalle("Autor", obtenerCampo(libro, "autor")),
        agregarCampoDetalle("ISBN", obtenerCampo(libro, "isbn")),
        agregarCampoDetalle("Editorial", obtenerCampo(libro, "editorial")),
        agregarCampoDetalle("Categoría", obtenerCampo(libro, "categoria")),
        agregarCampoDetalle("Año de publicación", obtenerCampo(libro, "anio")),
        agregarCampoDetalle("Ejemplares", cantidadLibro(libro)),
        agregarCampoDetalle("Ubicación", obtenerCampo(libro, "ubicacion")),
        agregarCampoDetalle(
            "Estado",
            normalizarEstado(obtenerCampo(libro, "estado")) === "activo"
                ? "Activo"
                : "Inactivo"
        ),
        agregarCampoDetalle("Descripción", obtenerCampo(libro, "descripcion"), true)
    ].join("");

    cerrarModal(elementosLibros.modal);
    abrirModal(elementosLibros.modalDetalle);
}

function buscarLibroPorId(id) {
    return estadoLibros.libros.find(
        (libro) => String(obtenerId(libro)) === String(id)
    );
}

/* ---------- 12. Eliminar libro ---------- */

async function eliminarLibro(id) {
    const libro = buscarLibroPorId(id);

    if (!libro) {
        await mostrarError("No se encontró el libro que deseas eliminar.");
        return;
    }

    const titulo = texto(obtenerCampo(libro, "titulo"), "este libro");

    let confirmado = false;

    if (window.Swal) {
        const resultado = await Swal.fire({
            icon: "warning",
            title: "¿Eliminar libro?",
            text: `Se eliminará "${titulo}". Esta acción puede afectar los registros relacionados.`,
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
            focusCancel: true
        });

        confirmado = resultado.isConfirmed;
    } else {
        confirmado = window.confirm(`¿Deseas eliminar "${titulo}"?`);
    }

    if (!confirmado) return;

    try {
        await solicitarAPI(
            `${CONFIG_LIBROS.api}/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );

        await mostrarExito("El libro se eliminó correctamente.");

        await cargarLibros();
    } catch (error) {
        await mostrarError(error.message);
    }
}

/* ---------- 13. Eventos ---------- */

function configurarEventos() {
    $("#btnNuevoLibro")?.addEventListener("click", () => {
        abrirFormulario("crear");
    });

    $("#btnActualizar")?.addEventListener("click", cargarLibros);

    elementosLibros.buscar?.addEventListener("input", () => {
        estadoLibros.pagina = 1;
        actualizarCatalogo();
    });

    elementosLibros.filtroEstado?.addEventListener("change", () => {
        estadoLibros.pagina = 1;
        actualizarCatalogo();
    });

    elementosLibros.filtroOrden?.addEventListener("change", actualizarCatalogo);

    elementosLibros.anterior?.addEventListener("click", () => {
        if (estadoLibros.pagina > 1) {
            estadoLibros.pagina--;
            renderizarTabla();
        }
    });

    elementosLibros.siguiente?.addEventListener("click", () => {
        const totalPaginas = Math.max(
            1,
            Math.ceil(
                estadoLibros.librosFiltrados.length /
                CONFIG_LIBROS.registrosPorPagina
            )
        );

        if (estadoLibros.pagina < totalPaginas) {
            estadoLibros.pagina++;
            renderizarTabla();
        }
    });

    elementosLibros.tabla?.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) return;

        const accion = boton.dataset.accion;
        const id = boton.dataset.id;
        const libro = buscarLibroPorId(id);

        if (!libro) {
            mostrarError("El libro ya no está disponible en el catálogo.");
            return;
        }

        if (accion === "ver") {
            mostrarDetalle(libro);
        } else if (accion === "editar") {
            abrirFormulario("editar", libro);
        } else if (accion === "eliminar") {
            eliminarLibro(id);
        }
    });

    elementosLibros.formulario?.addEventListener("submit", guardarLibro);

    $("#btnCerrarModal")?.addEventListener("click", () => {
        cerrarModal(elementosLibros.modal);
    });

    $("#btnCancelar")?.addEventListener("click", () => {
        cerrarModal(elementosLibros.modal);
    });

    elementosLibros.modal?.querySelector("[data-cerrar-modal]")
        ?.addEventListener("click", () => {
            cerrarModal(elementosLibros.modal);
        });

    $("#btnCerrarDetalle")?.addEventListener("click", () => {
        cerrarModal(elementosLibros.modalDetalle);
    });

    $("#btnCerrarDetallePie")?.addEventListener("click", () => {
        cerrarModal(elementosLibros.modalDetalle);
    });

    elementosLibros.modalDetalle
        ?.querySelector("[data-cerrar-detalle]")
        ?.addEventListener("click", () => {
            cerrarModal(elementosLibros.modalDetalle);
        });

    elementosLibros.editarDetalle?.addEventListener("click", () => {
        const libro = estadoLibros.libroDetalle;

        if (libro) {
            abrirFormulario("editar", libro);
        }
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            cerrarTodosLosModales();
        }
    });

    // La fecha se calcula con la configuración local del navegador.
    const fecha = $("#fechaActual");

    if (fecha) {
        fecha.textContent = new Intl.DateTimeFormat("es-CO", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(new Date());
    }
}

/* ---------- 14. Inicialización ---------- */

function iniciarLibros() {
    configurarEventos();
    cargarLibros();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarLibros, { once: true });
} else {
    iniciarLibros();
}
