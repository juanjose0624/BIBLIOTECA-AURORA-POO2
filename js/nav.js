// Comportamiento común de las páginas dentro de html/ (navbar, año del pie)

// Navbar: se vuelve translúcida al hacer scroll
const nav = document.querySelector('.nav-aurora');
if (nav) {
  const alScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  alScroll();
  window.addEventListener('scroll', alScroll, { passive: true });
}

// Cierra el menú móvil al elegir un enlace
document.querySelectorAll('.nav-link').forEach(enlace => {
  enlace.addEventListener('click', () => {
    const menu = document.getElementById('menu');
    if (menu && menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
  });
});

const anio = document.getElementById('anio');
if (anio) anio.textContent = new Date().getFullYear();