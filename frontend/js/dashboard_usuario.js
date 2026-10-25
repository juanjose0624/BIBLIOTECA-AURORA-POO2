(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const MAX_PRESTAMOS = 3;
  const API_LIBROS = '/api/libros';
  const API_MIS_PRESTAMOS = '/api/prestamos/mis-prestamos';
  const API_SOLICITUDES = '/api/prestamos/solicitudes';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const dia = n => {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + n);
    return fecha;
  };

  const raiz = document.documentElement;
  let catalogo = [];
  let prestamos = [];
  let enviandoSolicitud = false;

  // ------------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------------

  const fmt = fecha => {
    if (!fecha) return 'Sin fecha';

    return fecha.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short'
    });
  };

  const clave = fecha =>
    `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;

  const norm = texto =>
    String(texto ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const esc = texto =>
    String(texto ?? '').replace(/[&<>"']/g, caracter => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[caracter]);

  const dias = (a, b) =>
    Math.round((a - b) / 86400000);

  // Evita interpretar una fecha YYYY-MM-DD como UTC.
  const convertirFecha = valor => {
    if (!valor) return null;

    if (valor instanceof Date) {
      const fecha = new Date(valor);
      fecha.setHours(0, 0, 0, 0);
      return fecha;
    }

    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(
      String(valor)
    );

    if (!coincidencia) return null;

    const fecha = new Date(
      Number(coincidencia[1]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[3])
    );

    fecha.setHours(0, 0, 0, 0);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  };

  const fechaISO = fecha => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const diaMes = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${diaMes}`;
  };

  // ------------------------------------------------------------
  // Notificaciones SweetAlert2
  // ------------------------------------------------------------

  const estiloSwal = () => {
    const claro = raiz.dataset.tema === 'claro';

    return {
      confirmButtonColor: '#7C5CF2',
      background: claro ? '#FFFFFF' : '#111A4A',
      color: claro ? '#1E2350' : '#E9EDFF'
    };
  };

  const mostrarMensaje = (mensaje, tipo = 'info') => {
    const configuraciones = {
      success: {
        icon: 'success',
        title: '¡Listo!',
        confirmButtonText: 'Continuar'
      },
      error: {
        icon: 'error',
        title: 'Algo salió mal',
        confirmButtonText: 'Entendido'
      },
      warning: {
        icon: 'warning',
        title: 'Atención',
        confirmButtonText: 'Entendido'
      },
      info: {
        icon: 'info',
        title: 'Información',
        confirmButtonText: 'Entendido'
      }
    };

    const configuracion = configuraciones[tipo] ?? configuraciones.info;

    return Swal.fire({
      ...estiloSwal(),
      title: configuracion.title,
      text: mensaje,
      icon: configuracion.icon,
      confirmButtonText: configuracion.confirmButtonText,
      allowOutsideClick: false,
      customClass: {
        popup: 'aurora-alerta',
        confirmButton: 'aurora-alerta-confirmar'
      }
    });
  };

  const mostrarError = (mensaje, error) => {
    console.error(mensaje, error);
    return mostrarMensaje(mensaje, 'error');
  };

  async function solicitarAPI(url, opciones = {}) {
    const respuesta = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...opciones,
      headers: {
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
        ...opciones.headers
      }
    });

    if (respuesta.status === 401) {
      await mostrarMensaje(
        'Tu sesión ha finalizado. Inicia sesión nuevamente.',
        'warning'
      );
      window.location.replace('/');
      throw new Error('Sesión no válida.');
    }

    let datos = {};

    try {
      datos = await respuesta.json();
    } catch {
      // La respuesta puede no contener JSON.
    }

    if (!respuesta.ok || datos.ok === false) {
      throw new Error(
        datos.mensaje || `La operación falló (HTTP ${respuesta.status}).`
      );
    }

    return datos;
  }

  // ------------------------------------------------------------
  // Tema claro / oscuro
  // ------------------------------------------------------------

  const etiquetarTema = () => {
    const boton = $('btnTema');
    if (!boton) return;

    boton.setAttribute(
      'aria-label',
      raiz.dataset.tema === 'claro'
        ? 'Cambiar a modo oscuro'
        : 'Cambiar a modo claro'
    );
  };

  const botonTema = $('btnTema');

  if (botonTema) {
    botonTema.addEventListener('click', () => {
      raiz.dataset.tema =
        raiz.dataset.tema === 'claro' ? 'oscuro' : 'claro';

      try {
        localStorage.setItem('aurora_tema', raiz.dataset.tema);
      } catch {
        // El almacenamiento puede estar bloqueado.
      }

      etiquetarTema();
    });

    etiquetarTema();
  }

  // ------------------------------------------------------------
  // Frase del día
  // ------------------------------------------------------------

  const frases = [
    {
      texto: 'El que lee mucho y anda mucho, ve mucho y sabe mucho.',
      autor: 'Miguel de Cervantes',
      obra: 'Don Quijote de la Mancha'
    },
    {
      texto: 'De los diversos instrumentos del hombre, el más asombroso es, sin duda, el libro.',
      autor: 'Jorge Luis Borges',
      obra: 'El libro'
    },
    {
      texto: 'Lo esencial es invisible a los ojos.',
      autor: 'Antoine de Saint-Exupéry',
      obra: 'El principito'
    },
    {
      texto: 'Leer es soñar de la mano de otro.',
      autor: 'Fernando Pessoa',
      obra: 'Libro del desasosiego'
    },
    {
      texto: 'Yo no estudio para saber más, sino para ignorar menos.',
      autor: 'Sor Juana Inés de la Cruz',
      obra: 'Respuesta a Sor Filotea'
    }
  ];

  const diaDelAnio = Math.floor(
    (hoy - new Date(hoy.getFullYear(), 0, 0)) / 86400000
  );

  const frase = frases[diaDelAnio % frases.length];

  if ($('fraseTexto')) {
    $('fraseTexto').textContent = frase.texto;
  }

  if ($('fraseAutor')) {
    $('fraseAutor').textContent = `${frase.autor} · ${frase.obra}`;
  }

  // ------------------------------------------------------------
  // Sesión
  // ------------------------------------------------------------

  const verificarSesion = async () => {
    try {
      const datos = await solicitarAPI('/api/yo');
      const nombreEl = $('nombreUsuario');

      if (datos?.ok && datos.nombre && nombreEl) {
        nombreEl.textContent = datos.nombre;
      }

      return true;
    } catch (error) {
      console.error('No fue posible verificar la sesión:', error);
      return false;
    }
  };

  window.addEventListener('pageshow', evento => {
    if (evento.persisted) verificarSesion();
  });

  // ------------------------------------------------------------
  // Reloj
  // ------------------------------------------------------------

  const tick = () => {
    const ahora = new Date();
    const hora = ahora.getHours();

    if ($('saludoHora')) {
      $('saludoHora').textContent =
        hora < 12 ? 'Buenos días' :
        hora < 19 ? 'Buenas tardes' : 'Buenas noches';
    }

    if ($('hora')) {
      $('hora').textContent = ahora.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    if ($('segundos')) {
      $('segundos').textContent =
        String(ahora.getSeconds()).padStart(2, '0');
    }

    if ($('fecha')) {
      $('fecha').textContent = ahora.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  tick();
  setInterval(tick, 1000);

  // ------------------------------------------------------------
  // Normalización de libros y préstamos recibidos desde Flask
  // ------------------------------------------------------------

  const normalizarLibro = libro => ({
    id: Number(libro.id),
    titulo: libro.titulo ?? '',
    autor: libro.autor ?? '',
    disp: Number(
      libro.cantidad_disponible ?? libro.disponibles ?? 0
    ) > 0
  });

  const normalizarPrestamo = registro => {
    const fechaVencimiento = convertirFecha(
      registro.fecha_vencimiento ?? registro.limite
    );

    const fechaDevolucion = convertirFecha(
      registro.fecha_devolucion ?? registro.entrega
    );

    let estado = String(
      registro.estado ?? registro.estado_prestamo ?? 'solicitado'
    ).toLowerCase();

    if (estado === 'aprobado') estado = 'prestado';

    if (
      estado === 'prestado' &&
      fechaVencimiento &&
      fechaVencimiento < hoy &&
      !fechaDevolucion
    ) {
      estado = 'vencido';
    }

    return {
      id: Number(registro.libro_id ?? registro.id),
      solicitudId: Number(
        registro.solicitud_id ?? registro.id
      ),
      prestamoId: registro.prestamo_id
        ? Number(registro.prestamo_id)
        : null,
      titulo: registro.libro_titulo ?? registro.titulo ?? 'Libro',
      autor: registro.autor ?? '',
      estado,
      limite: fechaVencimiento,
      entrega: fechaDevolucion,
      fechaSolicitud: registro.fecha_solicitud ?? null
    };
  };

  const activos = () =>
    prestamos.filter(p =>
      ['solicitado', 'prestado', 'vencido'].includes(p.estado)
    );

  const retrasado = prestamo =>
    ['prestado', 'vencido'].includes(prestamo.estado) &&
    prestamo.limite !== null &&
    prestamo.limite < hoy &&
    !prestamo.entrega;

  const estadoDe = prestamo => {
    if (prestamo.estado === 'devuelto') {
      return {
        txt: 'Entregado',
        cls: 'ok',
        det: `Entregado el ${fmt(prestamo.entrega)}`
      };
    }

    if (prestamo.estado === 'solicitado') {
      return {
        txt: 'Solicitado',
        cls: 'espera',
        det: 'Esperando respuesta de la biblioteca'
      };
    }

    if (prestamo.estado === 'rechazado') {
      return {
        txt: 'Rechazado',
        cls: 'tarde',
        det: 'La solicitud no fue aprobada'
      };
    }

    if (retrasado(prestamo)) {
      const atraso = dias(hoy, prestamo.limite);

      return {
        txt: `Retrasado ${atraso} d`,
        cls: 'tarde',
        det: `Debía entregarse el ${fmt(prestamo.limite)}`
      };
    }

    return {
      txt: 'Prestado',
      cls: 'ok',
      det: prestamo.limite
        ? `Devuelve el ${fmt(prestamo.limite)}`
        : 'Préstamo registrado'
    };
  };

  const filaPrestamo = prestamo => {
    const estado = estadoDe(prestamo);

    return `<div class="item${estado.cls === 'tarde' ? ' es-tarde' : ''}">
      <div>
        <b>${esc(prestamo.titulo)}</b>
        <small>${esc(prestamo.autor)} · ${esc(estado.det)}</small>
      </div>
      <span class="estado ${estado.cls}">${esc(estado.txt)}</span>
    </div>`;
  };

  // ------------------------------------------------------------
  // Cargar información real desde el backend
  // ------------------------------------------------------------

  async function cargarLibros() {
    const datos = await solicitarAPI(API_LIBROS);

    const lista = Array.isArray(datos)
      ? datos
      : datos.libros ?? datos.registros ?? datos.datos ?? [];

    catalogo = lista.map(normalizarLibro);
  }

  async function cargarMisPrestamos() {
    const datos = await solicitarAPI(API_MIS_PRESTAMOS);

    const lista = Array.isArray(datos)
      ? datos
      : datos.prestamos ?? datos.solicitudes ?? datos.registros ?? [];

    prestamos = lista.map(normalizarPrestamo);
  }

  async function cargarDatos() {
    const resultados = $('resultados');

    if (resultados) {
      resultados.innerHTML =
        '<p class="vacio">Cargando catálogo de la biblioteca…</p>';
    }

    try {
      const sesionValida = await verificarSesion();
      if (!sesionValida) return;

      await Promise.all([
        cargarLibros(),
        cargarMisPrestamos()
      ]);

      pintarTodo();
    } catch (error) {
      console.error('Error cargando información de la biblioteca:', error);

      if (resultados) {
        resultados.innerHTML =
          `<p class="vacio">${esc(error.message || 'No fue posible cargar los datos.')}</p>`;
      }

      if ($('pendientesLista')) {
        $('pendientesLista').innerHTML =
          '<p class="vacio">No fue posible cargar tus préstamos.</p>';
      }
    }
  }

  // ------------------------------------------------------------
  // Próxima devolución
  // ------------------------------------------------------------

  const pintarProxima = () => {
    const elemento = $('proxima');
    if (!elemento) return;

    const tarde = prestamos.filter(retrasado).length;

    const vigentes = prestamos
      .filter(p =>
        p.estado === 'prestado' &&
        !retrasado(p) &&
        p.limite
      )
      .sort((a, b) => a.limite - b.limite);

    elemento.classList.toggle('alerta-txt', tarde > 0);

    if (tarde) {
      elemento.textContent =
        `Tienes ${tarde} ${tarde === 1 ? 'libro retrasado' : 'libros retrasados'}. Devuélvelo pronto.`;
      return;
    }

    if (!vigentes.length) {
      elemento.textContent =
        'No tienes devoluciones pendientes.';
      return;
    }

    const diasRestantes = dias(vigentes[0].limite, hoy);

    elemento.textContent =
      `Próxima devolución: ${vigentes[0].titulo} · ${
        diasRestantes === 0 ? 'hoy' :
        diasRestantes === 1 ? 'mañana' :
        `en ${diasRestantes} días`
      }`;
  };

  // ------------------------------------------------------------
  // Calendario
  // ------------------------------------------------------------

  let mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const pintarCalendario = () => {
    if (!$('calTitulo') || !$('calGrid')) return;

    $('calTitulo').textContent =
      mes.toLocaleDateString('es-CO', {
        month: 'long',
        year: 'numeric'
      });

    const marcas = {};

    activos()
      .filter(p => p.limite)
      .forEach(p => {
        marcas[clave(p.limite)] = p;
      });

    const total = new Date(
      mes.getFullYear(),
      mes.getMonth() + 1,
      0
    ).getDate();

    let html = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
      .map(d => `<span class="cal-sem">${d}</span>`)
      .join('');

    html += '<span></span>'.repeat((mes.getDay() + 6) % 7);

    for (let numero = 1; numero <= total; numero++) {
      const fecha = new Date(
        mes.getFullYear(),
        mes.getMonth(),
        numero
      );

      const prestamo = marcas[clave(fecha)];

      const clase = [
        'cal-dia',
        clave(fecha) === clave(hoy) ? 'hoy' : '',
        prestamo
          ? (fecha < hoy ? 'vencida' : 'vence')
          : ''
      ].join(' ');

      html += `<span class="${clase}"${
        prestamo
          ? ` title="Devolver: ${esc(prestamo.titulo)}"`
          : ''
      }>${numero}</span>`;
    }

    $('calGrid').innerHTML = html;
  };

  if ($('calPrev')) {
    $('calPrev').onclick = () => {
      mes = new Date(mes.getFullYear(), mes.getMonth() - 1, 1);
      pintarCalendario();
    };
  }

  if ($('calSig')) {
    $('calSig').onclick = () => {
      mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
      pintarCalendario();
    };
  }

  // ------------------------------------------------------------
  // Cupos de préstamo
  // ------------------------------------------------------------

  const pintarCupos = () => {
    const usados = activos().length;

    if ($('cupos')) {
      $('cupos').innerHTML = Array.from(
        { length: MAX_PRESTAMOS },
        (_, i) =>
          `<span class="cupo${i < usados ? ' usado' : ''}"></span>`
      ).join('');
    }

    if ($('cuposTexto')) {
      $('cuposTexto').textContent =
        `${usados} de ${MAX_PRESTAMOS} préstamos en uso`;
    }
  };

  // ------------------------------------------------------------
  // Búsqueda y solicitudes reales
  // ------------------------------------------------------------

  const pintarResultados = () => {
    if (!$('buscar') || !$('resultados')) return;

    const consulta = norm($('buscar').value.trim());
    const contenedor = $('resultados');

    if (!consulta) {
      contenedor.innerHTML =
        '<p class="vacio">Escribe el nombre de un libro o de un autor.</p>';
      return;
    }

    const lista = catalogo
      .filter(libro =>
        norm(`${libro.titulo} ${libro.autor}`).includes(consulta)
      )
      .slice(0, 5);

    if (!lista.length) {
      contenedor.innerHTML =
        '<p class="vacio">No encontramos coincidencias.</p>';
      return;
    }

    const llenos = activos().length >= MAX_PRESTAMOS;

    contenedor.innerHTML = lista.map(libro => {
      const yaTieneSolicitud = activos().some(
        p => p.id === libro.id
      );

      const motivo = yaTieneSolicitud
        ? 'Ya solicitado o prestado'
        : !libro.disp
          ? 'No disponible'
          : llenos
            ? 'Sin cupos'
            : '';

      return `<div class="item">
        <div>
          <b>${esc(libro.titulo)}</b>
          <small>${esc(libro.autor)}</small>
        </div>
        <button
          class="btn btn-aurora btn-mini"
          type="button"
          data-id="${libro.id}"
          ${motivo || enviandoSolicitud ? 'disabled' : ''}
        >${esc(motivo || 'Solicitar')}</button>
      </div>`;
    }).join('');
  };

  if ($('buscar')) {
    $('buscar').addEventListener('input', pintarResultados);
  }

  if ($('resultados')) {
    $('resultados').addEventListener('click', async evento => {
      const boton = evento.target.closest('button[data-id]');

      if (!boton || enviandoSolicitud) return;

      const libroId = Number(boton.dataset.id);
      const libro = catalogo.find(l => l.id === libroId);

      if (!libro) return;

      if (activos().length >= MAX_PRESTAMOS) {
        mostrarMensaje(
          'Ya tienes el máximo de tres solicitudes o préstamos activos.',
          'warning'
        );
        return;
      }

      if (!libro.disp) {
        mostrarMensaje(
          'Este libro no tiene ejemplares disponibles.',
          'warning'
        );
        return;
      }

      if (activos().some(p => p.id === libroId)) {
        mostrarMensaje(
          'Ya tienes una solicitud o préstamo para este libro.',
          'warning'
        );
        return;
      }

      enviandoSolicitud = true;
      pintarResultados();

      try {
        await solicitarAPI(API_SOLICITUDES, {
          method: 'POST',
          body: JSON.stringify({ libro_id: libroId })
        });

        await mostrarMensaje(
          'Tu solicitud fue registrada. Podrás consultar su estado aquí cuando la biblioteca responda.',
          'success'
        );

        await Promise.all([
          cargarLibros(),
          cargarMisPrestamos()
        ]);

        pintarTodo();
      } catch (error) {
        await mostrarError(
          error.message || 'No fue posible registrar la solicitud.',
          error
        );
      } finally {
        enviandoSolicitud = false;
        pintarResultados();
      }
    });
  }

  // ------------------------------------------------------------
  // Pendientes e historial
  // ------------------------------------------------------------

  const pintarPendientes = () => {
    if (!$('pendientesLista')) return;

    const lista = activos();

    $('pendientesLista').innerHTML = lista.length
      ? lista.map(filaPrestamo).join('')
      : '<p class="vacio">No tienes libros pendientes.</p>';
  };

  const pintarHistorial = () => {
    if (!$('historialLista')) return;

    const tarde = prestamos.filter(retrasado);

    const historial = [
      ...tarde,
      ...prestamos.filter(p =>
        ['devuelto', 'rechazado'].includes(p.estado)
      )
    ];

    if ($('historialAlerta')) {
      $('historialAlerta').innerHTML = tarde.length
        ? `<div class="alerta" role="alert">
            Tienes ${tarde.length}
            ${tarde.length === 1 ? 'libro retrasado' : 'libros retrasados'}.
            Devuélvelo lo antes posible.
          </div>`
        : '';
    }

    $('historialLista').innerHTML = historial.length
      ? historial.map(filaPrestamo).join('')
      : '<p class="vacio">Aún no tienes historial.</p>';
  };

  function pintarTodo() {
    pintarCupos();
    pintarResultados();
    pintarPendientes();
    pintarHistorial();
    pintarProxima();
    pintarCalendario();
  }

  // ------------------------------------------------------------
  // Notas locales del usuario
  // ------------------------------------------------------------

  const LLAVE = 'aurora_notas';
  let notas = [];

  try {
    notas = JSON.parse(localStorage.getItem(LLAVE)) || [];
    if (!Array.isArray(notas)) notas = [];
  } catch {
    notas = [];
  }

  const guardarNotas = () => {
    try {
      localStorage.setItem(LLAVE, JSON.stringify(notas));
    } catch {
      // El almacenamiento puede estar bloqueado.
    }
  };

  const pintarNotas = () => {
    const lista = $('notasLista');
    if (!lista) return;

    lista.innerHTML = notas.length
      ? notas.map(nota => `<li>
          <span>${esc(nota.texto)}</span>
          <button
            class="nota-borrar"
            type="button"
            data-id="${nota.id}"
            aria-label="Borrar nota"
          >×</button>
        </li>`).join('')
      : '<li class="vacio" style="background:none;border:0">Aún no tienes notas.</li>';
  };

  if ($('notaTexto')) {
    $('notaTexto').addEventListener('input', evento => {
      if ($('notaCuenta')) {
        $('notaCuenta').textContent = evento.target.value.length;
      }
    });
  }

  if ($('notaGuardar')) {
    $('notaGuardar').addEventListener('click', () => {
      const texto = $('notaTexto')?.value.trim();
      if (!texto) return;

      notas.unshift({
        id: Date.now(),
        texto
      });

      guardarNotas();
      pintarNotas();

      $('notaTexto').value = '';

      if ($('notaCuenta')) {
        $('notaCuenta').textContent = '0';
      }
    });
  }

  if ($('notasLista')) {
    $('notasLista').addEventListener('click', evento => {
      const boton = evento.target.closest('.nota-borrar');
      if (!boton) return;

      notas = notas.filter(
        nota => nota.id !== Number(boton.dataset.id)
      );

      guardarNotas();
      pintarNotas();
    });
  }

  pintarNotas();

  // Inicialización: datos reales del servidor.
  cargarDatos();
})();