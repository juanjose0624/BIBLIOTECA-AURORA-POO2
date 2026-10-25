
"use strict";

/* =========================================================
   AURORA LIBRIS · ESTADÍSTICAS
   Archivo: administrador/js/estadisticas.js

   Endpoint esperado:
   GET /api/estadisticas

   Las estadísticas deben ser calculadas en el backend
   mediante consultas SQL a PostgreSQL.
   ========================================================= */

const API_ESTADISTICAS = "/api/estadisticas";

const $ = (selector) => document.querySelector(selector);

const formatoNumero = new Intl.NumberFormat("es-CO");

const elementos = {
    estadoConexion: $("#estado-conexion"),
    ultimaActualizacion: $("#ultima-actualizacion"),

    totalUsuarios: $("#total-usuarios"),
    totalAdministradores: $("#total-administradores"),
    totalPrestamos: $("#total-prestamos"),
    totalPqrs: $("#total-pqrs"),
    totalDisponibles: $("#total-disponibles"),
    totalNoDisponibles: $("#total-no-disponibles"),

    totalTitulos: $("#total-titulos"),
    totalEjemplares: $("#total-ejemplares"),
    porcentajeDisponible: $("#porcentaje-disponible"),

    barraDisponibles: $("#barra-disponibles"),
    barraNoDisponibles: $("#barra-no-disponibles"),
    leyendaDisponibles: $("#leyenda-disponibles"),
    leyendaNoDisponibles: $("#leyenda-no-disponibles"),

    pqrsTotal: $("#pqrs-total"),
    pqrsPendientes: $("#pqrs-pendientes"),
    pqrsEnProceso: $("#pqrs-en-proceso"),
    pqrsResueltas: $("#pqrs-resueltas"),

    graficoDisponibilidad: $("#grafico-disponibilidad"),
    graficoUsuarios: $("#grafico-usuarios"),
    graficoPqrs: $("#grafico-pqrs"),
    graficoPrestamos: $("#grafico-prestamos"),

    botonPDF: $("#btnExportarPDF")
};

/* ---------- Utilidades ---------- */

function numeroSeguro(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= 0 ? numero : 0;
}

function mostrarNumero(elemento, valor) {
    if (!elemento) return;

    elemento.textContent = formatoNumero.format(numeroSeguro(valor));
}

function mostrarPorcentaje(elemento, valor) {
    if (!elemento) return;

    const porcentaje = Math.min(100, Math.max(0, numeroSeguro(valor)));

    elemento.textContent = `${porcentaje.toLocaleString("es-CO", {
        maximumFractionDigits: 1
    })}%`;
}

function actualizarBarra(elemento, porcentaje) {
    if (!elemento) return;

    const valor = Math.min(100, Math.max(0, numeroSeguro(porcentaje)));

    elemento.style.width = `${valor}%`;
}

function mostrarEstadoConexion(mensaje, estado = "cargando") {
    if (!elementos.estadoConexion) return;

    elementos.estadoConexion.classList.remove(
        "conectado",
        "error",
        "cargando"
    );

    elementos.estadoConexion.classList.add(estado);

    const texto = elementos.estadoConexion.querySelector(
        "[data-estado-texto]"
    );

    if (texto) {
        texto.textContent = mensaje;
    } else {
        // Conserva el indicador visual existente.
        const punto = elementos.estadoConexion.querySelector(
            ".estado-punto"
        );

        elementos.estadoConexion.textContent = "";

        if (punto) {
            elementos.estadoConexion.appendChild(punto);
        } else {
            const nuevoPunto = document.createElement("span");
            nuevoPunto.className = "estado-punto";
            elementos.estadoConexion.appendChild(nuevoPunto);
        }

        elementos.estadoConexion.appendChild(
            document.createTextNode(` ${mensaje}`)
        );
    }
}

function mostrarUltimaActualizacion() {
    if (!elementos.ultimaActualizacion) return;

    const ahora = new Date();

    elementos.ultimaActualizacion.textContent =
        `Actualizado: ${ahora.toLocaleString("es-CO", {
            dateStyle: "medium",
            timeStyle: "short"
        })}`;
}

function mostrarErrorGrafico(contenedor, mensaje) {
    if (!contenedor) return;

    contenedor.replaceChildren();

    const texto = document.createElement("p");
    texto.className = "estado-grafico";
    texto.textContent = mensaje;

    contenedor.appendChild(texto);
}

/* ---------- Carga de estadísticas ---------- */

async function obtenerEstadisticas() {
    mostrarEstadoConexion("Conectando con el servidor...", "cargando");

    try {
        const respuesta = await fetch(API_ESTADISTICAS, {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            credentials: "same-origin",
            cache: "no-store"
        });

        if (respuesta.status === 401 || respuesta.status === 403) {
            throw new Error(
                "No tienes autorización para consultar estas estadísticas. Inicia sesión con una cuenta administradora."
            );
        }

        if (!respuesta.ok) {
            throw new Error(
                `El servidor respondió con el código ${respuesta.status}.`
            );
        }

        const datos = await respuesta.json();

        if (!datos || datos.ok !== true || !datos.estadisticas) {
            throw new Error(
                datos?.mensaje ||
                "La respuesta del servidor no tiene el formato esperado."
            );
        }

        renderizarEstadisticas(datos.estadisticas);

        mostrarEstadoConexion("Conectado con PostgreSQL", "conectado");
        mostrarUltimaActualizacion();

    } catch (error) {
        console.error("Error al cargar las estadísticas:", error);

        mostrarEstadoConexion("No se pudieron cargar los datos", "error");

        mostrarErrorGrafico(
            elementos.graficoDisponibilidad,
            error.message
        );

        mostrarErrorGrafico(
            elementos.graficoUsuarios,
            "No fue posible cargar las estadísticas de usuarios."
        );

        mostrarErrorGrafico(
            elementos.graficoPqrs,
            "No fue posible cargar las estadísticas de PQRS."
        );

        mostrarErrorGrafico(
            elementos.graficoPrestamos,
            "No fue posible cargar las estadísticas de préstamos."
        );
    }
}

/* ---------- Actualizar tarjetas y paneles ---------- */

function renderizarEstadisticas(datos) {
    const usuarios = datos.usuarios ?? {};
    const libros = datos.libros ?? {};
    const prestamos = datos.prestamos ?? {};
    const pqrs = datos.pqrs ?? {};

    mostrarNumero(elementos.totalUsuarios, usuarios.total);
    mostrarNumero(elementos.totalAdministradores, usuarios.administradores);
    mostrarNumero(elementos.totalPrestamos, prestamos.total);
    mostrarNumero(elementos.totalPqrs, pqrs.total);

    mostrarNumero(
        elementos.totalDisponibles,
        libros.ejemplares_disponibles
    );

    mostrarNumero(
        elementos.totalNoDisponibles,
        libros.ejemplares_no_disponibles
    );

    mostrarNumero(elementos.totalTitulos, libros.titulos);
    mostrarNumero(elementos.totalEjemplares, libros.ejemplares_totales);

    const ejemplaresTotales = numeroSeguro(libros.ejemplares_totales);
    const ejemplaresDisponibles = numeroSeguro(
        libros.ejemplares_disponibles
    );
    const ejemplaresNoDisponibles = numeroSeguro(
        libros.ejemplares_no_disponibles
    );

    const porcentaje = ejemplaresTotales > 0
        ? (ejemplaresDisponibles / ejemplaresTotales) * 100
        : 0;

    mostrarPorcentaje(elementos.porcentajeDisponible, porcentaje);

    actualizarBarra(
        elementos.barraDisponibles,
        porcentaje
    );

    actualizarBarra(
        elementos.barraNoDisponibles,
        ejemplaresTotales > 0
            ? (ejemplaresNoDisponibles / ejemplaresTotales) * 100
            : 0
    );

    mostrarNumero(elementos.leyendaDisponibles, ejemplaresDisponibles);
    mostrarNumero(elementos.leyendaNoDisponibles, ejemplaresNoDisponibles);

    mostrarNumero(elementos.pqrsTotal, pqrs.total);
    mostrarNumero(elementos.pqrsPendientes, pqrs.pendientes);
    mostrarNumero(elementos.pqrsEnProceso, pqrs.en_proceso);
    mostrarNumero(elementos.pqrsResueltas, pqrs.resueltas);

    renderizarGraficos(datos);
}

/* ---------- Gráficos ---------- */

/*
 * Los gráficos utilizan Chart.js como alternativa funcional
 * hasta integrar y verificar la API exacta de DSChart.
 *
 * Para habilitarlos, carga Chart.js antes de este archivo.
 */

const instanciasGraficos = {};

function crearGrafico(id, configuracion) {
    const contenedor = document.getElementById(id);

    if (!contenedor) return;

    if (typeof Chart === "undefined") {
        mostrarErrorGrafico(
            contenedor,
            "Falta cargar la biblioteca de gráficos. Integra DSChart o Chart.js para visualizar los datos."
        );
        return;
    }

    let canvas = contenedor.querySelector("canvas");

    if (!canvas) {
        contenedor.replaceChildren();
        canvas = document.createElement("canvas");
        contenedor.appendChild(canvas);
    }

    if (instanciasGraficos[id]) {
        instanciasGraficos[id].destroy();
    }

    instanciasGraficos[id] = new Chart(
        canvas.getContext("2d"),
        configuracion
    );
}

function opcionesGrafico() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: "#E9EDFF",
                    usePointStyle: true,
                    padding: 18,
                    font: {
                        family: "Manrope"
                    }
                }
            }
        }
    };
}

function renderizarGraficos(datos) {
    const libros = datos.libros ?? {};
    const usuarios = datos.usuarios ?? {};
    const pqrs = datos.pqrs ?? {};
    const prestamos = datos.prestamos ?? {};

    if (typeof Chart === "undefined") {
        [
            elementos.graficoDisponibilidad,
            elementos.graficoUsuarios,
            elementos.graficoPqrs,
            elementos.graficoPrestamos
        ].forEach((contenedor) => {
            mostrarErrorGrafico(
                contenedor,
                "Carga la biblioteca de gráficos para visualizar esta información."
            );
        });
        return;
    }

    crearGrafico("grafico-disponibilidad", {
        type: "doughnut",
        data: {
            labels: ["Disponibles", "No disponibles"],
            datasets: [{
                data: [
                    numeroSeguro(libros.ejemplares_disponibles),
                    numeroSeguro(libros.ejemplares_no_disponibles)
                ],
                backgroundColor: ["#76E2B3", "#7C5CF2"],
                borderColor: "#141E4E",
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            ...opcionesGrafico(),
            cutout: "68%"
        }
    });

    crearGrafico("grafico-usuarios", {
        type: "doughnut",
        data: {
            labels: ["Usuarios", "Administradores"],
            datasets: [{
                data: [
                    Math.max(
                        0,
                        numeroSeguro(usuarios.total) -
                        numeroSeguro(usuarios.administradores)
                    ),
                    numeroSeguro(usuarios.administradores)
                ],
                backgroundColor: ["#8FD3FF", "#A99AFF"],
                borderColor: "#141E4E",
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            ...opcionesGrafico(),
            cutout: "68%"
        }
    });

    crearGrafico("grafico-pqrs", {
        type: "bar",
        data: {
            labels: ["Pendientes", "En proceso", "Resueltas"],
            datasets: [{
                label: "Cantidad de PQRS",
                data: [
                    numeroSeguro(pqrs.pendientes),
                    numeroSeguro(pqrs.en_proceso),
                    numeroSeguro(pqrs.resueltas)
                ],
                backgroundColor: ["#FFCC8A", "#8FD3FF", "#76E2B3"],
                borderRadius: 8,
                maxBarThickness: 54
            }]
        },
        options: {
            ...opcionesGrafico(),
            scales: {
                x: {
                    ticks: { color: "#A9B4D8" },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#A9B4D8",
                        precision: 0
                    },
                    grid: {
                        color: "rgba(201, 190, 255, 0.10)"
                    }
                }
            }
        }
    });

    const historial = Array.isArray(prestamos.historial)
        ? prestamos.historial
        : [];

    crearGrafico("grafico-prestamos", {
        type: "line",
        data: {
            labels: historial.map((fila) => String(fila.periodo ?? "")),
            datasets: [{
                label: "Préstamos",
                data: historial.map((fila) => numeroSeguro(fila.total)),
                borderColor: "#8FD3FF",
                backgroundColor: "rgba(143, 211, 255, 0.13)",
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            ...opcionesGrafico(),
            scales: {
                x: {
                    ticks: { color: "#A9B4D8" },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#A9B4D8",
                        precision: 0
                    },
                    grid: {
                        color: "rgba(201, 190, 255, 0.10)"
                    }
                }
            }
        }
    });
}

/* ---------- Exportación a PDF ---------- */

async function exportarPDF() {
    const boton = elementos.botonPDF;
    const contenido = $(".estadisticas");

    if (!contenido) {
        alert("No se encontró el contenido de las estadísticas.");
        return;
    }

    if (
        !window.jspdf ||
        typeof window.jspdf.jsPDF !== "function" ||
        typeof window.html2canvas !== "function"
    ) {
        alert(
            "No se pudieron cargar las bibliotecas necesarias para generar el PDF. Verifica tu conexión a internet."
        );
        return;
    }

    const textoOriginal = boton?.textContent;

    try {
        if (boton) {
            boton.disabled = true;
            boton.textContent = "Generando informe...";
        }

        const { jsPDF } = window.jspdf;

        const lienzo = await window.html2canvas(contenido, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#111A4A",
            logging: false,
            ignoreElements: (elemento) =>
                elemento.classList?.contains("btn-arriba")
        });

        const imagen = lienzo.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const anchoPagina = pdf.internal.pageSize.getWidth();
        const altoPagina = pdf.internal.pageSize.getHeight();
        const margen = 10;
        const anchoImagen = anchoPagina - margen * 2;
        const altoImagen = lienzo.height * anchoImagen / lienzo.width;
        const altoUtil = altoPagina - margen * 2;

        let alturaRestante = altoImagen;
        let posicionY = margen;

        pdf.setProperties({
            title: "Estadísticas de Aurora Libris",
            subject: "Informe del sistema de biblioteca",
            author: "Aurora Libris",
            creator: "Aurora Libris"
        });

        pdf.addImage(
            imagen,
            "PNG",
            margen,
            posicionY,
            anchoImagen,
            altoImagen
        );

        alturaRestante -= altoUtil;

        while (alturaRestante > 0) {
            pdf.addPage();
            posicionY = margen - (altoImagen - alturaRestante);

            pdf.addImage(
                imagen,
                "PNG",
                margen,
                posicionY,
                anchoImagen,
                altoImagen
            );

            alturaRestante -= altoUtil;
        }

        const fecha = new Date().toISOString().slice(0, 10);

        pdf.save(`aurora-libris-estadisticas-${fecha}.pdf`);

    } catch (error) {
        console.error("Error al generar el PDF:", error);
        alert("No fue posible generar el PDF. Inténtalo nuevamente.");

    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = textoOriginal || "Exportar informe PDF";
        }
    }
}

/* ---------- Inicialización ---------- */

function inicializarEstadisticas() {
    if (elementos.botonPDF) {
        elementos.botonPDF.addEventListener("click", exportarPDF);
    }

    obtenerEstadisticas();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        inicializarEstadisticas,
        { once: true }
    );
} else {
    inicializarEstadisticas();
}
