(() => {
  const $ = id => document.getElementById(id);
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

  // Modo claro / oscuro (el tema inicial lo pone un script corto en el <head>)
  const raiz = document.documentElement;
  const etiquetarTema = () => $('btnTema').setAttribute('aria-label', raiz.dataset.tema === 'claro' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
  $('btnTema').addEventListener('click', () => {
    raiz.dataset.tema = raiz.dataset.tema === 'claro' ? 'oscuro' : 'claro';
    try { localStorage.setItem('aurora_tema', raiz.dataset.tema); } catch { /* almacenamiento bloqueado */ }
    etiquetarTema();
  });
  etiquetarTema();

  // Frase del autor del día: 5 predeterminadas, una por día de forma rotativa
  const frases = [
    { texto: 'El que lee mucho y anda mucho, ve mucho y sabe mucho.', autor: 'Miguel de Cervantes', obra: 'Don Quijote de la Mancha' },
    { texto: 'De los diversos instrumentos del hombre, el más asombroso es, sin duda, el libro.', autor: 'Jorge Luis Borges', obra: 'El libro' },
    { texto: 'Lo esencial es invisible a los ojos.', autor: 'Antoine de Saint-Exupéry', obra: 'El principito' },
    { texto: 'Leer es soñar de la mano de otro.', autor: 'Fernando Pessoa', obra: 'Libro del desasosiego' },
    { texto: 'Yo no estudio para saber más, sino para ignorar menos.', autor: 'Sor Juana Inés de la Cruz', obra: 'Respuesta a Sor Filotea' }
  ];
  const diaDelAnio = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 0)) / 86400000);
  const frase = frases[diaDelAnio % frases.length];
  $('fraseTexto').textContent = frase.texto;
  $('fraseAutor').textContent = `${frase.autor} · ${frase.obra}`;

  // Saludo con el nombre (viene de /api/yo)

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

  // Reloj digital
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

  // Dato inteligente: semana del año y días que faltan para terminar el mes
  const restan = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() - hoy.getDate();
  $('proxima').textContent = `Semana ${Math.ceil(diaDelAnio / 7)} del año · ` +
    (restan === 0 ? 'hoy termina el mes' : `${restan} ${restan === 1 ? 'día' : 'días'} para terminar el mes`);

  // Calendario del mes
  let mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const pintarCalendario = () => {
    $('calTitulo').textContent = mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    let html = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(s => `<span class="cal-sem">${s}</span>`).join('');
    html += '<span></span>'.repeat((mes.getDay() + 6) % 7);
    for (let d = 1; d <= total; d++) {
      const esHoy = mes.getFullYear() === hoy.getFullYear() && mes.getMonth() === hoy.getMonth() && d === hoy.getDate();
      html += `<span class="cal-dia${esHoy ? ' hoy' : ''}">${d}</span>`;
    }
    $('calGrid').innerHTML = html;
  };
  $('calPrev').addEventListener('click', () => { mes = new Date(mes.getFullYear(), mes.getMonth() - 1, 1); pintarCalendario(); });
  $('calSig').addEventListener('click', () => { mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1); pintarCalendario(); });
  pintarCalendario();

  // Notas guardadas en el navegador (localStorage)
  const LLAVE = 'aurora_notas_admin';
  let notas = [];
  try { notas = JSON.parse(localStorage.getItem(LLAVE)) || []; } catch { notas = []; }
  const guardarNotas = () => { try { localStorage.setItem(LLAVE, JSON.stringify(notas)); } catch { /* sin espacio o bloqueado */ } };

  const pintarNotas = () => {
    $('notasLista').innerHTML = notas.length
      ? notas.map(n => `<li><span>${esc(n.texto)}</span><button class="nota-borrar" type="button" data-id="${n.id}" aria-label="Borrar nota">×</button></li>`).join('')
      : '<li class="vacio">Aún no tienes notas.</li>';
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