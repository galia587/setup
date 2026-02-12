
const CLASSES_URL ='../clases.json'; 
const CART_KEY = 'carrito';
let clases = [];
let carrito = JSON.parse(localStorage.getItem(CART_KEY)) || [];

// fetch y render
export async function cargarClases() {
  try {
    const res = await fetch(CLASSES_URL);
    if (!res.ok) throw new Error('No se pudo cargar clases.json');
    clases = await res.json();
    renderClases();
    actualizarCarrito();
  } catch (err) {
    console.error(err);
    const cont = document.getElementById('lista-clases');
    cont.innerHTML = '<p>Error al cargar las clases. Intentá recargar la página.</p>';
  }
}

function crearCard(clase) {
  const section = document.createElement('section');
  section.className = 'estilo';

  const imagenDiv = document.createElement('div');
  imagenDiv.className = 'imagen';
  imagenDiv.style.backgroundImage = `url('${clase.imagen}')`;

  const contenido = document.createElement('div');
  contenido.className = 'contenido';

  contenido.innerHTML = `
    <h2>${clase.titulo}</h2>
    <p class="desc">${clase.descripcion}</p>
    <p><strong>Profesor:</strong> ${clase.profesor} • <strong>Nivel:</strong> ${clase.nivel}</p>
    <p><strong>Horario:</strong> ${clase.horario} • <strong>Duración:</strong> ${clase.duracion}</p>
    <p><strong>Precio:</strong> $${clase.precio} • <strong>Cupos:</strong> <span id="cupos-${clase.id}">${clase.cupos}</span></p>
  `;

  const btn = document.createElement('button');
  btn.textContent = clase.buttonText || 'Anotarme';
  btn.className = 'enroll-btn';
  btn.addEventListener('click', () => agregarClase(clase.id));

  contenido.appendChild(btn);
  section.appendChild(imagenDiv);
  section.appendChild(contenido);
  return section;
}

function renderClases() {
  const cont = document.getElementById('lista-clases');
  // Mantener título principal
  cont.innerHTML = '<h2>Clases disponibles</h2>';
  clases.forEach(c => {
    const card = crearCard(c);
    cont.appendChild(card);
  });
}

export function agregarClase(id) {
  const clase = clases.find(c => c.id === id);
  if (!clase) return;

  const cuposElem = document.getElementById(`cupos-${id}`);
  const cuposActuales = parseInt(cuposElem?.textContent || clase.cupos, 10);
  if (cuposActuales <= 0) {
    Swal.fire({ title: 'Sin cupos', text: 'No hay cupos disponibles para esta clase.', icon: 'warning', confirmButtonText: 'OK' });
    return;
  }

  if (carrito.some(item => item.id === id)) {
    Swal.fire({ title: 'Ya agregada', text: 'La clase ya está en tu inscripción.', icon: 'info', confirmButtonText: 'OK' });
    return;
  }

  carrito.push({ id: clase.id, nombre: clase.titulo, precio: clase.precio });
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));

  if (cuposElem) cuposElem.textContent = cuposActuales - 1;

  actualizarCarrito();
  Swal.fire({ title: '¡Clase agregada!', text: `${clase.titulo} fue añadida a tu inscripción.`, icon: 'success', confirmButtonText: 'OK' });
}

function actualizarCarrito() {
  const lista = document.getElementById('carrito-lista');
  lista.innerHTML = '';
  if (carrito.length === 0) {
    lista.innerHTML = '<li>Carrito vacío</li>';
  } else {
    carrito.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `${c.nombre} - $${c.precio} <button class="quitar-btn" data-id="${c.id}">Quitar</button>`;
      lista.appendChild(li);
    });

    lista.querySelectorAll('.quitar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id, 10);
        quitarClase(id);
      });
    });
  }
  document.getElementById('carrito-total').textContent = carrito.length;
}

function quitarClase(id) {
  const clase = clases.find(c => c.id === id);
  carrito = carrito.filter(i => i.id !== id);
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));
  // restaurar cupo en UI (local)
  const cuposElem = document.getElementById(`cupos-${id}`);
  if (cuposElem && clase) {
    cuposElem.textContent = parseInt(cuposElem.textContent || clase.cupos, 10) + 1;
  }
  actualizarCarrito();
}

// fin inscripción
function finalizarInscripcion() {
  if (carrito.length === 0) {
    Swal.fire({ title: 'Carrito vacío', text: 'No seleccionaste ninguna clase.', icon: 'warning', confirmButtonText: 'OK' });
    return;
  }
  const resumen = carrito.map(c => `- ${c.nombre} ($${c.precio})`).join('<br>');
  const total = carrito.reduce((acc, c) => acc + c.precio, 0);
  Swal.fire({
    title: 'Inscripción confirmada',
    html: `${resumen}<br><br><b>Total a pagar: $${total}</b>`,
    icon: 'info',
    confirmButtonText: 'Finalizar'
  }).then(() => {
    carrito = [];
    localStorage.removeItem(CART_KEY);
   
    cargarClases();
  });
}

// Inicialización al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
  
  cargarClases();
  document.getElementById('finalizar-btn').addEventListener('click', finalizarInscripcion);
});
