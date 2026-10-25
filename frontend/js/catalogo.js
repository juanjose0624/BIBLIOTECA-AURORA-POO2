
document.addEventListener("DOMContentLoaded", () => {
    const rejilla = document.getElementById("rejilla-libros");
    const contador = document.getElementById("contador-libros");

    const LIBROS_POR_PAGINA = 10;
    const API_LIBROS = "/api/libros";

    let libros = [];
    let paginaActual = 1;

    // Controles de paginación.
    const paginacion = document.createElement("nav");
    paginacion.className = "paginacion-catalogo";
    paginacion.setAttribute("aria-label", "Paginación del catálogo");
    paginacion.innerHTML = `
        <button type="button" class="pagina-btn" id="pagina-anterior">
            Anterior
        </button>

        <span class="pagina-info" id="pagina-info" aria-live="polite">
            Página 1 de 1
        </span>

        <button type="button" class="pagina-btn" id="pagina-siguiente">
            Siguiente
        </button>
    `;

    rejilla.insertAdjacentElement("afterend", paginacion);

    const botonAnterior = paginacion.querySelector("#pagina-anterior");
    const botonSiguiente = paginacion.querySelector("#pagina-siguiente");
    const infoPagina = paginacion.querySelector("#pagina-info");

    function escaparTexto(valor) {
        return valor === null || valor === undefined || valor === ""
            ? "No especificado"
            : String(valor);
    }

    function crearTarjeta(libro, indice) {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-libro";

        const numero = document.createElement("span");
        numero.className = "numero-libro";
        numero.textContent = String(indice).padStart(2, "0");

        const titulo = document.createElement("h3");
        titulo.textContent = escaparTexto(libro.titulo);

        const autor = document.createElement("p");
        autor.className = "dato-libro";
        autor.textContent = `Autor: ${escaparTexto(libro.autor)}`;

        const isbn = document.createElement("p");
        isbn.className = "dato-libro";
        isbn.textContent = `ISBN: ${escaparTexto(libro.isbn)}`;

        tarjeta.append(numero, titulo, autor, isbn);

        return tarjeta;
    }

    function mostrarPagina() {
        const totalLibros = libros.length;
        const totalPaginas = Math.ceil(totalLibros / LIBROS_POR_PAGINA);

        rejilla.replaceChildren();

        if (totalLibros === 0) {
            contador.textContent = "No hay libros disponibles.";
            rejilla.innerHTML = `
                <p class="estado-catalogo">
                    Pronto encontrarás nuevas historias aquí.
                </p>
            `;
            paginacion.hidden = true;
            rejilla.setAttribute("aria-busy", "false");
            return;
        }

        // Evita páginas fuera de rango si cambia el catálogo.
        paginaActual = Math.min(Math.max(paginaActual, 1), totalPaginas);

        const inicio = (paginaActual - 1) * LIBROS_POR_PAGINA;
        const librosPagina = libros.slice(
            inicio,
            inicio + LIBROS_POR_PAGINA
        );

        librosPagina.forEach((libro, indice) => {
            rejilla.appendChild(crearTarjeta(libro, inicio + indice + 1));
        });

        const desde = inicio + 1;
        const hasta = inicio + librosPagina.length;

        contador.textContent =
            `${totalLibros} ${totalLibros === 1 ? "libro" : "libros"}`;

        infoPagina.textContent =
            `Página ${paginaActual} de ${totalPaginas} · ${desde}-${hasta} de ${totalLibros}`;

        botonAnterior.disabled = paginaActual === 1;
        botonSiguiente.disabled = paginaActual === totalPaginas;

        // Oculta los controles cuando solo existe una página.
        paginacion.hidden = totalPaginas <= 1;

        rejilla.setAttribute("aria-busy", "false");
    }

    botonAnterior.addEventListener("click", () => {
        if (paginaActual > 1) {
            paginaActual--;
            mostrarPagina();
            rejilla.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });

    botonSiguiente.addEventListener("click", () => {
        const totalPaginas = Math.ceil(
            libros.length / LIBROS_POR_PAGINA
        );

        if (paginaActual < totalPaginas) {
            paginaActual++;
            mostrarPagina();
            rejilla.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });

    async function cargarCatalogo() {
        try {
            rejilla.setAttribute("aria-busy", "true");

            const respuesta = await fetch(API_LIBROS, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                },
                credentials: "same-origin"
            });

            if (!respuesta.ok) {
                throw new Error(
                    `Error al consultar los libros: HTTP ${respuesta.status}`
                );
            }

            const datos = await respuesta.json();

            // Admite tanto un arreglo como un objeto con la propiedad libros.
            libros = Array.isArray(datos)
                ? datos
                : Array.isArray(datos.libros)
                    ? datos.libros
                    : [];

            paginaActual = 1;
            mostrarPagina();
        } catch (error) {
            console.error(
                "Aurora Libris: no fue posible cargar el catálogo.",
                error
            );

            contador.textContent = "No se pudo cargar el catálogo.";
            rejilla.replaceChildren();

            const mensaje = document.createElement("p");
            mensaje.className = "estado-catalogo";
            mensaje.textContent =
                "No pudimos cargar los libros. Intenta nuevamente más tarde.";

            rejilla.appendChild(mensaje);
            rejilla.setAttribute("aria-busy", "false");
            paginacion.hidden = true;
        }
    }

    cargarCatalogo();
});
