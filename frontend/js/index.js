// Navbar: se vuelve translúcida al hacer scroll
const nav = document.querySelector('.nav-aurora');
const alScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
alScroll();
window.addEventListener('scroll', alScroll, { passive: true });
 
// Cierra el menú móvil al elegir un enlace
document.querySelectorAll('.nav-link').forEach(enlace => {
  enlace.addEventListener('click', () => {
    const menu = document.getElementById('menu');
    if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
  });
});
 
// Carrusel de tecnologías (la lista se dibuja dos veces para que el bucle no tenga saltos)
const icono = nombre => `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/${nombre}/${nombre}-original.svg`;
const swalIcono = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="12" stroke="#C9BEFF" stroke-width="2.4"/><path d="M10.5 16.5l4 4 7-8" stroke="#C9BEFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 
const tecnologias = [
  { nombre: 'HTML5', img: icono('html5') },
  { nombre: 'CSS3', img: icono('css3') },
  { nombre: 'JavaScript', img: icono('javascript') },
  { nombre: 'Python', img: icono('python') },
  { nombre: 'PostgreSQL', img: icono('postgresql') },
  { nombre: 'Bootstrap', img: icono('bootstrap') },
  { nombre: 'SweetAlert2', svg: swalIcono }
];
 
const tecItem = (t, oculto) => `
  <div class="tec"${oculto ? ' aria-hidden="true"' : ''}>
    ${t.img ? `<img src="${t.img}" alt="" width="26" height="26" loading="lazy">` : t.svg}
    <span>${t.nombre}</span>
  </div>`;
 
const pista = document.getElementById('tecPista');

const dibujarCarrusel = () => {
  // Cada grupo repite la lista las veces necesarias para cubrir el ancho de la pantalla
  pista.innerHTML = tecnologias.map(t => tecItem(t, false)).join('');
  const copias = Math.max(1, Math.ceil(window.innerWidth / pista.scrollWidth));
  const grupo = g => Array.from({ length: copias }, (_, c) =>
    tecnologias.map(t => tecItem(t, g > 0 || c > 0)).join('')).join('');

  // Dos grupos idénticos: el CSS desplaza -50% y el bucle no tiene saltos
  pista.innerHTML = grupo(0) + grupo(1);
};

dibujarCarrusel();
document.fonts.ready.then(dibujarCarrusel);

let temporizador;
window.addEventListener('resize', () => {
  clearTimeout(temporizador);
  temporizador = setTimeout(dibujarCarrusel, 200);
});
 
// Muestra del catálogo (luego vendrá de la API en Python/PostgreSQL)
const libros = [
  {
    titulo: 'Don Quijote de la Mancha',
    autor: 'Miguel de Cervantes',
    puntos: 120,
    portada: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRF-cBPbxkuMMS9JV9JyeRLXqbXyH_m0kZtodrGMX8xmSXfYMPWu1yHoSo&s=10', 
    fondo: 'linear-gradient(160deg,#3445B4,#8FD3FF)' 
  },
  {
    titulo: 'Frankenstein',
    autor: 'Mary Shelley',
    puntos: 60,
    portada: 'https://images.cdn2.buscalibre.com/fit-in/660x660/0b/34/0b34f7c5e7987f434818bd8a5de54084.jpg',
    fondo: 'linear-gradient(160deg,#2A2F8F,#7C5CF2)'
  },
  {
    titulo: 'Crimen y castigo',
    autor: 'Fiódor Dostoievski',
    puntos: 100,
    portada: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlGPJHau2fY6QqVFnbmRLL_aXf08z-7RO2GBCzq9NlZSpwN1h9LamPV5k8&s=10',
    fondo: 'linear-gradient(160deg,#7C5CF2,#C9BEFF)'
  },
  {
    titulo: 'Platero y yo',
    autor: 'Juan Ramón Jiménez',
    puntos: 40,
    portada: 'https://imagessl7.casadellibro.com/a/l/t5/57/9788426146557.jpg',
    fondo: 'linear-gradient(160deg,#1E3A8A,#6EC8F5)'
  }
];

const dibujarPortada = l => l.portada
  ? `<div class="portada-img"><img src="${l.portada}" alt="Portada de ${l.titulo}" loading="lazy"></div>`
  : `<div class="portada" style="--fondo:${l.fondo}"><strong>${l.titulo}</strong><small>${l.autor}</small></div>`;

document.getElementById('catalogoGrid').innerHTML = libros.map(l => `
  <div class="col-6 col-lg-3">
    <a class="libro" href="html/catalogo.html" aria-label="${l.titulo}, ${l.autor}">
      ${dibujarPortada(l)}
      <div class="libro-datos">
        <strong class="libro-titulo">${l.titulo}</strong>
        <span>${l.autor}</span>
        <span class="puntos">+${l.puntos} puntos al leerlo</span>
      </div>
    </a>
  </div>`).join('');

document.getElementById('anio').textContent = new Date().getFullYear();

// Botón para volver arriba
const btnArriba = document.getElementById('btnArriba');
const mostrarArriba = () => btnArriba.classList.toggle('visible', window.scrollY > 500);
mostrarArriba();
window.addEventListener('scroll', mostrarArriba, { passive: true });
btnArriba.addEventListener('click', () => {
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: sinMovimiento ? 'auto' : 'smooth' });
});
// Demostración del asistente: los mensajes aparecen al llegar a la sección
const demo = document.querySelector('.demo');
if (demo) {
  demo.querySelectorAll('.msg').forEach((m, i) => m.style.setProperty('--i', i));
  new IntersectionObserver((entradas, obs) => {
    if (entradas[0].isIntersecting) {
      demo.classList.add('en-vista');
      obs.disconnect();
    }
  }, { threshold: 0.35 }).observe(demo);
}
  
// Escena del hero: paralaje suave con el mouse; quieta si se pidió reducir movimiento
const escena = document.querySelector('.escena');
if (escena) {
  const capas = escena.querySelectorAll('.capa');
  const hero = document.getElementById('inicio');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    escena.querySelector('svg').pauseAnimations();
  } else if (window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      capas.forEach(c => { const p = Number(c.dataset.prof); c.style.transform = `translate(${x * p}px, ${y * p}px)`; });
    });
    hero.addEventListener('mouseleave', () => capas.forEach(c => { c.style.transform = ''; }));
  }
}
 
// Sección de puntos: el scroll lleva el contador de 0 a 50 y va sacando 10 medallas pequeñas
const secPuntos = document.getElementById('puntos');
if (secPuntos) {
  const escenaP = secPuntos.querySelector('.escena-puntos');
  const svgP = escenaP.querySelector('svg');
  const num = document.getElementById('ptNum');
  const aro = secPuntos.querySelector('.aro-progreso');
  const halo = secPuntos.querySelector('.halo-puntos');
  const lomo = secPuntos.querySelector('.lomo-brillo');
  const contenedor = document.getElementById('ptMinis');
  const CIRC = 2 * Math.PI * 88;
  const TOTAL = 10;
  const acota = v => Math.min(1, Math.max(0, v));
 
  // 10 medallas pequeñas repartidas en un arco alrededor de la medalla grande
  contenedor.innerHTML = Array.from({ length: TOTAL }, (_, i) => `
    <g class="mini">
      <circle r="17" fill="url(#pt-m${i % 2 + 1})" stroke="#E9EDFF" stroke-opacity=".55" stroke-width="1.2"/>
      <circle r="12" fill="#0B1236" fill-opacity=".45"/>
      <use href="#pt-estrella" fill="#E9EDFF"/>
    </g>`).join('');
  const minis = [...contenedor.querySelectorAll('.mini')].map((el, i) => {
    const ang = Math.PI + (i + 0.5) * Math.PI / TOTAL;
    return { el, tx: 175 * Math.cos(ang), ty: 125 * Math.sin(ang) };
  });
 
  const escritorio = window.matchMedia('(min-width: 992px)');
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
 
  const progreso = () => {
    const vh = window.innerHeight;
    if (escritorio.matches && !quieto.matches) {
      const r = secPuntos.getBoundingClientRect();
      return acota(-r.top / ((r.height - vh) * 0.85));
    }
    const r = escenaP.getBoundingClientRect();
    return acota((vh * 0.85 - r.top) / (vh * 0.6));
  };
 
  const pintar = p => {
    num.textContent = Math.round(p * 100);
    aro.style.strokeDasharray = CIRC;
    aro.style.strokeDashoffset = CIRC * (1 - p);
    halo.style.opacity = 0.35 + 0.65 * p;
    lomo.style.opacity = 0.25 + 0.75 * p;
    minis.forEach((m, i) => {
      const q = acota(p * TOTAL - i);
      const e = 1 - Math.pow(1 - q, 3);
      m.el.style.transform = `translate(${m.tx * e}px, ${m.ty * e}px) scale(${e})`;
      m.el.style.opacity = Math.min(1, q * 4);
    });
    svgP.classList.toggle('completo', p >= 0.995);
  };
 
  let pendiente = false;
  const alMover = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; pintar(progreso()); });
  };
  window.addEventListener('scroll', alMover, { passive: true });
  window.addEventListener('resize', alMover);
  pintar(quieto.matches ? 1 : progreso());
}