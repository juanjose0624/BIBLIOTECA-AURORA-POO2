const form = document.getElementById('formRegistro');
const nombre = document.getElementById('nombre');
const apellido = document.getElementById('apellido');
const celular = document.getElementById('celular');
const correo = document.getElementById('correo');
const clave = document.getElementById('clave');
const fuerza = document.getElementById('fuerza');
const textoFuerza = document.getElementById('textoFuerza');
const btnEnviar = document.getElementById('btnEnviar');
const spin = document.getElementById('spin');

const tema = { background: '#111A4A', color: '#E9EDFF', confirmButtonColor: '#7C5CF2' };
const AYUDA_CLAVE = 'Usa 8 caracteres o más, con letras y números.';

// Mostrar u ocultar la contraseña
const verClave = document.getElementById('verClave');
verClave.addEventListener('click', () => {
  const visible = clave.type === 'text';
  clave.type = visible ? 'password' : 'text';
  verClave.setAttribute('aria-pressed', String(!visible));
  verClave.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
});

// Celular: solo dígitos, con formato 300 123 4567
celular.addEventListener('input', () => {
  const d = celular.value.replace(/\D/g, '').slice(0, 10);
  celular.value = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(' ');
});

// Contraseña: mínimo 8 caracteres con letra y número; el medidor premia largo, mayúsculas y símbolos
const evaluarClave = v => {
  const largo = v.length >= 8;
  const letra = /\p{L}/u.test(v);
  const numero = /\d/.test(v);
  const minimo = largo && letra && numero;
  const extras = [
    v.length >= 12,
    /\p{Ll}/u.test(v) && /\p{Lu}/u.test(v),
    /[^\p{L}\d\s]/u.test(v)
  ].filter(Boolean).length;
  const nivel = !v ? 0 : !minimo ? 1 : extras >= 2 ? 3 : 2;
  const faltan = [!largo && '8 caracteres', !letra && 'una letra', !numero && 'un número'].filter(Boolean);
  return { minimo, nivel, faltan };
};

const pintarFuerza = () => {
  const { nivel, faltan } = evaluarClave(clave.value);
  fuerza.dataset.nivel = nivel;
  const etiquetas = ['', 'Débil', 'Aceptable', 'Buena'];
  textoFuerza.textContent = nivel === 0
    ? AYUDA_CLAVE
    : nivel === 1
      ? `${etiquetas[1]} · te falta: ${faltan.join(', ')}`
      : etiquetas[nivel];
};
clave.addEventListener('input', pintarFuerza);

// Validación
const marcar = (campo, idError, mensaje) => {
  document.getElementById(idError).textContent = mensaje;
  if (campo) campo.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
};

const esNombre = v => /^\p{L}[\p{L}\s'’-]+$/u.test(v.trim());

const validar = () => {
  const digitos = celular.value.replace(/\D/g, '');
  const sexo = form.querySelector('input[name="sexo"]:checked');

  const comprobaciones = [
    [nombre, 'errNombre', esNombre(nombre.value), 'Escribe tu nombre.'],
    [apellido, 'errApellido', esNombre(apellido.value), 'Escribe tu apellido.'],
    [celular, 'errCelular', /^3\d{9}$/.test(digitos), 'Escribe un celular de 10 dígitos que empiece por 3.'],
    [correo, 'errCorreo', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim()), 'Escribe un correo válido.'],
    [clave, 'errClave', evaluarClave(clave.value).minimo, 'La contraseña necesita 8 caracteres o más, con letras y números.'],
    [null, 'errSexo', Boolean(sexo), 'Elige una opción.']
  ];

  let primerError = null;
  comprobaciones.forEach(([campo, idError, ok, mensaje]) => {
    marcar(campo, idError, ok ? '' : mensaje);
    if (!ok && !primerError) primerError = campo || form.querySelector('input[name="sexo"]');
  });
  if (primerError) primerError.focus();
  return !primerError;
};

// Limpia el error de cada campo al corregirlo
[[nombre, 'errNombre'], [apellido, 'errApellido'], [celular, 'errCelular'], [correo, 'errCorreo'], [clave, 'errClave']]
  .forEach(([campo, idError]) => campo.addEventListener('input', () => marcar(campo, idError, '')));
form.querySelectorAll('input[name="sexo"]').forEach(r => r.addEventListener('change', () => marcar(null, 'errSexo', '')));

// Envío al servidor (Flask): POST /api/registro
// No se envía el rol: el servidor asigna siempre el rol "usuario" a los registros nuevos.
const registrarUsuario = async datos => {
  const respuesta = await fetch('/api/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, ...cuerpo };
};

// Campo del formulario que corresponde a cada error que devuelve el servidor
const CAMPOS_ERROR = {
  nombre: [nombre, 'errNombre'],
  apellido: [apellido, 'errApellido'],
  celular: [celular, 'errCelular'],
  correo: [correo, 'errCorreo'],
  clave: [clave, 'errClave'],
  sexo: [null, 'errSexo']
};

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validar()) return;

  btnEnviar.disabled = true;
  spin.classList.remove('d-none');

  const datos = {
    nombre: nombre.value.trim(),
    apellido: apellido.value.trim(),
    celular: celular.value.replace(/\D/g, ''),
    correo: correo.value.trim(),
    clave: clave.value,
    sexo: form.querySelector('input[name="sexo"]:checked').value
  };

  try {
    const r = await registrarUsuario(datos);

    if (r.ok) {
      await Swal.fire({ ...tema, icon: 'success', title: '¡Cuenta creada!', text: 'Ya puedes ingresar con tu correo y contraseña.' });
      window.location.href = 'login.html';
      return;
    }

    if (r.errores) {
      // Muestra cada error en su campo (por ejemplo, "Este correo ya está registrado.")
      Object.entries(r.errores).forEach(([campo, mensaje]) => {
        const [input, idError] = CAMPOS_ERROR[campo] || [];
        if (idError) marcar(input, idError, mensaje);
      });
      const primero = Object.keys(r.errores).map(c => CAMPOS_ERROR[c]).find(Boolean);
      if (primero && primero[0]) primero[0].focus();
      return;
    }

    Swal.fire({ ...tema, icon: 'error', title: 'No se pudo crear la cuenta', text: r.mensaje || 'Inténtalo de nuevo en un momento.' });
  } catch {
    Swal.fire({ ...tema, icon: 'error', title: 'No hay conexión con el servidor', text: 'Revisa que el backend esté encendido e inténtalo de nuevo.' });
  } finally {
    btnEnviar.disabled = false;
    spin.classList.add('d-none');
  }
});