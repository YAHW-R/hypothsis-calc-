// Interfaz: formulario, resultado e historial en localStorage.

const CLAVE = 'contraste-z-historial';
const MAXIMO = 50;

const $ = (id) => document.getElementById(id);
const num = (x) => x.toLocaleString('es-ES', { maximumFractionDigits: 4 });
const numP = (p) => p < 0.0001 ? '< 0,0001' : p.toLocaleString('es-ES', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

const SIMBOLO = { bilateral: '≠', derecha: '>', izquierda: '<' };

function leerFormulario() {
  const pedir = (id, nombre) => {
    const texto = $(id).value.trim();
    if (texto === '') throw new Error(`Falta ${nombre}.`);
    const valor = Number(texto);
    if (!Number.isFinite(valor)) throw new Error(`${nombre} no es un número válido.`);
    return valor;
  };

  const datos = {
    cola: $('cola').value,
    mu0: pedir('mu0', 'μ₀'),
    sigma: pedir('sigma', 'σ'),
    n: pedir('n', 'n'),
    xbar: pedir('xbar', 'la media muestral'),
    alfa: pedir('alfa', 'α'),
  };

  if (datos.sigma <= 0) throw new Error('σ debe ser mayor que 0.');
  if (!Number.isInteger(datos.n) || datos.n < 2) throw new Error('n debe ser un entero mayor o igual que 2.');
  if (datos.alfa <= 0 || datos.alfa >= 1) throw new Error('α debe estar entre 0 y 1 (por ejemplo 0,05).');
  return datos;
}

function regionCritica(datos, critico) {
  const c = num(critico);
  if (datos.cola === 'bilateral') return `|Z| > ${c}`;
  if (datos.cola === 'derecha') return `Z > ${c}`;
  return `Z < −${c}`;
}

function mostrar(datos, r) {
  $('r-z').textContent = num(r.z);
  $('r-p').textContent = numP(r.p);
  $('r-critico').textContent = num(r.critico);
  $('r-region').textContent = regionCritica(datos, r.critico);

  const conclusion = $('conclusion');
  conclusion.className = 'decision ' + (r.rechaza ? 'rechaza' : 'mantiene');
  conclusion.textContent =
    `${r.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀'} al nivel α = ${num(datos.alfa)}: ` +
    (r.rechaza ? 'hay' : 'no hay') +
    ` evidencia suficiente de que μ ${SIMBOLO[datos.cola]} ${num(datos.mu0)}.`;

  $('resultado').hidden = false;
}

function leerHistorial() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function escribirHistorial(entradas) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(entradas));
    return true;
  } catch {
    return false;
  }
}

function guardar(entrada) {
  const entradas = leerHistorial();
  entradas.unshift(entrada);
  return escribirHistorial(entradas.slice(0, MAXIMO));
}

function borrarEntrada(indice) {
  const entradas = leerHistorial();
  entradas.splice(indice, 1);
  escribirHistorial(entradas);
  pintarHistorial();
}

function pintarHistorial() {
  const entradas = leerHistorial();
  const lista = $('lista');
  lista.textContent = '';
  $('vacio').hidden = entradas.length > 0;
  $('vaciar').hidden = entradas.length === 0;

  entradas.forEach((e, indice) => {
    const fila = document.createElement('li');

    const texto = document.createElement('div');
    texto.className = 'entrada';

    const titulo = document.createElement('p');
    titulo.className = 'entrada-titulo';
    titulo.textContent = `Z = ${num(e.z)} · p = ${numP(e.p)} → ${e.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀'}`;

    const detalle = document.createElement('p');
    detalle.className = 'entrada-detalle';
    detalle.textContent =
      `μ₀ = ${num(e.mu0)} · σ = ${num(e.sigma)} · n = ${num(e.n)} · x̄ = ${num(e.xbar)} · α = ${num(e.alfa)} · ` +
      new Date(e.fecha).toLocaleString('es-ES');

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'secundario';
    boton.textContent = 'Borrar';
    boton.setAttribute('aria-label', 'Borrar este cálculo del historial');
    boton.addEventListener('click', () => borrarEntrada(indice));

    texto.append(titulo, detalle);
    fila.append(texto, boton);
    lista.append(fila);
  });
}

$('form').addEventListener('submit', (evento) => {
  evento.preventDefault();
  $('error').hidden = true;

  let datos;
  try {
    datos = leerFormulario();
  } catch (error) {
    $('error').textContent = error.message;
    $('error').hidden = false;
    return;
  }

  const resultado = contrastar(datos);
  mostrar(datos, resultado);

  if (!guardar({ ...datos, ...resultado, fecha: new Date().toISOString() })) {
    $('error').textContent = 'No se pudo guardar en el historial: el almacenamiento del navegador no está disponible.';
    $('error').hidden = false;
  }
  pintarHistorial();
});

$('vaciar').addEventListener('click', () => {
  if (!confirm('¿Vaciar todo el historial?')) return;
  escribirHistorial([]);
  pintarHistorial();
});

pintarHistorial();
