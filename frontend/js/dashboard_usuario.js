(() => {
  const $ = id => document.getElementById(id);
  const MAX_PRESTAMOS = 3;

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dia = n => { const d = new Date(hoy); d.setDate(d.getDate() + n); return d; };
    // Modo claro / oscuro (el tema inicial lo pone un script corto en el <head>)
  const raiz = document.documentElement;

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

  // Frase del día: cinco frases rotativas
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

  const fraseTexto = $('fraseTexto');
  const fraseAutor = $('fraseAutor');

  if (fraseTexto) fraseTexto.textContent = frase.texto;

  if (fraseAutor) {
    fraseAutor.textContent = `${frase.autor} · ${frase.obra}`;
  }
  const fmt = d => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const clave = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const norm = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dias = (a, b) => Math.round((a - b) / 86400000);

  // Datos de ejemplo. Más adelante vendrán del servidor (Python / PostgreSQL).
  const catalogo = [
    { id: 1, titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', disp: true },
    { id: 2, titulo: 'Frankenstein', autor: 'Mary Shelley', disp: true },
    { id: 3, titulo: 'Crimen y castigo', autor: 'Fiódor Dostoievski', disp: true },
    { id: 4, titulo: 'Platero y yo', autor: 'Juan Ramón Jiménez', disp: false },
    { id: 5, titulo: 'Drácula', autor: 'Bram Stoker', disp: true },
    { id: 6, titulo: 'La metamorfosis', autor: 'Franz Kafka', disp: true },
    { id: 7, titulo: 'Orgullo y prejuicio', autor: 'Jane Austen', disp: true },
    { id: 8, titulo: 'Cumbres borrascosas', autor: 'Emily Brontë', disp: true }
  ];
  const prestamos = [
    { id: 2, titulo: 'Frankenstein', autor: 'Mary Shelley', estado: 'prestado', limite: dia(5) },
    { id: 6, titulo: 'La metamorfosis', autor: 'Franz Kafka', estado: 'prestado', limite: dia(-4) },
    { id: 3, titulo: 'Crimen y castigo', autor: 'Fiódor Dostoievski', estado: 'devuelto', limite: dia(-20), entrega: dia(-23) },
    { id: 1, titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', estado: 'devuelto', limite: dia(-45), entrega: dia(-47) }
  ];

  const activos = () => prestamos.filter(p => p.estado !== 'devuelto');
  const retrasado = p => p.estado === 'prestado' && p.limite < hoy;

  const estadoDe = p => {
    if (p.estado === 'devuelto') return { txt: 'Entregado', cls: 'ok', det: `Entregado el ${fmt(p.entrega)}` };
    if (p.estado === 'solicitado') return { txt: 'Solicitado', cls: 'espera', det: 'Esperando respuesta de la biblioteca' };
    if (retrasado(p)) return { txt: `Retrasado ${dias(hoy, p.limite)} d`, cls: 'tarde', det: `Debía entregarse el ${fmt(p.limite)}` };
    return { txt: 'Prestado', cls: 'ok', det: `Devuelve el ${fmt(p.limite)}` };
  };

  const filaPrestamo = p => {
    const e = estadoDe(p);
    return `<div class="item${e.cls === 'tarde' ? ' es-tarde' : ''}">
      <div><b>${esc(p.titulo)}</b><small>${esc(p.autor)} · ${esc(e.det)}</small></div>
      <span class="estado ${e.cls}">${esc(e.txt)}</span></div>`;
  };


  // Verificación de sesión
  const verificarSesion = async () => {
    try {
      const respuesta = await fetch('/api/yo', {
        cache: 'no-store',
        credentials: 'same-origin'
      });

      if (respuesta.status === 401) {
        alert('Tu sesión ha finalizado. Inicia sesión nuevamente.');
        window.location.replace('/');
        return;
      }

      if (!respuesta.ok) {
        throw new Error('No se pudo verificar la sesión.');
      }

      const datos = await respuesta.json();
      const nombreEl = $('nombreUsuario');

      if (datos?.ok && datos.nombre && nombreEl) {
        nombreEl.textContent = datos.nombre;
      }
    } catch (error) {
      console.error('Error verificando la sesión:', error);
    }
  };

  verificarSesion();

  // Volver a verificar si el navegador restaura la página con Atrás.
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      verificarSesion();
    }
  });

  const tick = () => {
    const n = new Date();
    const h = n.getHours();
    $('saludoHora').textContent = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    $('hora').textContent = n.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    $('segundos').textContent = String(n.getSeconds()).padStart(2, '0');
    $('fecha').textContent = n.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  tick();
  setInterval(tick, 1000);

  const pintarProxima = () => {
    const el = $('proxima');
    const tarde = prestamos.filter(retrasado).length;
    const vigentes = prestamos.filter(p => p.estado === 'prestado' && !retrasado(p)).sort((a, b) => a.limite - b.limite);
    el.classList.toggle('alerta-txt', tarde > 0);
    if (tarde) { el.textContent = `Tienes ${tarde} ${tarde === 1 ? 'libro retrasado' : 'libros retrasados'}. Devuélvelo pronto.`; return; }
    if (!vigentes.length) { el.textContent = 'No tienes devoluciones pendientes.'; return; }
    const n = dias(vigentes[0].limite, hoy);
    el.textContent = `Próxima devolución: ${vigentes[0].titulo} · ${n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`}`;
  };

  // Calendario del mes, con las fechas de devolución marcadas
  let mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const pintarCalendario = () => {
    $('calTitulo').textContent = mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const marcas = {};
    activos().filter(p => p.limite).forEach(p => { marcas[clave(p.limite)] = p; });
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    let html = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(s => `<span class="cal-sem">${s}</span>`).join('');
    html += '<span></span>'.repeat((mes.getDay() + 6) % 7);
    for (let d = 1; d <= total; d++) {
      const f = new Date(mes.getFullYear(), mes.getMonth(), d);
      const p = marcas[clave(f)];
      const cls = ['cal-dia', clave(f) === clave(hoy) ? 'hoy' : '', p ? (p.limite < hoy ? 'vencida' : 'vence') : ''].join(' ');
      html += `<span class="${cls}"${p ? ` title="Devolver: ${esc(p.titulo)}"` : ''}>${d}</span>`;
    }
    $('calGrid').innerHTML = html;
  };
  $('calPrev').onclick = () => { mes = new Date(mes.getFullYear(), mes.getMonth() - 1, 1); pintarCalendario(); };
  $('calSig').onclick = () => { mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1); pintarCalendario(); };

  // Cupos de préstamo (máximo 3 por persona)
  const pintarCupos = () => {
    const usados = activos().length;
    $('cupos').innerHTML = Array.from({ length: MAX_PRESTAMOS }, (_, i) => `<span class="cupo${i < usados ? ' usado' : ''}"></span>`).join('');
    $('cuposTexto').textContent = `${usados} de ${MAX_PRESTAMOS} préstamos en uso`;
  };

  // Búsqueda por coincidencia de nombre o autor
  const pintarResultados = () => {
    const q = norm($('buscar').value.trim());
    const cont = $('resultados');
    if (!q) { cont.innerHTML = '<p class="vacio">Escribe el nombre de un libro o de un autor.</p>'; return; }
    const lista = catalogo.filter(l => norm(`${l.titulo} ${l.autor}`).includes(q)).slice(0, 5);
    if (!lista.length) { cont.innerHTML = '<p class="vacio">No encontramos coincidencias.</p>'; return; }
    const llenos = activos().length >= MAX_PRESTAMOS;
    cont.innerHTML = lista.map(l => {
      const yaLoTiene = activos().some(p => p.id === l.id);
      const motivo = yaLoTiene ? 'Ya lo tienes' : !l.disp ? 'No disponible' : llenos ? 'Sin cupos' : '';
      return `<div class="item"><div><b>${esc(l.titulo)}</b><small>${esc(l.autor)}</small></div>
        <button class="btn btn-aurora btn-mini" type="button" data-id="${l.id}"${motivo ? ' disabled' : ''}>${motivo || 'Solicitar'}</button></div>`;
    }).join('');
  };
  $('buscar').addEventListener('input', pintarResultados);
  $('resultados').addEventListener('click', e => {
    const b = e.target.closest('button[data-id]');
    if (!b || activos().length >= MAX_PRESTAMOS) return;
    const l = catalogo.find(x => x.id === Number(b.dataset.id));
    if (l) { prestamos.unshift({ id: l.id, titulo: l.titulo, autor: l.autor, estado: 'solicitado', limite: null }); pintarTodo(); }
  });

  // Pendientes e historial
  const pintarPendientes = () => {
    const a = activos();
    $('pendientesLista').innerHTML = a.length ? a.map(filaPrestamo).join('') : '<p class="vacio">No tienes libros pendientes.</p>';
  };
  const pintarHistorial = () => {
    const tarde = prestamos.filter(retrasado);
    const hist = [...tarde, ...prestamos.filter(p => p.estado === 'devuelto')];
    $('historialAlerta').innerHTML = tarde.length
      ? `<div class="alerta" role="alert">Tienes ${tarde.length} ${tarde.length === 1 ? 'libro retrasado' : 'libros retrasados'}. Devuélvelo lo antes posible.</div>` : '';
    $('historialLista').innerHTML = hist.length ? hist.map(filaPrestamo).join('') : '<p class="vacio">Aún no tienes historial.</p>';
  };

  function pintarTodo() {
    pintarCupos(); pintarResultados(); pintarPendientes(); pintarHistorial(); pintarProxima(); pintarCalendario();
  }
  pintarTodo();

  // Notas guardadas en el navegador (localStorage)
  const LLAVE = 'aurora_notas';
  let notas = [];
  try { notas = JSON.parse(localStorage.getItem(LLAVE)) || []; } catch { notas = []; }
  const guardarNotas = () => { try { localStorage.setItem(LLAVE, JSON.stringify(notas)); } catch { /* sin espacio o bloqueado */ } };

  const pintarNotas = () => {
    const ul = $('notasLista');
    ul.innerHTML = notas.length
      ? notas.map(n => `<li><span>${esc(n.texto)}</span><button class="nota-borrar" type="button" data-id="${n.id}" aria-label="Borrar nota">×</button></li>`).join('')
      : '<li class="vacio" style="background:none;border:0">Aún no tienes notas.</li>';
  };
  $('notaTexto').addEventListener('input', e => { $('notaCuenta').textContent = e.target.value.length; });
  $('notaGuardar').addEventListener('click', () => {
    const t = $('notaTexto').value.trim();
    if (!t) return;
    notas.unshift({ id: Date.now(), texto: t });
    guardarNotas(); pintarNotas();
    $('notaTexto').value = ''; $('notaCuenta').textContent = '0';
  });
  $('notasLista').addEventListener('click', e => {
    const b = e.target.closest('.nota-borrar');
    if (!b) return;
    notas = notas.filter(n => n.id !== Number(b.dataset.id));
    guardarNotas(); pintarNotas();
  });
  pintarNotas();
})();