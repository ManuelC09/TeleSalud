document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();

  // Eventos UI
  const search = document.getElementById("searchMed");
  const perPage = document.getElementById("perPage");

  if (search) {
    search.addEventListener("input", () => {
      paginaActual1 = 1;
      aplicarFiltrosYRender();
    });
  }

  if (perPage) {
    perPage.addEventListener("change", () => {
      resultadosPorPagina1 = parseInt(perPage.value, 10) || 5;
      paginaActual1 = 1;
      aplicarFiltrosYRender();
    });
  }
});

let datos1 = [];            // datos completos
let datosFiltrados1 = [];   // datos filtrados/ordenados
let datosMostrados1 = [];   // datos paginados (los que se pintan)
let resultadosPorPagina1 = 5;
let paginaActual1 = 1;

// control de sorting
let sortConfig = { index: 3, dir: "desc" }; // por defecto: fecha desc

function cargarDatos() {
  fetch("/administrador/mediciones")
    .then((response) => response.json())
    .then((data) => {
      datos1 = Array.isArray(data.mediciones) ? data.mediciones : [];
      aplicarFiltrosYRender();
    })
    .catch((error) => {
      console.error("Error al cargar los datos:", error);
      setStatus("Error al cargar los datos.");
    });
}

function aplicarFiltrosYRender() {
  const search = document.getElementById("searchMed");
  const q = (search?.value || "").toLowerCase().trim();

  // 1) Filtrar (sin modificar datos1)
  datosFiltrados1 = datos1.filter((d) => {
    const nombre = String(d.usuario_nombre ?? "").toLowerCase();
    const bpm = String(d.bpm ?? "").toLowerCase();
    const spo2 = String(d.spo2 ?? "").toLowerCase();
    const fecha = String(d.fecha ?? "").toLowerCase();
    return (
      nombre.includes(q) ||
      bpm.includes(q) ||
      spo2.includes(q) ||
      fecha.includes(q)
    );
  });

  // 2) Ordenar
  ordenarInterno(sortConfig.index, sortConfig.dir);

  // 3) Paginar y pintar
  actualizardatosMostrados();
  mostrardatos();
  activarPaginacion();

  // Status
  const total = datos1.length;
  const filtrados = datosFiltrados1.length;
  setStatus(`Mostrando ${filtrados} de ${total} registros`);
}

function mostrardatos() {
  const tableBody = document.getElementById("tableBodymediciones");
  tableBody.innerHTML = "";

  if (datosMostrados1.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-10 text-center text-slate-400">
          No hay registros para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  datosMostrados1.forEach((d) => {
    const nombre = escapeHtml(d.usuario_nombre ?? "");
    const bpm = d.bpm ?? "-";
    const spo2 = d.spo2 ?? "-";
    const fecha = escapeHtml(d.fecha ?? "-");

    const row = document.createElement("tr");
    row.className = "hover:bg-white/5 transition";

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-white">${nombre}</td>

      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold text-white">
          ${bpm}
        </span>
      </td>

      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold text-white">
          ${spo2}
        </span>
      </td>

      <td class="px-6 py-4 whitespace-nowrap text-slate-300">${fecha}</td>
    `;

    tableBody.appendChild(row);
  });
}

function actualizardatosMostrados() {
  const inicio = (paginaActual1 - 1) * resultadosPorPagina1;
  const fin = inicio + resultadosPorPagina1;
  datosMostrados1 = datosFiltrados1.slice(inicio, fin);
}

function activarPaginacion() {
  const paginacion = document.getElementById("paginacion");
  paginacion.innerHTML = "";

  const total = datosFiltrados1.length;
  const paginas = Math.max(1, Math.ceil(total / resultadosPorPagina1));

  // Si paginaActual se quedó fuera por un filtro
  if (paginaActual1 > paginas) paginaActual1 = paginas;

  // Botón anterior
  paginacion.appendChild(crearBtn("«", paginaActual1 === 1, () => {
    paginaActual1--;
    aplicarFiltrosYRender();
  }));

  // Ventana de páginas (no mostrar 100 botones)
  const maxBtns = 7;
  let start = Math.max(1, paginaActual1 - Math.floor(maxBtns / 2));
  let end = Math.min(paginas, start + maxBtns - 1);
  start = Math.max(1, end - maxBtns + 1);

  for (let i = start; i <= end; i++) {
    const active = i === paginaActual1;
    const btn = crearBtn(String(i), false, () => {
      paginaActual1 = i;
      aplicarFiltrosYRender();
    }, active);
    paginacion.appendChild(btn);
  }

  // Botón siguiente
  paginacion.appendChild(crearBtn("»", paginaActual1 === paginas, () => {
    paginaActual1++;
    aplicarFiltrosYRender();
  }));
}

function crearBtn(text, disabled, onClick, active = false) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.disabled = disabled;

  b.className =
    "min-w-[2.5rem] h-10 px-3 rounded-xl text-sm font-semibold transition " +
    (active
      ? "bg-blue-600 text-white"
      : "bg-white/10 text-slate-200 hover:bg-white/15") +
    (disabled ? " opacity-40 cursor-not-allowed" : "");

  b.addEventListener("click", onClick);
  return b;
}

function setStatus(msg) {
  const el = document.getElementById("tableStatus");
  if (el) el.textContent = msg;
}

// Ordenar por columna desde el HTML
function ordenarColumna(index) {
  // alternar dirección si repite columna
  if (sortConfig.index === index) {
    sortConfig.dir = sortConfig.dir === "asc" ? "desc" : "asc";
  } else {
    sortConfig.index = index;
    sortConfig.dir = "asc";
  }

  aplicarFiltrosYRender();
}

// Orden interno usando los campos correctos
function ordenarInterno(index, dir) {
  const keyMap = ["usuario_nombre", "bpm", "spo2", "fecha"];
  const key = keyMap[index] || "fecha";
  const sign = dir === "asc" ? 1 : -1;

  datosFiltrados1.sort((a, b) => {
    let A = a?.[key];
    let B = b?.[key];

    // Si son números (bpm/spo2), comparar como números
    const isNumeric = key === "bpm" || key === "spo2";
    if (isNumeric) {
      A = Number(A);
      B = Number(B);
      if (Number.isNaN(A)) A = -Infinity;
      if (Number.isNaN(B)) B = -Infinity;
      return (A - B) * sign;
    }

    // si es fecha, comparar como string (o mejor si tu fecha viene ISO)
    A = String(A ?? "").toLowerCase();
    B = String(B ?? "").toLowerCase();
    if (A < B) return -1 * sign;
    if (A > B) return 1 * sign;
    return 0;
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
