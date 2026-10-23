const form = document.getElementById('formPqrs');
const nombre = document.getElementById('nombre');
const apellido = document.getElementById('apellido');
const correo = document.getElementById('correo');
const mensaje = document.getElementById('mensaje');
const cuenta = document.getElementById('cuenta');
const ayudaTipo = document.getElementById('ayudaTipo');
const btnEnviar = document.getElementById('btnEnviar');
const spin = document.getElementById('spin');

const tema = {
  background: '#111A4A',
  color: '#E9EDFF',
  confirmButtonColor: '#7C5CF2'
};

const AYUDA_INICIAL = 'Elige la que mejor describe tu caso.';

const AYUDAS = {
  peticion: 'Petición: solicitas información o que se haga algo.',
  queja: 'Queja: no estás conforme con una persona o con el servicio.',
  reclamo: 'Reclamo: algo falló y esperas una solución.',
  sugerencia: 'Sugerencia: propones una mejora para la plataforma.'
};

const MIN_MENSAJE = 10;

// Año actual del footer
document.getElementById('anio').textContent = new Date().getFullYear();

// Mostrar errores de validación
const marcar = (campo, idError, texto) => {
  document.getElementById(idError).textContent = texto;

  if (campo) {
    campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
  }
};

// Ayuda según el tipo elegido
form.querySelectorAll('input[name="tipo"]').forEach(radio => {
  radio.addEventListener('change', () => {
    ayudaTipo.textContent = AYUDAS[radio.value] || AYUDA_INICIAL;
    marcar(null, 'errTipo', '');
  });
});

// Contador del mensaje
mensaje.addEventListener('input', () => {
  cuenta.textContent = mensaje.value.length;
  marcar(mensaje, 'errMensaje', '');
});

// Validar nombres y apellidos
const esNombre = valor =>
  /^\p{L}[\p{L}\s'’-]*$/u.test(valor.trim()) &&
  valor.trim().length >= 2;

// Validar formulario
const validar = () => {
  const tipo = form.querySelector('input[name="tipo"]:checked');

  const comprobaciones = [
    [
      nombre,
      'errNombre',
      esNombre(nombre.value),
      'Escribe un nombre válido de al menos 2 caracteres.'
    ],
    [
      apellido,
      'errApellido',
      esNombre(apellido.value),
      'Escribe un apellido válido de al menos 2 caracteres.'
    ],
    [
      correo,
      'errCorreo',
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value.trim()),
      'Escribe un correo válido.'
    ],
    [
      null,
      'errTipo',
      Boolean(tipo),
      'Elige un tipo de solicitud.'
    ],
    [
      mensaje,
      'errMensaje',
      mensaje.value.trim().length >= MIN_MENSAJE,
      `Cuéntanos un poco más (mínimo ${MIN_MENSAJE} caracteres).`
    ]
  ];

  let primerError = null;

  comprobaciones.forEach(([campo, idError, correcto, texto]) => {
    marcar(campo, idError, correcto ? '' : texto);

    if (!correcto && !primerError) {
      primerError = campo || form.querySelector('input[name="tipo"]');
    }
  });

  if (primerError) {
    primerError.focus();
  }

  return !primerError;
};

// Limpiar errores al escribir
[[nombre, 'errNombre'], [apellido, 'errApellido'], [correo, 'errCorreo']]
  .forEach(([campo, idError]) => {
    campo.addEventListener('input', () => {
      marcar(campo, idError, '');
    });
  });

// Enviar PQRS al backend Python
const enviarPqrs = async datos => {
  const respuesta = await fetch('/api/pqrs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(datos)
  });

  const resultado = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      resultado.mensaje || 'No se pudo registrar la solicitud.'
    );
  }

  return resultado;
};

// Evento de envío
form.addEventListener('submit', async evento => {
  evento.preventDefault();

  if (!validar()) {
    return;
  }

  btnEnviar.disabled = true;
  spin.classList.remove('d-none');

  const datos = {
    nombre: nombre.value.trim(),
    apellido: apellido.value.trim(),
    correo: correo.value.trim().toLowerCase(),
    tipo: form.querySelector('input[name="tipo"]:checked').value,
    mensaje: mensaje.value.trim()
  };

  try {
    const resultado = await enviarPqrs(datos);

    await Swal.fire({
      ...tema,
      icon: 'success',
      title: '¡Solicitud recibida!',
      text: resultado.mensaje || 'Tu solicitud se registró correctamente.'
    });

    form.reset();
    cuenta.textContent = '0';
    ayudaTipo.textContent = AYUDA_INICIAL;

    form.querySelectorAll('[aria-invalid]').forEach(campo => {
      campo.removeAttribute('aria-invalid');
    });

    form.querySelectorAll('.error').forEach(error => {
      error.textContent = '';
    });

  } catch (error) {
    Swal.fire({
      ...tema,
      icon: 'error',
      title: 'No se pudo enviar',
      text: error.message || 'Inténtalo de nuevo en un momento.'
    });

  } finally {
    btnEnviar.disabled = false;
    spin.classList.add('d-none');
  }
});