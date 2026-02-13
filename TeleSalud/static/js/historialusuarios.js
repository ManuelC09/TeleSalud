let datos = [];
let datosFiltrados = [];
let datosMostrados = [];
let resultadosPorPagina = 5;
let paginaActual = 1;

let orden = { col: null, asc: true };

document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();

  const buscador = document.getElementById("buscadorHistorial");
  if (buscador) {
    buscador.addEventListener("input", (e) => {
      aplicarFiltro(e.target.value);
    });
  }
});

function cargarDatos() {
  fetch("/mediciones/historial/datos")
    .then((r) => r.json())
    .then((data) => {
      datos = (data.mediciones || []).map((m) => ({
        bpm: m.bpm,
        spo2: m.spo2,
        hora: m.hora,
        fecha: m.fecha,
      }));

      // Inicial: todo visible
      datosFiltrados = [...datos];
      paginaActual = 1;

      render();
    })
    .catch((err) => console.error("Error al cargar los datos:", err));
}

function aplicarFiltro(texto) {
  const q = (texto || "").toLowerCase().trim();

  if (!q) {
    datosFiltrados = [...datos];
  } else {
    datosFiltrados = datos.filter((d) => {
      const bpm = String(d.bpm ?? "").toLowerCase();
      const spo2 = String(d.spo2 ?? "").toLowerCase();
      const hora = String(d.hora ?? "").toLowerCase();
      const fecha = String(d.fecha ?? "").toLowerCase();
      return bpm.includes(q) || spo2.includes(q) || hora.includes(q) || fecha.includes(q);
    });
  }

  paginaActual = 1;
  render();
}

function render() {
  actualizardatosMostrados();
  mostrardatos();
  activarPaginacion();
  actualizarContador();
  toggleEmptyState();
}

function actualizardatosMostrados() {
  const inicio = (paginaActual - 1) * resultadosPorPagina;
  const fin = inicio + resultadosPorPagina;
  datosMostrados = datosFiltrados.slice(inicio, fin);
}

function mostrardatos() {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  datosMostrados.forEach((d) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-white/5 transition";

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-200 ring-1 ring-blue-400/20">
          ${escapeHtml(d.bpm)}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/20">
          ${escapeHtml(d.spo2)}%
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-200">${escapeHtml(d.hora)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-200">${escapeHtml(d.fecha)}</td>
    `;
    tableBody.appendChild(row);
  });
}

function activarPaginacion() {
  const paginacion = document.getElementById("paginacion");
  paginacion.innerHTML = "";

  const total = datosFiltrados.length;
  const paginas = Math.ceil(total / resultadosPorPagina);

  if (paginas <= 1) return;

  // Prev
  paginacion.appendChild(
    crearBoton("‹", paginaActual === 1, () => {
      paginaActual--;
      render();
    })
  );

  for (let i = 1; i <= paginas; i++) {
    const activo = i === paginaActual;
    paginacion.appendChild(
      crearBoton(String(i), false, () => {
        paginaActual = i;
        render();
      }, activo)
    );
  }

  // Next
  paginacion.appendChild(
    crearBoton("›", paginaActual === paginas, () => {
      paginaActual++;
      render();
    })
  );
}

function crearBoton(texto, disabled, onClick, active = false) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = texto;

  btn.className =
    "min-w-[2.5rem] h-[2.5rem] px-3 rounded-xl text-sm font-semibold ring-1 ring-white/10 bg-white/5 text-white hover:bg-white/10 transition";

  if (active) btn.className += " bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20";
  if (disabled) btn.className += " opacity-40 cursor-not-allowed";

  btn.disabled = disabled;
  if (!disabled) btn.addEventListener("click", onClick);
  return btn;
}

function ordenarColumna(index) {
  const cols = ["bpm", "spo2", "hora", "fecha"];
  const key = cols[index];

  if (orden.col === key) {
    orden.asc = !orden.asc;
  } else {
    orden.col = key;
    orden.asc = true;
  }

  datosFiltrados.sort((a, b) => comparar(a[key], b[key], orden.asc));
  paginaActual = 1;
  render();
}

function comparar(a, b, asc) {
  // intenta número, si no, string
  const na = Number(a);
  const nb = Number(b);

  let res = 0;

  if (!Number.isNaN(na) && !Number.isNaN(nb)) {
    res = na - nb;
  } else {
    const sa = String(a ?? "").toLowerCase();
    const sb = String(b ?? "").toLowerCase();
    res = sa.localeCompare(sb);
  }

  return asc ? res : -res;
}

function actualizarContador() {
  const el = document.getElementById("contadorFiltrado");
  if (el) el.textContent = String(datosFiltrados.length);
}

function toggleEmptyState() {
  const empty = document.getElementById("emptyState");
  const tableBody = document.getElementById("tableBody");
  if (!empty || !tableBody) return;

  if (datosFiltrados.length === 0) {
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
