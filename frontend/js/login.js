const card = document.getElementById('loginCard');
const form = document.getElementById('formLogin');
const correo = document.getElementById('correo');
const clave = document.getElementById('clave');
const btnEnviar = document.getElementById('btnEnviar');
const spin = document.getElementById('spin');

const tema = { background: '#111A4A', color: '#E9EDFF', confirmButtonColor: '#7C5CF2' };
const rolActual = () => document.querySelector('input[name="rol"]:checked').value;

// Rol: se puede abrir ya en modo administrador con login.html?rol=admin
if (new URLSearchParams(location.search).get('rol') === 'admin') {
  document.getElementById('rolAdmin').checked = true;
}

const aplicarRol = () => {
  const rol = rolActual();
  card.dataset.rol = rol;
  document.title = (rol === 'admin' ? 'Acceso administrador' : 'Ingresar') + ' · Aurora Libris';
};
document.querySelectorAll('input[name="rol"]').forEach(r => r.addEventListener('change', aplicarRol));
aplicarRol();

// Mostrar u ocultar la contraseña
const verClave = document.getElementById('verClave');
verClave.addEventListener('click', () => {
  const visible = clave.type === 'text';
  clave.type = visible ? 'password' : 'text';
  verClave.setAttribute('aria-pressed', String(!visible));
  verClave.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
});

// Recuperar contraseña (aún sin servidor)
document.getElementById('olvide').addEventListener('click', e => {
  e.preventDefault();
  Swal.fire({ ...tema, icon: 'info', title: 'Recuperar contraseña', text: 'Esta opción se conectará cuando esté listo el servidor.' });
});

// Validación
const marcar = (campo, idError, mensaje) => {
  document.getElementById(idError).textContent = mensaje;
  campo.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
};

const validar = () => {
  const okCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim());
  const okClave = clave.value.length > 0;
  marcar(correo, 'errCorreo', okCorreo ? '' : 'Escribe un correo válido.');
  marcar(clave, 'errClave', okClave ? '' : 'Escribe tu contraseña.');
  if (!okCorreo) correo.focus();
  else if (!okClave) clave.focus();
  return okCorreo && okClave;
};

[correo, clave].forEach(c => c.addEventListener('input', () => marcar(c, c === correo ? 'errCorreo' : 'errClave', '')));

// Envío al servidor (Flask): POST /api/login
// El interruptor solo dice qué acceso se pide; el servidor comprueba el rol real de la cuenta.
// Adónde va cada rol después de ingresar. Cuando existan los dashboards solo se cambian estas rutas.
const DESTINOS = {
  usuario: '../dashboards/usuario.html',
  administrador: '../dashboards/administrador.html'
};

const iniciarSesion = async datos => {
  const respuesta = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, estado: respuesta.status, ...cuerpo };
};

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validar()) return;

  btnEnviar.disabled = true;
  spin.classList.remove('d-none');

  const datos = {
    correo: correo.value.trim(),
    clave: clave.value,
    rol: rolActual(),
    recordar: document.getElementById('recordar').checked
  };

  try {
    const r = await iniciarSesion(datos);
    if (r.ok) {
      await Swal.fire({ ...tema, icon: 'success', title: '¡Bienvenido!', text: `Hola, ${r.nombre}.`, timer: 1400, showConfirmButton: false });
      window.location.href = DESTINOS[r.rol] || '../index.html';
      return;
    }

    if (r.estado === 401) {
      // Correo o contraseña incorrectos
      marcar(clave, 'errClave', r.mensaje);
      clave.focus();
    } else {
      // 403 (acceso que no corresponde a la cuenta), 400 u otros errores
      Swal.fire({ ...tema, icon: r.estado === 403 ? 'warning' : 'error', title: 'No se pudo ingresar', text: r.mensaje || 'Inténtalo de nuevo en un momento.' });
    }
  } catch {
    Swal.fire({ ...tema, icon: 'error', title: 'No hay conexión con el servidor', text: 'Revisa que el backend esté encendido e inténtalo de nuevo.' });
  } finally {
    btnEnviar.disabled = false;
    spin.classList.add('d-none');
  }
});