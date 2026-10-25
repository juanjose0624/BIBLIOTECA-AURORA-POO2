"use strict";

/* =========================================================
   AURORA LIBRIS — TABLA DE POSICIONES DE LECTORES
   Archivo: frontend/js/tabla_posiciones.js

   API esperada (propuesta, falta implementarla en Flask):

   GET /api/posiciones
   {
     "ok": true,
     "usuario_actual_id": 3,            // opcional
     "lectores": [
       {
         "usuario_id": 3,
         "nombre": "Sebastián",
         "apellido": "Sierra",
         "puntos": 240,
         "libros_leidos": 6,
         "es_yo": true                  // opcional
       }
     ]
   }

   También acepta una lista directa, o las claves
   "posiciones" / "registros" en lugar de "lectores".
   ========================================================= */

(() => {
    const API_POSICIONES = "/api/posiciones";
    const API_YO = "/api/yo";
    const REGISTROS_POR_PAGINA = 10;

    // Deben coincidir con los puntos mínimos mostrados en el HTML.
    const NIVELES = [
        { id: "semilla",    nombre: "Semilla",    minimo: 0,    icono: "bi-flower1" },
        { id: "lector",     nombre: "Lector",     minimo: 100,  icono: "bi-book-half" },
        { id: "explorador", nombre: "Explorador", minimo: 300,  icono: "bi-compass" },
        { id: "erudito",    nombre: "Erudito",    minimo: 700,  icono: "bi-mortarboard" },
        { id: "leyenda",    nombre: "Leyenda",    minimo: 1500, icono: "bi-gem" }
    ];

    const estado = {
        lectores: [],
        filtrados: [],
        pagina: 1,
        cargando: false,
        usuarioActualId: null,
        nombreActual: ""
    };

    const $ = (id) => document.getElementById(id);
    const raiz = document.documentElement;

    const el = {
        conexion: $("estado-conexion"),
        actualizar: $("btnActualizar"),
        volver: $("btnVolver"),
        tema: $("btnTema"),

        tuAvatar: $("tu-avatar"),
        tuNombre: $("tu-nombre"),
        tuNivel: $("tu-nivel"),
        tuPuesto: $("tu-puesto"),
        tuPuntos: $("tu-puntos"),
        tuLibros: $("tu-libros"),
        progresoTexto: $("progreso-texto"),
        progresoPorcentaje: $("progreso-porcentaje"),
        barra: $("barra-progreso"),
        barraRelleno: $("barra-progreso-relleno"),

        totalLectores: $("total-lectores"),
        totalLibros: $("total-libros-leidos"),
        totalPuntos: $("total-puntos"),

        buscar: $("buscar-lector"),
        filtroNivel: $("filtro-nivel"),
        limpiar: $("btnLimpiarFiltros"),

        tabla: $("tabla-posiciones-body"),
        sinResultados: $("sin-resultados"),
        contador: $("contador-registros"),
        resumenPaginacion: $("resumen-paginacion"),
        paginaActual: $("pagina-actual"),
        anterior: $("btnPaginaAnterior"),
        siguiente: $("btnPaginaSiguiente")
    };

    /* ---------- Utilidades ---------- */

    const escaparHTML = (valor) =>
        String(valor ?? "").replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]);

    const normalizar = (texto) =>
        String(texto ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

    const formatoNumero = new Intl.NumberFormat("es-CO");

    const iniciales = (nombre) =>
        String(nombre || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte.charAt(0))
            .join("")
            .toUpperCase() || "?";

    const reducirMovimiento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    function animarNumero(elemento, destino) {
        if (!elemento) return;

        if (reducirMovimiento || destino === 0) {
            elemento.textContent = formatoNumero.format(destino);
            return;
        }

        const inicio = performance.now();
        const duracion = 700;

        const paso = (ahora) => {
            const avance = Math.min(1, (ahora - inicio) / duracion);
            const suavizado = 1 - Math.pow(1 - avance, 3);

            elemento.textContent = formatoNumero.format(
                Math.round(destino * suavizado)
            );

            if (avance < 1) requestAnimationFrame(paso);
        };

        requestAnimationFrame(paso);
    }

    /* ---------- SweetAlert2 ---------- */

    function estiloSwal() {
        const claro = raiz.dataset.tema === "claro";

        return {
            confirmButtonColor: "#7C5CF2",
            background: claro ? "#FFFFFF" : "#111A4A",
            color: claro ? "#1E2350" : "#E9EDFF"
        };
    }

    function mostrarMensaje(mensaje, tipo = "info") {
        const configuraciones = {
            success: { icon: "success", title: "¡Listo!", boton: "Continuar" },
            error:   { icon: "error",   title: "Algo salió mal", boton: "Entendido" },
            warning: { icon: "warning", title: "Atención", boton: "Entendido" },
            info:    { icon: "info",    title: "Información", boton: "Entendido" }
        };

        const config = configuraciones[tipo] ?? configuraciones.info;

        return Swal.fire({
            ...estiloSwal(),
            title: config.title,
            text: mensaje,
            icon: config.icon,
            confirmButtonText: config.boton,
            allowOutsideClick: false,
            customClass: {
                popup: "aurora-alerta",
                confirmButton: "aurora-alerta-confirmar"
            }
        });
    }

    /* ---------- API ---------- */

    async function solicitarAPI(ruta) {
        const respuesta = await fetch(ruta, {
            credentials: "same-origin",
            cache: "no-store",
            headers: { Accept: "application/json" }
        });

        if (respuesta.status === 401) {
            await mostrarMensaje(
                "Tu sesión ha finalizado. Inicia sesión nuevamente.",
                "warning"
            );
            window.location.replace("/");
            throw new Error("Sesión no válida.");
        }

        const texto = await respuesta.text();
        let datos = {};

        if (texto) {
            try {
                datos = JSON.parse(texto);
            } catch {
                datos = { mensaje: texto };
            }
        }

        if (!respuesta.ok || datos.ok === false) {
            throw new Error(
                datos.mensaje ||
                datos.error ||
                `El servidor respondió con el estado ${respuesta.status}.`
            );
        }

        return datos;
    }

    function actualizarConexion(mensaje, correcta = true) {
        if (!el.conexion) return;

        el.conexion.replaceChildren();

        const punto = document.createElement("span");
        punto.className = "estado-punto";

        el.conexion.append(punto, document.createTextNode(mensaje));
        el.conexion.dataset.estado = correcta ? "conectado" : "error";
    }

    /* ---------- Niveles ---------- */

    function nivelDe(puntos) {
        let actual = NIVELES[0];

        for (const nivel of NIVELES) {
            if (puntos >= nivel.minimo) actual = nivel;
        }

        return actual;
    }

    function siguienteNivel(nivel) {
        const indice = NIVELES.findIndex((n) => n.id === nivel.id);
        return NIVELES[indice + 1] ?? null;
    }

    function badgeNivel(nivel) {
        return `<span class="nivel-badge nivel-${nivel.id}">
            <i class="bi ${nivel.icono}" aria-hidden="true"></i>
            ${escaparHTML(nivel.nombre)}
        </span>`;
    }

    /* ---------- Normalización de datos ---------- */

    function listaDeRespuesta(datos) {
        if (Array.isArray(datos)) return datos;

        const lista = datos.lectores ?? datos.posiciones ?? datos.registros;

        if (!Array.isArray(lista)) {
            throw new Error(
                "La respuesta de /api/posiciones no contiene una lista reconocible."
            );
        }

        return lista;
    }

    function normalizarLector(registro, usuarioActualId) {
        const id = registro.usuario_id ?? registro.id ?? null;
        const nombre = String(registro.nombre ?? "").trim();
        const apellido = String(registro.apellido ?? "").trim();

        const puntos = Math.max(0, Number(registro.puntos) || 0);
        const libros = Math.max(
            0,
            Number(registro.libros_leidos ?? registro.libros) || 0
        );

        const esYo = Boolean(
            registro.es_yo ??
            registro.es_actual ??
            (usuarioActualId != null && id != null &&
                Number(id) === Number(usuarioActualId))
        );

        // Para los demás lectores solo se muestra la inicial del apellido.
        const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ");
        const nombrePublico = esYo
            ? nombreCompleto
            : [nombre, apellido ? `${apellido.charAt(0)}.` : ""]
                .filter(Boolean)
                .join(" ");

        return {
            id,
            nombre: nombrePublico || (id != null ? `Lector #${id}` : "Lector"),
            puntos,
            libros,
            nivel: nivelDe(puntos),
            esYo,
            puesto: 0
        };
    }

    function ordenarYAsignarPuestos(lectores) {
        lectores.sort((a, b) =>
            b.puntos - a.puntos ||
            b.libros - a.libros ||
            a.nombre.localeCompare(b.nombre, "es")
        );

        // Misma puntuación y mismos libros comparten puesto (1, 1, 3...).
        lectores.forEach((lector, indice) => {
            const anterior = lectores[indice - 1];

            lector.puesto =
                anterior &&
                anterior.puntos === lector.puntos &&
                anterior.libros === lector.libros
                    ? anterior.puesto
                    : indice + 1;
        });

        return lectores;
    }

    /* ---------- Carga ---------- */

    async function cargarPosiciones() {
        if (estado.cargando) return;

        estado.cargando = true;
        el.actualizar.disabled = true;

        el.tabla.innerHTML = `
            <tr>
                <td colspan="5" class="tabla-cargando">
                    <span class="spinner-border spinner-border-sm"
                          role="status" aria-hidden="true"></span>
                    Consultando lectores...
                </td>
            </tr>
        `;

        el.sinResultados.hidden = true;
        actualizarConexion("Conectando con el servidor...");

        try {
            // El nombre del usuario es opcional: si falla no bloquea la tabla.
const datos = await solicitarAPI(API_POSICIONES);

estado.nombreActual = "";

estado.usuarioActualId = datos.usuario_actual_id ?? null;

            estado.lectores = ordenarYAsignarPuestos(
                listaDeRespuesta(datos).map((registro) =>
                    normalizarLector(registro, estado.usuarioActualId)
                )
            );

            pintarResumen();
            pintarPodio();
            pintarTuPosicion();
            aplicarFiltros();

            actualizarConexion(
                `${estado.lectores.length} lectores recibidos del servidor.`,
                true
            );
        } catch (error) {
            console.error("Error al cargar la tabla de posiciones:", error);

            estado.lectores = [];
            estado.filtrados = [];

            pintarResumen();
            pintarPodio();
            pintarTuPosicion();
            renderizarTabla();

            actualizarConexion(
                "No se pudo cargar la tabla de posiciones. Verifica la API y tu sesión.",
                false
            );

            await mostrarMensaje(
                error.message || "No fue posible cargar la tabla de posiciones.",
                "error"
            );
        } finally {
            estado.cargando = false;
            el.actualizar.disabled = false;
        }
    }

    /* ---------- Resumen ---------- */

    function pintarResumen() {
        const totalLibros = estado.lectores.reduce((s, l) => s + l.libros, 0);
        const totalPuntos = estado.lectores.reduce((s, l) => s + l.puntos, 0);

        animarNumero(el.totalLectores, estado.lectores.length);
        animarNumero(el.totalLibros, totalLibros);
        animarNumero(el.totalPuntos, totalPuntos);
    }

    /* ---------- Podio ---------- */

    function pintarPodio() {
        [1, 2, 3].forEach((puesto) => {
            const tarjeta = $(`podio-${puesto}`);
            if (!tarjeta) return;

           const lector = estado.lectores.find(
    (item) => item.puesto === puesto
);

            tarjeta.querySelector(".podio-avatar").textContent =
                lector ? iniciales(lector.nombre) : "—";

            tarjeta.querySelector(".podio-nombre").textContent =
                lector ? lector.nombre : "Sin lector";

            tarjeta.querySelector(".podio-puntos").textContent =
                lector ? `${formatoNumero.format(lector.puntos)} pts` : "0 pts";

            tarjeta.title = lector
                ? `${lector.nombre} · ${lector.libros} libro${lector.libros === 1 ? "" : "s"} leído${lector.libros === 1 ? "" : "s"}`
                : "";
        });
    }

    /* ---------- Tu posición ---------- */

    function pintarTuPosicion() {
        const yo = estado.lectores.find((lector) => lector.esYo);

        if (!yo) {
            const nombre = estado.nombreActual || "Lector";

            el.tuAvatar.textContent = iniciales(nombre);
            el.tuNombre.textContent = nombre;
            el.tuPuesto.textContent = "—";
            el.tuPuntos.textContent = "—";
            el.tuLibros.textContent = "—";

            el.tuNivel.className = "nivel-chip";
            el.tuNivel.innerHTML =
                '<i class="bi bi-stars" aria-hidden="true"></i><span>Sin nivel</span>';

            establecerProgreso(
                0,
                estado.lectores.length
                    ? "Aún no apareces en la clasificación."
                    : "Sin datos de clasificación."
            );
            return;
        }

        el.tuAvatar.textContent = iniciales(yo.nombre);
        el.tuNombre.textContent = yo.nombre;
        el.tuPuesto.textContent = `#${yo.puesto}`;
        el.tuPuntos.textContent = formatoNumero.format(yo.puntos);
        el.tuLibros.textContent = formatoNumero.format(yo.libros);

        el.tuNivel.className = `nivel-chip nivel-${yo.nivel.id}`;
        el.tuNivel.innerHTML =
            `<i class="bi ${yo.nivel.icono}" aria-hidden="true"></i>` +
            `<span>${escaparHTML(yo.nivel.nombre)}</span>`;

        const siguiente = siguienteNivel(yo.nivel);

        if (!siguiente) {
            establecerProgreso(100, "¡Alcanzaste el nivel máximo!");
            return;
        }

        const tramo = siguiente.minimo - yo.nivel.minimo;
        const avance = yo.puntos - yo.nivel.minimo;
        const porcentaje = Math.min(100, Math.round((avance / tramo) * 100));
        const faltan = siguiente.minimo - yo.puntos;

        establecerProgreso(
            porcentaje,
            `Te faltan ${formatoNumero.format(faltan)} pts para ${siguiente.nombre}`
        );
    }

    function establecerProgreso(porcentaje, texto) {
        el.progresoTexto.textContent = texto;
        el.progresoPorcentaje.textContent = `${porcentaje}%`;
        el.barra.setAttribute("aria-valuenow", String(porcentaje));

        // Doble frame para que la transición CSS se note al cargar.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.barraRelleno.style.width = `${porcentaje}%`;
            });
        });
    }

    /* ---------- Filtros ---------- */

    function aplicarFiltros() {
        const busqueda = normalizar(el.buscar.value.trim());
        const nivelElegido = el.filtroNivel.value;

        estado.filtrados = estado.lectores.filter((lector) => {
            const coincideBusqueda =
                !busqueda || normalizar(lector.nombre).includes(busqueda);

            const coincideNivel =
                nivelElegido === "todos" || lector.nivel.id === nivelElegido;

            return coincideBusqueda && coincideNivel;
        });

        estado.pagina = 1;
        renderizarTabla();
    }

    /* ---------- Tabla ---------- */

    function claseMedalla(puesto) {
        return puesto === 1 ? " oro"
            : puesto === 2 ? " plata"
            : puesto === 3 ? " bronce"
            : "";
    }

    function filaHTML(lector) {
        return `
            <tr class="${lector.esYo ? "fila-yo" : ""}">
                <td>
                    <span class="puesto-numero${claseMedalla(lector.puesto)}">
                        ${lector.puesto}
                    </span>
                </td>
                <td>
                    <div class="lector-celda">
                        <span class="lector-avatar">${escaparHTML(iniciales(lector.nombre))}</span>
                        <div class="lector-info">
                            <strong>
                                ${escaparHTML(lector.nombre)}
                                ${lector.esYo ? '<span class="etiqueta-yo">Tú</span>' : ""}
                            </strong>
                        </div>
                    </div>
                </td>
                <td>${badgeNivel(lector.nivel)}</td>
                <td>${formatoNumero.format(lector.libros)}</td>
                <td class="puntos-celda">
                    <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
                    ${formatoNumero.format(lector.puntos)}
                </td>
            </tr>
        `;
    }

    function renderizarTabla() {
        const total = estado.filtrados.length;
        const paginas = Math.max(1, Math.ceil(total / REGISTROS_POR_PAGINA));

        estado.pagina = Math.min(estado.pagina, paginas);

        const inicio = (estado.pagina - 1) * REGISTROS_POR_PAGINA;
        const pagina = estado.filtrados.slice(inicio, inicio + REGISTROS_POR_PAGINA);

        el.contador.textContent = `${total} lector${total === 1 ? "" : "es"}`;
        el.paginaActual.textContent = estado.pagina;
        el.anterior.disabled = estado.pagina <= 1;
        el.siguiente.disabled = estado.pagina >= paginas;

        el.resumenPaginacion.textContent = total === 0
            ? "Mostrando 0 lectores"
            : `Mostrando ${inicio + 1}–${inicio + pagina.length} de ${total} lectores`;

        el.sinResultados.hidden = total !== 0;

        if (total === 0) {
            el.tabla.innerHTML = `
                <tr>
                    <td colspan="5" class="tabla-cargando">
                        No hay lectores para mostrar.
                    </td>
                </tr>
            `;
            return;
        }

        el.tabla.innerHTML = pagina.map(filaHTML).join("");
    }

    /* ---------- Tema claro / oscuro ---------- */

    function etiquetarTema() {
        if (!el.tema) return;

        el.tema.setAttribute(
            "aria-label",
            raiz.dataset.tema === "claro"
                ? "Cambiar a modo oscuro"
                : "Cambiar a modo claro"
        );
    }

    if (el.tema) {
        el.tema.addEventListener("click", () => {
            raiz.dataset.tema = raiz.dataset.tema === "claro" ? "oscuro" : "claro";

            try {
                localStorage.setItem("aurora_tema", raiz.dataset.tema);
            } catch {
                // El almacenamiento puede estar bloqueado.
            }

            etiquetarTema();
        });

        etiquetarTema();
    }

    /* ---------- Eventos ---------- */

    el.volver?.addEventListener("click", (evento) => {
        evento.preventDefault();

        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "/";
        }
    });

    el.actualizar.addEventListener("click", cargarPosiciones);

    el.buscar.addEventListener("input", aplicarFiltros);
    el.filtroNivel.addEventListener("change", aplicarFiltros);

    el.limpiar.addEventListener("click", () => {
        el.buscar.value = "";
        el.filtroNivel.value = "todos";
        aplicarFiltros();
    });

    el.anterior.addEventListener("click", () => {
        if (estado.pagina > 1) {
            estado.pagina--;
            renderizarTabla();
        }
    });

    el.siguiente.addEventListener("click", () => {
        const paginas = Math.max(
            1,
            Math.ceil(estado.filtrados.length / REGISTROS_POR_PAGINA)
        );

        if (estado.pagina < paginas) {
            estado.pagina++;
            renderizarTabla();
        }
    });

    /* ---------- Inicio ---------- */

    document.addEventListener("DOMContentLoaded", cargarPosiciones);
})();