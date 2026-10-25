/* ============================================================
   CONFIGURACIÓN
   ============================================================ */
const CONFIG = {
  API_LIBROS: '/api/libros',   // endpoint de Flask que devuelve la lista de libros en JSON
  URL_VOLVER: '/dashboards/usuario.html',
  ALTURA_OJOS: 1.65,
  ANTIALIAS: true,             // si ves lento, ponlo en false
  ESCALA_HW: 1                 // 1 = nítido, 1.25 o 1.5 = más fluido en GPU integrada
};
 
/* Medidas de la galería (en metros) */
const LIBRO = { ancho: 0.70, alto: 1.05, grosor: 0.06 };  // proporción 2:3, como una portada real
const SEPARACION = 1.1;        // distancia entre centros de portadas (deja aire entre libros)
const Z_FILA = 2.4;            // distancia de cada fila al centro del pasillo
const ALTO_BASE = 0.55;        // altura del pedestal donde se apoyan los libros
const PASO_NIVEL = 1.55;       // distancia entre niveles si hay muchos libros
const MAX_POR_NIVEL = 30;      // si un lado supera esto, se agrega otro nivel
 
/* Libros de prueba: se usan solo si /api/libros falla o viene vacío */
const LIBROS_DEMO = [
  { id: 1, titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', categoria: 'Novela', descripcion: 'La saga de la familia Buendía en Macondo.', disponible: true },
  { id: 2, titulo: 'El coronel no tiene quien le escriba', autor: 'Gabriel García Márquez', categoria: 'Novela', descripcion: 'Un excoronel espera una carta que nunca llega.', disponible: false },
  { id: 3, titulo: 'Rayuela', autor: 'Julio Cortázar', categoria: 'Novela', descripcion: 'Una novela que se puede leer en más de un orden.', disponible: true },
  { id: 4, titulo: 'Clean Code', autor: 'Robert C. Martin', categoria: 'Tecnología', descripcion: 'Buenas prácticas para escribir código legible.', disponible: true },
  { id: 5, titulo: 'Patrones de diseño', autor: 'Erich Gamma et al.', categoria: 'Tecnología', descripcion: 'Soluciones reutilizables para problemas comunes de POO.', disponible: true },
  { id: 6, titulo: 'Compiladores: principios y técnicas', autor: 'Alfred Aho', categoria: 'Tecnología', descripcion: 'El clásico libro del dragón.', disponible: false },
  { id: 7, titulo: 'Breve historia del tiempo', autor: 'Stephen Hawking', categoria: 'Ciencia', descripcion: 'Del big bang a los agujeros negros.', disponible: true },
  { id: 8, titulo: 'Cosmos', autor: 'Carl Sagan', categoria: 'Ciencia', descripcion: 'Un viaje por el universo y por la historia de la ciencia.', disponible: true },
  { id: 9, titulo: 'El gen egoísta', autor: 'Richard Dawkins', categoria: 'Ciencia', descripcion: 'La evolución vista desde los genes.', disponible: true },
  { id: 10, titulo: 'Sapiens', autor: 'Yuval Noah Harari', categoria: 'Historia', descripcion: 'Una breve historia de la humanidad.', disponible: true },
  { id: 11, titulo: 'Las venas abiertas de América Latina', autor: 'Eduardo Galeano', categoria: 'Historia', descripcion: 'Cinco siglos de saqueo de un continente.', disponible: false },
  { id: 12, titulo: 'El señor de los anillos', autor: 'J. R. R. Tolkien', categoria: 'Fantasía', descripcion: 'La Comunidad del Anillo parte hacia Mordor.', disponible: true },
  { id: 13, titulo: 'El nombre del viento', autor: 'Patrick Rothfuss', categoria: 'Fantasía', descripcion: 'La historia de Kvothe contada por él mismo.', disponible: true },
  { id: 14, titulo: 'Dune', autor: 'Frank Herbert', categoria: 'Fantasía', descripcion: 'Intriga política y supervivencia en el planeta desértico Arrakis.', disponible: true },
  { id: 15, titulo: 'Veinte poemas de amor', autor: 'Pablo Neruda', categoria: 'Poesía', descripcion: 'Poemas de amor y una canción desesperada.', disponible: true },
  { id: 16, titulo: 'Rimas y leyendas', autor: 'Gustavo Adolfo Bécquer', categoria: 'Poesía', descripcion: 'Clásico del posromanticismo español.', disponible: true },
  { id: 17, titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', categoria: 'Clásicos', descripcion: 'Un cuento sobre la amistad y lo esencial.', disponible: true },
  { id: 18, titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', categoria: 'Clásicos', descripcion: 'Las aventuras del ingenioso hidalgo.', disponible: true },
  { id: 19, titulo: 'Pedro Páramo', autor: 'Juan Rulfo', categoria: 'Clásicos', descripcion: 'Un viaje a Comala, el pueblo de los muertos.', disponible: true },
  { id: 20, titulo: 'La metamorfosis', autor: 'Franz Kafka', categoria: 'Clásicos', descripcion: 'Gregor Samsa despierta convertido en insecto.', disponible: false }
];
 
/* Paleta de aurora para las categorías */
const PALETA = ['#6ea8ff', '#8b7bff', '#c4a7ff', '#5ee0d0', '#4f7cff', '#b57bff', '#7fd1ff', '#9aa8ff'];
 
/* ============================================================
   UTILIDADES
   ============================================================ */
const $ = id => document.getElementById(id);
const esLibro = m => !!(m && m.metadata && m.metadata.libro);
 
function normalizar(l, i) {
  // Acepta distintos nombres de campo para que funcione con tu tabla tal cual
  const disp = l.disponible ?? l.available ?? ((l.cantidad ?? l.stock ?? 1) > 0);
  return {
    id: l.id ?? i,
    titulo: l.titulo ?? l.title ?? 'Sin título',
    autor: l.autor ?? l.author ?? 'Autor desconocido',
    categoria: l.categoria ?? l.genero ?? l.category ?? 'General',
    descripcion: l.descripcion ?? l.sinopsis ?? l.description ?? 'Este libro aún no tiene descripción.',
    disponible: disp === true || disp === 1 || disp === 'true' || disp === 't'
  };
}
 
async function cargarLibros() {
  try {
    const r = await fetch(CONFIG.API_LIBROS, { credentials: 'same-origin' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    const lista = Array.isArray(data) ? data : (data.libros || []);
    if (!lista.length) throw new Error('La lista llegó vacía');
    return { libros: lista.map(normalizar), demo: false };
  } catch (e) {
    console.warn('No se pudo leer ' + CONFIG.API_LIBROS + ', uso libros de prueba:', e);
    return { libros: LIBROS_DEMO.map(normalizar), demo: true };
  }
}
 
function avisar(texto, ms = 2600) {
  const a = $('aviso');
  a.className = 'cristal visible';
  a.textContent = texto;
  clearTimeout(avisar._t);
  avisar._t = setTimeout(() => { a.className = 'cristal'; }, ms);
}
 
/* ============================================================
   PORTADAS (se dibujan en un canvas, una por libro)
   ============================================================ */
function envolverTexto(ctx, texto, anchoMax) {
  const palabras = texto.split(/\s+/);
  const lineas = [];
  let actual = '';
  palabras.forEach(p => {
    const prueba = actual ? actual + ' ' + p : p;
    if (ctx.measureText(prueba).width <= anchoMax || !actual) actual = prueba;
    else { lineas.push(actual); actual = p; }
  });
  if (actual) lineas.push(actual);
  return lineas;
}
 
function recortar(ctx, texto, anchoMax) {
  if (ctx.measureText(texto).width <= anchoMax) return texto;
  while (texto.length > 1 && ctx.measureText(texto + '…').width > anchoMax) texto = texto.slice(0, -1);
  return texto + '…';
}
 
function crearPortada(scene, libro, colorHex, indice) {
  const W = 256, H = 384;
  const tex = new BABYLON.DynamicTexture('portada' + indice, { width: W, height: H }, scene, true);
  tex.anisotropicFilteringLevel = 4;
  const ctx = tex.getContext();
  const c = BABYLON.Color3.FromHexString(colorHex);
  const rgb = k => Math.round(c.r * 255 * k) + ',' + Math.round(c.g * 255 * k) + ',' + Math.round(c.b * 255 * k);
 
  // Fondo: noche arriba, color de la categoría al centro, violeta profundo abajo
  const fondo = ctx.createLinearGradient(0, 0, 0, H);
  fondo.addColorStop(0, '#0b1038');
  fondo.addColorStop(0.55, 'rgb(' + rgb(0.42) + ')');
  fondo.addColorStop(1, '#1d1760');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, W, H);
 
  // Cortina de aurora decorativa
  for (let x = 0; x <= W; x += 2) {
    const y = H * 0.62 + Math.sin(x * 0.03 + indice) * 22 + Math.sin(x * 0.011) * 14;
    const g = ctx.createLinearGradient(0, y - 90, 0, y + 10);
    g.addColorStop(0, 'rgba(' + rgb(1) + ',0)');
    g.addColorStop(0.8, 'rgba(' + rgb(1) + ',0.22)');
    g.addColorStop(1, 'rgba(' + rgb(1) + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y - 90, 2, 100);
  }
 
  // Marco
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, W - 24, H - 24);
 
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(recortar(ctx, libro.categoria, W - 60), W / 2, 46);
 
  // Título: baja el tamaño hasta que quepa en 5 líneas
  const anchoTexto = W - 56;
  let tam = 38, lineas;
  for (;;) {
    ctx.font = 'bold ' + tam + 'px Georgia, "Times New Roman", serif';
    lineas = envolverTexto(ctx, libro.titulo, anchoTexto);
    if (lineas.length <= 5 || tam <= 18) break;
    tam -= 2;
  }
  if (lineas.length > 5) { lineas = lineas.slice(0, 5); lineas[4] = recortar(ctx, lineas[4] + '…', anchoTexto); }
  const alturaLinea = tam * 1.2;
  let y = 205 - (lineas.length * alturaLinea) / 2 + tam * 0.85;
  ctx.fillStyle = '#ffffff';
  lineas.forEach(l => { ctx.fillText(l, W / 2, y); y += alturaLinea; });
 
  // Autor
  ctx.fillStyle = 'rgba(232,236,255,0.88)';
  ctx.font = 'italic 17px Georgia, "Times New Roman", serif';
  const lineasAutor = envolverTexto(ctx, libro.autor, anchoTexto).slice(0, 2);
  let ya = H - 62 - (lineasAutor.length - 1) * 20;
  lineasAutor.forEach(l => { ctx.fillText(recortar(ctx, l, anchoTexto), W / 2, ya); ya += 20; });
 
  // Estado
  if (!libro.disponible) {
    ctx.fillStyle = 'rgba(5,8,25,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff9db8';
    ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Prestado', W / 2, H - 26);
  }
 
  tex.update();
  return tex;
}
 
/* ============================================================
   ESCENA
   ============================================================ */
function crearCielo(scene) {
  const W = 1024, H = 512;
  const tex = new BABYLON.DynamicTexture('auroraTex', { width: W, height: H }, scene, false);
  const ctx = tex.getContext();
 
  const fondo = ctx.createLinearGradient(0, 0, 0, H);
  fondo.addColorStop(0, '#04061a');
  fondo.addColorStop(0.5, '#0b1140');
  fondo.addColorStop(0.8, '#1d1760');
  fondo.addColorStop(1, '#2a1d70');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, W, H);
 
  for (let i = 0; i < 280; i++) {
    ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.7) + ')';
    ctx.fillRect(Math.random() * W, Math.random() * H * 0.62, 1.4, 1.4);
  }
 
  const bandas = [
    { c: '110,168,255', y: 0.40, f: 0.012, a: 34 },
    { c: '139,123,255', y: 0.33, f: 0.009, a: 40 },
    { c: '94,224,208',  y: 0.27, f: 0.015, a: 26 }
  ];
  bandas.forEach(b => {
    for (let x = 0; x <= W; x += 2) {
      const y = H * b.y + Math.sin(x * b.f + b.a) * b.a + Math.sin(x * 0.031) * 12;
      const g = ctx.createLinearGradient(0, y - 100, 0, y + 12);
      g.addColorStop(0, 'rgba(' + b.c + ',0)');
      g.addColorStop(0.75, 'rgba(' + b.c + ',0.24)');
      g.addColorStop(1, 'rgba(' + b.c + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y - 100, 2, 112);
    }
  });
  tex.update();
 
  const mat = new BABYLON.StandardMaterial('cieloMat', scene);
  mat.emissiveTexture = tex;
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  mat.fogEnabled = false;
 
  const cielo = BABYLON.MeshBuilder.CreateSphere('cielo', { diameter: 100, segments: 24, sideOrientation: BABYLON.Mesh.BACKSIDE }, scene);
  cielo.material = mat;
  cielo.infiniteDistance = true;
  cielo.isPickable = false;
  return cielo;
}
 
function crearEscena(engine, canvas, libros) {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.027, 0.043, 0.12, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.012;
  scene.fogColor = new BABYLON.Color3(0.05, 0.06, 0.17);
  scene.collisionsEnabled = true;
  scene.skipPointerMovePicking = true;           // el hover lo hago yo, con un pick controlado
  scene.pointerDownPredicate = esLibro;
  scene.pointerUpPredicate = esLibro;
 
  const luz = new BABYLON.HemisphericLight('luz', new BABYLON.Vector3(0, 1, 0), scene);
  luz.intensity = 0.9;
  luz.diffuse = new BABYLON.Color3(0.75, 0.8, 1);
  luz.groundColor = new BABYLON.Color3(0.35, 0.3, 0.6);
  luz.specular = BABYLON.Color3.Black();
 
  const cielo = crearCielo(scene);
 
  /* ---------- Reparto: mitad de los libros en cada lado ---------- */
  const n = libros.length;
  const mitad = Math.ceil(n / 2);
  const lados = [libros.slice(0, mitad), libros.slice(mitad)];
  const niveles = Math.max(1, Math.ceil(mitad / MAX_POR_NIVEL));
  const porNivel = Math.ceil(mitad / niveles);
  const largo = porNivel * SEPARACION;           // largo de cada fila
  const altoPared = ALTO_BASE + niveles * PASO_NIVEL + 0.15;
 
  /* ---------- Plataforma ---------- */
  const suelo = BABYLON.MeshBuilder.CreateGround('suelo', { width: largo + 22, height: Z_FILA * 2 + 14 }, scene);
  const matSuelo = new BABYLON.StandardMaterial('sueloMat', scene);
  matSuelo.diffuseColor = new BABYLON.Color3(0.05, 0.06, 0.15);
  matSuelo.specularColor = BABYLON.Color3.Black();
  suelo.material = matSuelo;
  suelo.isPickable = false;
 
  const pasillo = BABYLON.MeshBuilder.CreateGround('pasillo', { width: largo + 14, height: 2.4 }, scene);
  pasillo.position.y = 0.01;
  const matPasillo = new BABYLON.StandardMaterial('pasilloMat', scene);
  matPasillo.diffuseColor = BABYLON.Color3.Black();
  matPasillo.specularColor = BABYLON.Color3.Black();
  matPasillo.emissiveColor = new BABYLON.Color3(0.09, 0.10, 0.27);
  pasillo.material = matPasillo;
  pasillo.isPickable = false;
 
  /* ---------- Materiales compartidos ---------- */
  const matPared = new BABYLON.StandardMaterial('pared', scene);
  matPared.diffuseColor = new BABYLON.Color3(0.07, 0.07, 0.20);
  matPared.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.14);
  matPared.specularColor = BABYLON.Color3.Black();
  const matRepisa = new BABYLON.StandardMaterial('repisa', scene);
  matRepisa.diffuseColor = new BABYLON.Color3(0.15, 0.12, 0.34);
  matRepisa.emissiveColor = new BABYLON.Color3(0.05, 0.04, 0.12);
  matRepisa.specularColor = BABYLON.Color3.Black();
  const matLed = new BABYLON.StandardMaterial('led', scene);
  matLed.disableLighting = true;
  matLed.emissiveColor = BABYLON.Color3.FromHexString('#8b7bff');
  [matPared, matRepisa, matLed].forEach(m => m.freeze());
 
  const categorias = [...new Set(libros.map(l => l.categoria))];
  const colorCat = {};
  categorias.forEach((c, i) => { colorCat[c] = PALETA[i % PALETA.length]; });
 
  const matCuerpo = {};
  function materialCuerpo(cat, disponible) {
    const clave = cat + '|' + disponible;
    if (matCuerpo[clave]) return matCuerpo[clave];
    const col = BABYLON.Color3.FromHexString(colorCat[cat]);
    const m = new BABYLON.StandardMaterial('cuerpo' + clave, scene);
    m.specularColor = BABYLON.Color3.Black();
    m.diffuseColor = col.scale(disponible ? 0.5 : 0.2);
    m.emissiveColor = col.scale(disponible ? 0.18 : 0.04);
    m.freeze();
    matCuerpo[clave] = m;
    return m;
  }
 
  /* ---------- Una fila de la galería ---------- */
  const zLibro = -0.30;                          // posición local de los libros sobre el pedestal
  function crearFila(lado, lista) {
    const nodo = new BABYLON.TransformNode('fila' + lado, scene);
    nodo.position.set(0, 0, lado === 0 ? -Z_FILA : Z_FILA);
    nodo.rotation.y = lado === 0 ? 0 : Math.PI;  // el frente siempre mira al pasillo
 
    const pared = BABYLON.MeshBuilder.CreateBox('pared' + lado, { width: largo + 2, height: altoPared, depth: 0.1 }, scene);
    pared.parent = nodo; pared.position.set(0, altoPared / 2, -0.6);
    pared.material = matPared; pared.checkCollisions = true; pared.isPickable = false;
 
    for (let nv = 0; nv < niveles; nv++) {
      const tope = ALTO_BASE + nv * PASO_NIVEL;
      const alto = nv === 0 ? ALTO_BASE : 0.06;
      const repisa = BABYLON.MeshBuilder.CreateBox('repisa' + lado + nv, { width: largo + 1, height: alto, depth: 0.5 }, scene);
      repisa.parent = nodo; repisa.position.set(0, tope - alto / 2, -0.30);
      repisa.material = matRepisa; repisa.checkCollisions = true; repisa.isPickable = false;
 
      const tira = BABYLON.MeshBuilder.CreateBox('tira' + lado + nv, { width: largo + 1, height: 0.012, depth: 0.012 }, scene);
      tira.parent = nodo; tira.position.set(0, tope - 0.04, -0.044);
      tira.material = matLed; tira.isPickable = false;
    }
 
    lista.forEach((l, k) => {
      const nv = Math.floor(k / porNivel), col = k % porNivel;
      const x = (col - (porNivel - 1) / 2) * SEPARACION;
      const y = ALTO_BASE + nv * PASO_NIVEL + LIBRO.alto / 2;
 
      const cuerpo = BABYLON.MeshBuilder.CreateBox('libro' + l.id + '_' + k, { width: LIBRO.ancho, height: LIBRO.alto, depth: LIBRO.grosor }, scene);
      cuerpo.parent = nodo;
      cuerpo.position.set(x, y, zLibro);
      cuerpo.material = materialCuerpo(l.categoria, l.disponible);
      cuerpo.metadata = { libro: l, baseZ: zLibro };
 
      const matTapa = new BABYLON.StandardMaterial('tapaMat' + lado + k, scene);
      matTapa.emissiveTexture = crearPortada(scene, l, colorCat[l.categoria], lado * 1000 + k);
      matTapa.disableLighting = true;
      matTapa.specularColor = BABYLON.Color3.Black();
      matTapa.freeze();
 
      const tapa = BABYLON.MeshBuilder.CreatePlane('tapa' + l.id + '_' + k, { width: LIBRO.ancho, height: LIBRO.alto }, scene);
      tapa.parent = cuerpo;
      tapa.position.z = LIBRO.grosor / 2 + 0.002;
      tapa.rotation.y = Math.PI;                 // la cara visible del plano mira hacia el pasillo
      tapa.material = matTapa;
      tapa.isPickable = false;                   // el clic lo recibe el cuerpo del libro
    });
  }
  lados.forEach((lista, i) => crearFila(i, lista));
 
  /* ---------- Cámara ---------- */
  const cam = new BABYLON.UniversalCamera('cam', new BABYLON.Vector3(-largo / 2 - 3, CONFIG.ALTURA_OJOS, 0), scene);
  cam.setTarget(new BABYLON.Vector3(0, CONFIG.ALTURA_OJOS, 0));
  cam.attachControl(canvas, true);
  cam.minZ = 0.05; cam.maxZ = 150; cam.fov = 1.0;
  cam.speed = 0.2; cam.inertia = 0.75; cam.angularSensibility = 2600;
  cam.keysUp = [87, 38]; cam.keysDown = [83, 40]; cam.keysLeft = [65, 37]; cam.keysRight = [68, 39];
  cam.checkCollisions = true; cam.applyGravity = false;
  cam.ellipsoid = new BABYLON.Vector3(0.35, 0.8, 0.35);
 
  const limX = largo / 2 + 8, limZ = Z_FILA + 0.5;
  scene.onBeforeRenderObservable.add(() => {
    cam.position.y = CONFIG.ALTURA_OJOS;
    cam.position.x = Math.max(-limX, Math.min(limX, cam.position.x));
    cam.position.z = Math.max(-limZ, Math.min(limZ, cam.position.z));
    cielo.rotation.y += engine.getDeltaTime() * 0.00003;
  });
 
  /* ---------- Interacción ---------- */
  let hover = null, ultimoPick = 0;
 
  function setHover(mesh) {
    if (hover && hover !== mesh) hover.position.z = hover.metadata.baseZ;
    hover = mesh;
    if (mesh) { mesh.position.z = mesh.metadata.baseZ + 0.1; canvas.style.cursor = 'pointer'; }
    else { canvas.style.cursor = 'default'; }
  }
 
  scene.onPointerObservable.add(pi => {
    const T = BABYLON.PointerEventTypes;
    if (pi.type === T.POINTERMOVE) {
      const t = performance.now();
      if (t - ultimoPick < 50) return;
      ultimoPick = t;
      const pk = scene.pick(scene.pointerX, scene.pointerY, esLibro);
      setHover(pk.hit ? pk.pickedMesh : null);
    } else if (pi.type === T.POINTERTAP) {
      let pk = pi.pickInfo;
      if (!pk || !pk.hit || !esLibro(pk.pickedMesh)) pk = scene.pick(scene.pointerX, scene.pointerY, esLibro);
      if (pk.hit && esLibro(pk.pickedMesh)) {
        const l = pk.pickedMesh.metadata.libro;
        mostrarLibro(l, colorCat[l.categoria]);
      }
    }
  });
 
  return { scene, suelo, categorias, colorCat };
}
 
/* ============================================================
   PANEL DE INFORMACIÓN
   ============================================================ */
let libroActual = null;
 
function mostrarLibro(l, color) {
  libroActual = l;
  $('p-titulo').textContent = l.titulo;
  $('p-autor').textContent = l.autor;
  $('p-desc').textContent = l.descripcion;
  $('p-cat').querySelector('span').textContent = l.categoria;
  $('p-cat').querySelector('i').style.background = color;
  const est = $('p-estado');
  est.textContent = l.disponible ? 'Disponible' : 'Prestado';
  est.className = 'insignia ' + (l.disponible ? 'ok' : 'no');
  $('p-solicitar').disabled = !l.disponible;
  $('panel').classList.add('abierto');
}
function cerrarPanel() { $('panel').classList.remove('abierto'); libroActual = null; }
 
$('p-cerrar').addEventListener('click', cerrarPanel);
window.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarPanel(); });
 
$('p-solicitar').addEventListener('click', () => {
  if (!libroActual) return;
  // TODO: conectar con tu backend, por ejemplo:
  // fetch('/api/prestamos/solicitar', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ libro_id: libroActual.id }) })
  avisar('Solicitud de «' + libroActual.titulo + '» lista para conectar con el backend');
});
 
$('volver').addEventListener('click', () => {
  if (history.length > 1) history.back(); else location.href = CONFIG.URL_VOLVER;
});
 
/* ============================================================
   WEBXR (opcional): solo aparece si hay gafas VR compatibles
   ============================================================ */
async function activarXR(scene, suelo) {
  if (!navigator.xr) return;
  try {
    const ok = await navigator.xr.isSessionSupported('immersive-vr');
    if (!ok) return;
    await scene.createDefaultXRExperienceAsync({ floorMeshes: [suelo] });
  } catch (e) {
    console.warn('WebXR no disponible:', e);
  }
}
 
/* ============================================================
   ARRANQUE
   ============================================================ */
(async function () {
  const canvas = $('renderCanvas');
  const engine = new BABYLON.Engine(canvas, CONFIG.ANTIALIAS, { powerPreference: 'high-performance', stencil: false });
  engine.setHardwareScalingLevel(CONFIG.ESCALA_HW);
 
  const { libros, demo } = await cargarLibros();
  const { scene, suelo, categorias, colorCat } = crearEscena(engine, canvas, libros);
 
  $('contador').textContent = libros.length + (libros.length === 1 ? ' libro' : ' libros');
  const lista = $('leyenda-lista');
  categorias.forEach(c => {
    const li = document.createElement('li');
    const i = document.createElement('i');
    i.style.background = colorCat[c];
    li.appendChild(i);
    li.appendChild(document.createTextNode(c));
    lista.appendChild(li);
  });
 
  if (demo) {
    const a = $('aviso');
    a.className = 'cristal demo';
    a.textContent = 'Modo demostración: no se pudieron leer los libros de ' + CONFIG.API_LIBROS;
  }
 
  scene.executeWhenReady(() => {
    $('carga').classList.add('fuera');
    canvas.focus();
    engine.runRenderLoop(() => scene.render());
  });
  window.addEventListener('resize', () => engine.resize());
  activarXR(scene, suelo);
})();