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

/* Cierre de sesión */
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

if (btnCerrarSesion) {
  btnCerrarSesion.addEventListener('click', async () => {
    btnCerrarSesion.disabled = true;

    try {
      const respuesta = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!respuesta.ok) {
        throw new Error('No se pudo cerrar la sesión.');
      }

      window.location.replace('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('No se pudo cerrar la sesión. Inténtalo de nuevo.');
      btnCerrarSesion.disabled = false;
    }
  });
}
