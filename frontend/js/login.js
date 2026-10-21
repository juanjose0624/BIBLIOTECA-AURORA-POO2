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

// Envío. Aquí se conectará el servidor en Python:
// el servidor debe comprobar el rol real del usuario en la tabla y no confiar en el interruptor.
const iniciarSesion = datos => new Promise(resolve => setTimeout(() => resolve({ ok: true, datos }), 700));

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
    await iniciarSesion(datos);
    Swal.fire({
      ...tema,
      icon: 'info',
      title: 'Maqueta lista',
      text: `El formulario enviaría correo, contraseña y rol (${datos.rol}). Falta conectar el servidor.`
    });
  } catch {
    Swal.fire({ ...tema, icon: 'error', title: 'No se pudo ingresar', text: 'Revisa tus datos e inténtalo de nuevo.' });
  } finally {
    btnEnviar.disabled = false;
    spin.classList.add('d-none');
  }
});