const form = document.getElementById('formPqrs');
const nombre = document.getElementById('nombre');
const apellido = document.getElementById('apellido');
const correo = document.getElementById('correo');
const mensaje = document.getElementById('mensaje');
const cuenta = document.getElementById('cuenta');
const ayudaTipo = document.getElementById('ayudaTipo');
const btnEnviar = document.getElementById('btnEnviar');
const spin = document.getElementById('spin');

const tema = { background: '#111A4A', color: '#E9EDFF', confirmButtonColor: '#7C5CF2' };
const AYUDA_INICIAL = 'Elige la que mejor describe tu caso.';
const AYUDAS = {
  peticion: 'Petición: solicitas información o que se haga algo.',
  queja: 'Queja: no estás conforme con una persona o con el servicio.',
  reclamo: 'Reclamo: algo falló y esperas una solución.',
  sugerencia: 'Sugerencia: propones una mejora para la plataforma.'
};
const MIN_MENSAJE = 10;

// Ayuda según el tipo elegido
form.querySelectorAll('input[name="tipo"]').forEach(r => r.addEventListener('change', () => {
  ayudaTipo.textContent = AYUDAS[r.value] || AYUDA_INICIAL;
  marcar(null, 'errTipo', '');
}));

// Contador del mensaje
mensaje.addEventListener('input', () => {
  cuenta.textContent = mensaje.value.length;
  marcar(mensaje, 'errMensaje', '');
});

// Validación
const marcar = (campo, idError, texto) => {
  document.getElementById(idError).textContent = texto;
  if (campo) campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
};

const esNombre = v => /^\p{L}[\p{L}\s'’-]+$/u.test(v.trim());

const validar = () => {
  const tipo = form.querySelector('input[name="tipo"]:checked');
  const comprobaciones = [
    [nombre, 'errNombre', esNombre(nombre.value), 'Escribe tu nombre.'],
    [apellido, 'errApellido', esNombre(apellido.value), 'Escribe tu apellido.'],
    [correo, 'errCorreo', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim()), 'Escribe un correo válido.'],
    [null, 'errTipo', Boolean(tipo), 'Elige un tipo de solicitud.'],
    [mensaje, 'errMensaje', mensaje.value.trim().length >= MIN_MENSAJE, `Cuéntanos un poco más (mínimo ${MIN_MENSAJE} caracteres).`]
  ];

  let primerError = null;
  comprobaciones.forEach(([campo, idError, ok, texto]) => {
    marcar(campo, idError, ok ? '' : texto);
    if (!ok && !primerError) primerError = campo || form.querySelector('input[name="tipo"]');
  });
  if (primerError) primerError.focus();
  return !primerError;
};

[[nombre, 'errNombre'], [apellido, 'errApellido'], [correo, 'errCorreo']]
  .forEach(([campo, idError]) => campo.addEventListener('input', () => marcar(campo, idError, '')));

// Envío. Aquí se conectará el servidor en Python.
const enviarPqrs = datos => new Promise(resolve => setTimeout(() => resolve({ ok: true, datos }), 700));

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validar()) return;

  btnEnviar.disabled = true;
  spin.classList.remove('d-none');

  const datos = {
    nombre: nombre.value.trim(),
    apellido: apellido.value.trim(),
    correo: correo.value.trim(),
    tipo: form.querySelector('input[name="tipo"]:checked').value,
    mensaje: mensaje.value.trim()
  };

  try {
    await enviarPqrs(datos);
    Swal.fire({
      ...tema,
      icon: 'info',
      title: 'Maqueta lista',
      text: `El formulario enviaría tu ${datos.tipo} al servidor. Falta conectarlo.`
    });
  } catch {
    Swal.fire({ ...tema, icon: 'error', title: 'No se pudo enviar', text: 'Inténtalo de nuevo en un momento.' });
  } finally {
    btnEnviar.disabled = false;
    spin.classList.add('d-none');
  }
});