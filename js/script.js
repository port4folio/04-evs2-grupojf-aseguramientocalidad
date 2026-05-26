const fechaInicio = document.getElementById("fechaInicio");
const fechaTermino = document.getElementById("fechaTermino");
const resumenVacaciones = document.getElementById("resumenVacaciones");
const botonGuardar = document.getElementById("guardarVacacion");
const tablaVacaciones = document.getElementById("tablaVacaciones");
const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function convertirFecha(fechaTexto) {
    const partes = fechaTexto.split("-");
    return new Date(partes[0], partes[1] - 1, partes[2]);
}

function calcularDias() {
    if (fechaInicio && fechaTermino && resumenVacaciones && fechaInicio.value && fechaTermino.value) {
        const inicio = convertirFecha(fechaInicio.value);
        const termino = convertirFecha(fechaTermino.value);
        const diferencia = termino - inicio;
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24)) + 1;

        resumenVacaciones.value = `Desde el ${inicio.getDate()} de ${meses[inicio.getMonth()]}, son ${dias} días de vacaciones.`;
        return dias;
    }
    return 0;
}

function obtenerSolicitudes() {
    return JSON.parse(localStorage.getItem("solicitudesVacaciones")) || [];
}

function guardarSolicitudes(solicitudes) {
    localStorage.setItem("solicitudesVacaciones", JSON.stringify(solicitudes));
}

function eliminarSolicitudesVencidas() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let solicitudes = obtenerSolicitudes();

    solicitudes = solicitudes.filter(function (solicitud) {
        const termino = convertirFecha(solicitud.fechaTermino);
        termino.setHours(0, 0, 0, 0);

        if (solicitud.estado === "Rechazada") {
            const fechaRechazo = new Date(solicitud.fechaRechazo);
            const diferenciaHoras = (new Date() - fechaRechazo) / (1000 * 60 * 60);
            return diferenciaHoras < 24;
        }
        if (solicitud.estado === "Pendiente") {
            const fechaSolicitud = new Date(solicitud.id);
            const diferenciaDias = (new Date() - fechaSolicitud) / (1000 * 60 * 60 * 24);
            return diferenciaDias < 7;
        }
        return termino >= hoy;
    });

    guardarSolicitudes(solicitudes);
}

function claseEstado(estado) {
    if (estado === "Aprobada") {
        return "badge bg-success";
    }
    if (estado === "Rechazada") {
        return "badge bg-danger";
    }
    return "badge bg-warning text-dark";
}

function mostrarTablaVacaciones() {
    if (!tablaVacaciones) return;

    eliminarSolicitudesVencidas();

    const solicitudes = obtenerSolicitudes();

    if (solicitudes.length === 0) {
        tablaVacaciones.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    No existen solicitudes registradas.
                </td>
            </tr>
        `;
        return;
    }

    tablaVacaciones.innerHTML = "";

    solicitudes.forEach(function (solicitud) {
        const inicio = convertirFecha(solicitud.fechaInicio);

        tablaVacaciones.innerHTML += `
            <tr>
                <td>${inicio.getFullYear()}</td>
                <td>${solicitud.nombre}</td>
                <td>${solicitud.rut}</td>
                <td>${solicitud.fechaInicio}</td>
                <td>${solicitud.fechaTermino}</td>
                <td>${solicitud.dias}</td>
                <td>
                    <span class="${claseEstado(solicitud.estado)}">
                        ${solicitud.estado}
                    </span>
                </td>
            </tr>
        `;
    });
}

if (fechaInicio && fechaTermino) {
    fechaInicio.addEventListener("change", calcularDias);
    fechaTermino.addEventListener("change", calcularDias);
}

if (botonGuardar && tablaVacaciones) {
    botonGuardar.addEventListener("click", function () {
        const dias = calcularDias();
        const nombreTrabajador = document.getElementById("nombreTrabajador").value;
        const rutTrabajador = document.getElementById("rutTrabajador").value;
        const motivoVacaciones = document.getElementById("motivoVacaciones").value;

        if (nombreTrabajador === "" || rutTrabajador === "" || fechaInicio.value === "" || fechaTermino.value === "" || dias <= 0) {
            alert("Debe completar correctamente los datos de la solicitud.");
            return;
        }

        const nuevaSolicitud = {
            id: Date.now(),
            nombre: nombreTrabajador,
            rut: rutTrabajador,
            fechaInicio: fechaInicio.value,
            fechaTermino: fechaTermino.value,
            dias: dias,
            motivo: motivoVacaciones,
            estado: "Pendiente",
            fechaRechazo: null
        };

        const solicitudes = obtenerSolicitudes();
        solicitudes.push(nuevaSolicitud);
        guardarSolicitudes(solicitudes);
        localStorage.setItem("solicitudActual", JSON.stringify(nuevaSolicitud));
        mostrarTablaVacaciones();

        alert("La solicitud fue guardada y enviada a Recursos Humanos.");

        window.location.href = "correo.html";
    });
}

function cargarCorreo() {
    const solicitud = JSON.parse(localStorage.getItem("solicitudActual"));

    if (solicitud && document.getElementById("correoNombre")) {
        document.getElementById("correoNombre").textContent = solicitud.nombre;
        document.getElementById("correoRut").textContent = solicitud.rut;
        document.getElementById("correoInicio").textContent = solicitud.fechaInicio;
        document.getElementById("correoTermino").textContent = solicitud.fechaTermino;
        document.getElementById("correoDias").textContent = solicitud.dias;
        document.getElementById("correoMotivo").textContent = solicitud.motivo;
        const estado = document.getElementById("estadoCorreo");
        estado.textContent = solicitud.estado;
        estado.className = claseEstado(solicitud.estado);
    }
}

function actualizarEstadoSolicitud(nuevoEstado) {
    const solicitudActual = JSON.parse(localStorage.getItem("solicitudActual"));

    if (!solicitudActual) return;

    let solicitudes = obtenerSolicitudes();

    solicitudes = solicitudes.map(function (solicitud) {
        if (solicitud.id === solicitudActual.id) {
            solicitud.estado = nuevoEstado;

            if (nuevoEstado === "Rechazada") {
                solicitud.fechaRechazo = new Date().toISOString();
            }
            solicitudActual.estado = nuevoEstado;
            solicitudActual.fechaRechazo = solicitud.fechaRechazo;
        }

        return solicitud;
    });

    guardarSolicitudes(solicitudes);
    localStorage.setItem("solicitudActual", JSON.stringify(solicitudActual));
    cargarCorreo();
}

function aprobarSolicitud() {
    actualizarEstadoSolicitud("Aprobada");
    alert("La solicitud fue aprobada por Recursos Humanos.");
}

function rechazarSolicitud() {
    actualizarEstadoSolicitud("Rechazada");
    alert("La solicitud fue rechazada por Recursos Humanos.");
}

mostrarTablaVacaciones();
cargarCorreo();