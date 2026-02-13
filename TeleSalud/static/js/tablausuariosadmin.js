document.addEventListener("DOMContentLoaded", () => {
  cargarUsuarios();

  const search = document.getElementById("searchUsers");
  const perPage = document.getElementById("perPageUsers");

  if (search) {
    search.addEventListener("input", () => {
      paginaActual = 1;
      aplicarFiltrosYRenderUsuarios();
    });
  }

  if (perPage) {
    perPage.addEventListener("change", () => {
      resultadosPorPagina = parseInt(perPage.value, 10) || 5;
      paginaActual = 1;
      aplicarFiltrosYRenderUsuarios();
    });
  }
});

let datos = [];             // usuarios completos
let datosFiltrados = [];    // filtrados/ordenados
let datosMostrados = [];    // paginados
let resultadosPorPagina = 5;
let paginaActual = 1;

// sorting
let sortUsers = { index: 0, dir: "asc" };

function cargarUsuarios() {
  fetch("/administrador/usuarios")
    .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then((data) => {
      datos = Array.isArray(data.usuarios) ? data.usuarios : [];
      aplicarFiltrosYRenderUsuarios();
    })
    .catch((error) => {
      console.error("Error al cargar usuarios:", error);
      setStatusUsers("Error al cargar usuarios.");
    });
}

function aplicarFiltrosYRenderUsuarios() {
  const search = document.getElementById("searchUsers");
  const q = (search?.value || "").toLowerCase().trim();

  datosFiltrados = datos.filter((u) => {
    const nombre = String(u.nombre ?? "").toLowerCase();
    const correo = String(u.correo ?? "").toLowerCase();
    const telefono = String(u.telefono ?? "").toLowerCase();
    const nacimiento = String(u.nacimiento ?? "").toLowerCase();
    const sexo = String(u.sexo ?? "").toLowerCase();

    return (
      nombre.includes(q) ||
      correo.includes(q) ||
      telefono.includes(q) ||
      nacimiento.includes(q) ||
      sexo.includes(q)
    );
  });

  ordenarInternoUsuarios(sortUsers.index, sortUsers.dir);

  actualizarUsuariosMostrados();
  mostrarUsuarios();
  activarPaginacionUsuarios();

  setStatusUsers(`Mostrando ${datosFiltrados.length} de ${datos.length} usuarios`);
}

function mostrarUsuarios() {
  const tableBody = document.getElementById("tableBodyuser");
  tableBody.innerHTML = "";

  if (datosMostrados.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-10 text-center text-slate-400">
          No hay usuarios para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  datosMostrados.forEach((u) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-white/5 transition";

    const nombre = escapeHtml(u.nombre ?? "");
    const correo = escapeHtml(u.correo ?? "");
    const telefono = escapeHtml(u.telefono ?? "");
    const nacimiento = escapeHtml(u.nacimiento ?? "");
    const sexo = escapeHtml(u.sexo ?? "");
    const id = u.id;

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-white">${nombre}</td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-300">${correo}</td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-300">${telefono}</td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-300">${nacimiento}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold text-white">
          ${sexo || "-"}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <a
          href="/administrador/descargar_datos_usuario/${id}"
          class="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 transition"
          title="Descargar datos del usuario"
        >
          <svg class="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 16.5l-6-6h4V3h4v7.5h4l-6 6zm-6 1.5h12v2H6v-2z"/>
          </svg>
          Descargar
        </a>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

function actualizarUsuariosMostrados() {
  const inicio = (paginaActual - 1) * resultadosPorPagina;
  const fin = inicio + resultadosPorPagina;
  datosMostrados = datosFiltrados.slice(inicio, fin);
}

function activarPaginacionUsuarios() {
  const paginacion = document.getElementById("paginacion");
  paginacion.innerHTML = "";

  const total = datosFiltrados.length;
  const paginas = Math.max(1, Math.ceil(total / resultadosPorPagina));

  if (paginaActual > paginas) paginaActual = paginas;

  paginacion.appendChild(crearBtn("«", paginaActual === 1, () => {
    paginaActual--;
    aplicarFiltrosYRenderUsuarios();
  }));

  const maxBtns = 7;
  let start = Math.max(1, paginaActual - Math.floor(maxBtns / 2));
  let end = Math.min(paginas, start + maxBtns - 1);
  start = Math.max(1, end - maxBtns + 1);

  for (let i = start; i <= end; i++) {
    paginacion.appendChild(
      crearBtn(String(i), false, () => {
        paginaActual = i;
        aplicarFiltrosYRenderUsuarios();
      }, i === paginaActual)
    );
  }

  paginacion.appendChild(crearBtn("»", paginaActual === paginas, () => {
    paginaActual++;
    aplicarFiltrosYRenderUsuarios();
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

// Sorting desde el HTML
function ordenarColumnaUsuarios(index) {
  if (sortUsers.index === index) {
    sortUsers.dir = sortUsers.dir === "asc" ? "desc" : "asc";
  } else {
    sortUsers.index = index;
    sortUsers.dir = "asc";
  }
  aplicarFiltrosYRenderUsuarios();
}

function ordenarInternoUsuarios(index, dir) {
  const keyMap = ["nombre", "correo", "telefono", "nacimiento", "sexo"];
  const key = keyMap[index] || "nombre";
  const sign = dir === "asc" ? 1 : -1;

  datosFiltrados.sort((a, b) => {
    const A = String(a?.[key] ?? "").toLowerCase();
    const B = String(b?.[key] ?? "").toLowerCase();
    if (A < B) return -1 * sign;
    if (A > B) return 1 * sign;
    return 0;
  });
}

function setStatusUsers(msg) {
  const el = document.getElementById("tableStatusUsers");
  if (el) el.textContent = msg;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
