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

/*ANTICIPOS*/
const botonAnticipo = document.getElementById("enviarAnticipo");

if (botonAnticipo) {
    botonAnticipo.addEventListener("click", function () {
        const nombre = document.querySelector("input[placeholder='Ingrese nombre completo']").value.trim();
        const rut = document.querySelector("input[placeholder='Ej: 12.345.678-9']").value.trim();
        const monto = document.querySelector("input[type='number']").value.trim();
        const fecha = document.querySelector("input[type='date']").value;
        const motivo = document.querySelector("textarea").value.trim();

        if (!nombre || !rut || !monto || !fecha || !motivo) {
            alert("Debe completar todos los campos antes de enviar la solicitud.");
            return;
        }

        if (isNaN(monto) || Number(monto) <= 0) {
            alert("El monto debe ser un número mayor a 0.");
            return;
        }

        const solicitudAnticipo = {
            id: Date.now(),
            nombre,
            rut,
            monto: Number(monto),
            fecha,
            motivo,
            estado: "Pendiente"
        };

        const anticipos = JSON.parse(localStorage.getItem("solicitudesAnticipos")) || [];
        anticipos.push(solicitudAnticipo);
        localStorage.setItem("solicitudesAnticipos", JSON.stringify(anticipos));

        alert(`Solicitud de anticipo por $${Number(monto).toLocaleString("es-CL")} enviada correctamente al encargado de remuneraciones.`);

        document.querySelector("input[placeholder='Ingrese nombre completo']").value = "";
        document.querySelector("input[placeholder='Ej: 12.345.678-9']").value = "";
        document.querySelector("input[type='number']").value = "";
        document.querySelector("input[type='date']").value = "";
        document.querySelector("textarea").value = "";
    });
}

/*CÁLCULO PARAMÉTRICO*/
const botonCalcular = document.getElementById("calcularRemuneracion");

if (botonCalcular) {
    botonCalcular.addEventListener("click", function () {
        const inputs = document.querySelectorAll("input[type='number']");
        const sueldoBase   = parseFloat(inputs[0].value) || 0;
        const horasExtras  = parseFloat(inputs[1].value) || 0;
        const bonos        = parseFloat(inputs[2].value) || 0;
        const descuentos   = parseFloat(inputs[3].value) || 0;
        const colacion     = parseFloat(inputs[4].value) || 0;
        const movilizacion = parseFloat(inputs[5].value) || 0;

        const afp    = document.querySelectorAll("select")[0].value;
        const salud  = document.querySelectorAll("select")[1].value;

        if (sueldoBase <= 0) {
            alert("Debe ingresar un sueldo base válido.");
            return;
        }

        if (afp === "Seleccione AFP") {
            alert("Debe seleccionar una AFP.");
            return;
        }

        if (salud === "Seleccione sistema") {
            alert("Debe seleccionar un sistema de salud.");
            return;
        }

        // Porcentajes de descuento estándar Chile
        const porcentajeAFP = 0.1027;
        const porcentajeSalud = salud === "Isapre" ? 0.07 : 0.07;
        const porcentajeCesantia = 0.007;

        const valorHoraExtra = (sueldoBase / 160) * 1.5;
        const totalHorasExtras = valorHoraExtra * horasExtras;

        const baseImponible = sueldoBase + totalHorasExtras + bonos;
        const descuentoAFP = baseImponible * porcentajeAFP;
        const descuentoSalud = baseImponible * porcentajeSalud;
        const descuentoCesantia = baseImponible * porcentajeCesantia;
        const totalDescuentos = descuentoAFP + descuentoSalud + descuentoCesantia + descuentos;

        const sueldoLiquido = baseImponible - totalDescuentos + colacion + movilizacion;

        const formato = (n) => Math.round(n).toLocaleString("es-CL");

        alert(
            `===== RESUMEN DE REMUNERACIÓN =====\n` +
            `Sueldo Base:         $${formato(sueldoBase)}\n` +
            `Horas Extras:        $${formato(totalHorasExtras)}\n` +
            `Bonos:               $${formato(bonos)}\n` +
            `Base Imponible:      $${formato(baseImponible)}\n` +
            `──────────────────────────────────\n` +
            `Descuento AFP (${(porcentajeAFP * 100).toFixed(2)}%): -$${formato(descuentoAFP)}\n` +
            `Descuento Salud (7%): -$${formato(descuentoSalud)}\n` +
            `Seguro Cesantía:     -$${formato(descuentoCesantia)}\n` +
            `Otros Descuentos:    -$${formato(descuentos)}\n` +
            `Colación:            +$${formato(colacion)}\n` +
            `Movilización:        +$${formato(movilizacion)}\n` +
            `──────────────────────────────────\n` +
            `SUELDO LÍQUIDO:      $${formato(sueldoLiquido)}`
        );

        const parametro = {
            id: Date.now(),
            sueldoBase,
            horasExtras,
            bonos,
            descuentos,
            afp,
            salud,
            colacion,
            movilizacion,
            sueldoLiquido: Math.round(sueldoLiquido)
        };

        const calculos = JSON.parse(localStorage.getItem("calculosParametricos")) || [];
        calculos.push(parametro);
        localStorage.setItem("calculosParametricos", JSON.stringify(calculos));
    });
}

/*CONTRATOS Y FINIQUITOS*/
const botonGenerarDocumento = document.getElementById("generarDocumento");

if (botonGenerarDocumento) {
    botonGenerarDocumento.addEventListener("click", function () {
        const nombre     = document.querySelectorAll("input[type='text']")[0].value.trim();
        const rut        = document.querySelectorAll("input[type='text']")[1].value.trim();
        const cargo      = document.querySelectorAll("input[type='text']")[2].value.trim();
        const depto      = document.querySelectorAll("input[type='text']")[3].value.trim();
        const tipoDoc    = document.querySelectorAll("select")[0].value;
        const sueldo     = document.querySelectorAll("input[type='text']")[4].value.trim();
        const tipoContrato = document.querySelectorAll("select")[1].value;

        if (!nombre || !rut || !cargo || !depto || !sueldo) {
            alert("Debe completar todos los campos obligatorios.");
            return;
        }

        if (tipoDoc === "Seleccione una opción") {
            alert("Debe seleccionar un tipo de documento.");
            return;
        }

        if (tipoContrato === "Seleccione tipo") {
            alert("Debe seleccionar un tipo de contrato.");
            return;
        }

        const documento = {
            id: Date.now(),
            nombre,
            rut,
            cargo,
            depto,
            tipoDoc,
            sueldo,
            tipoContrato,
            fechaEmision: new Date().toLocaleDateString("es-CL")
        };

        const documentos = JSON.parse(localStorage.getItem("documentosGenerados")) || [];
        documentos.push(documento);
        localStorage.setItem("documentosGenerados", JSON.stringify(documentos));

        alert(
            `Documento generado exitosamente.\n\n` +
            `Tipo: ${tipoDoc}\n` +
            `Trabajador: ${nombre}\n` +
            `RUT: ${rut}\n` +
            `Cargo: ${cargo}\n` +
            `Departamento: ${depto}\n` +
            `Tipo de Contrato: ${tipoContrato}\n` +
            `Sueldo Base: $${sueldo}\n` +
            `Fecha de Emisión: ${documento.fechaEmision}`
        );
    });
}

/*FICHA PERSONAL*/
const botonGuardarFicha = document.getElementById("guardarFicha");

if (botonGuardarFicha) {
    botonGuardarFicha.addEventListener("click", function () {
        const nombre   = document.querySelector("input[placeholder='Ingrese nombre completo']").value.trim();
        const rut      = document.querySelector("input[placeholder='Ej: 12.345.678-9']").value.trim();
        const direccion = document.querySelector("input[placeholder='Ingrese dirección']").value.trim();
        const telefono = document.querySelector("input[type='tel']").value.trim();
        const correo   = document.querySelector("input[type='email']").value.trim();
        const cargo    = document.querySelector("input[placeholder='Ingrese cargo']").value.trim();
        const afp      = document.querySelectorAll("select")[0].value;
        const salud    = document.querySelectorAll("select")[1].value;

        if (!nombre || !rut || !direccion || !telefono || !correo || !cargo) {
            alert("Debe completar todos los campos obligatorios.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            alert("Debe ingresar un correo electrónico válido.");
            return;
        }

        if (afp === "Seleccione AFP") {
            alert("Debe seleccionar una AFP.");
            return;
        }

        if (salud === "Seleccione sistema") {
            alert("Debe seleccionar un sistema de salud.");
            return;
        }

        const ficha = {
            id: Date.now(),
            nombre,
            rut,
            direccion,
            telefono,
            correo,
            cargo,
            afp,
            salud
        };

        localStorage.setItem("fichaPersonal", JSON.stringify(ficha));

        alert(`Información guardada correctamente.\n\nTrabajador: ${nombre}\nRUT: ${rut}\nCargo: ${cargo}`);
    });
}

/*LICENCIAS MÉDICAS*/

function obtenerLicencias() {
    return JSON.parse(localStorage.getItem("licenciasMedicas")) || [];
}

function guardarLicencias(licencias) {
    localStorage.setItem("licenciasMedicas", JSON.stringify(licencias));
}

function calcularDiasLicencia(fechaInicio, fechaTermino) {
    const ini = new Date(fechaInicio);
    const ter = new Date(fechaTermino);
    const diff = ter - ini;
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function renderTablaLicencias(licencias) {
    const tabla = document.getElementById("tablaLicencias");
    if (!tabla) return;

    if (licencias.length === 0) {
        tabla.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No existen licencias registradas.</td></tr>`;
        return;
    }

    tabla.innerHTML = licencias.map(function(l) {
        return `
        <tr>
            <td>${l.nombre}</td>
            <td>${l.rut}</td>
            <td>${l.tipoLicencia}</td>
            <td>${l.centroMedico}</td>
            <td>${l.medico}</td>
            <td>${l.fechaInicio}</td>
            <td>${l.fechaTermino}</td>
            <td>${l.dias} días</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="eliminarLicencia(${l.id})">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </td>
        </tr>`;
    }).join("");
}

function eliminarLicencia(id) {
    if (!confirm("¿Está seguro de eliminar esta licencia?")) return;
    const licencias = obtenerLicencias().filter(l => l.id !== id);
    guardarLicencias(licencias);
    renderTablaLicencias(licencias);
}

function mostrarTablaLicencias() {
    renderTablaLicencias(obtenerLicencias());
}

const botonRegistrarLicencia = document.getElementById("registrarLicencia");
if (botonRegistrarLicencia) {
    botonRegistrarLicencia.addEventListener("click", function () {
        const nombre   = document.getElementById("licNombre").value.trim();
        const rut      = document.getElementById("licRut").value.trim();
        const tipo     = document.getElementById("licTipo").value;
        const centro   = document.getElementById("licCentro").value.trim();
        const fechaIni = document.getElementById("licFechaInicio").value;
        const fechaTer = document.getElementById("licFechaTermino").value;
        const medico   = document.getElementById("licMedico").value.trim();

        if (!nombre || !rut || !centro || !fechaIni || !fechaTer || !medico) {
            alert("Debe completar todos los campos obligatorios.");
            return;
        }

        if (!tipo) {
            alert("Debe seleccionar un tipo de licencia.");
            return;
        }

        if (new Date(fechaIni) > new Date(fechaTer)) {
            alert("La fecha de inicio no puede ser posterior a la fecha de término.");
            return;
        }

        const dias = calcularDiasLicencia(fechaIni, fechaTer);

        const licencia = {
            id: Date.now(),
            nombre, rut,
            tipoLicencia: tipo,
            centroMedico: centro,
            medico, fechaInicio: fechaIni,
            fechaTermino: fechaTer,
            dias
        };

        const licencias = obtenerLicencias();
        licencias.push(licencia);
        guardarLicencias(licencias);
        renderTablaLicencias(licencias);

        // Limpiar formulario
        document.getElementById("licNombre").value       = "";
        document.getElementById("licRut").value          = "";
        document.getElementById("licTipo").value         = "";
        document.getElementById("licCentro").value       = "";
        document.getElementById("licFechaInicio").value  = "";
        document.getElementById("licFechaTermino").value = "";
        document.getElementById("licMedico").value       = "";

        alert(`Licencia registrada correctamente.\n\nTrabajador: ${nombre}\nTipo: ${tipo}\nPeríodo: ${fechaIni} al ${fechaTer}\nDías: ${dias}`);
    });
}

const botonLimpiarLicencias = document.getElementById("limpiarLicencias");
if (botonLimpiarLicencias) {
    botonLimpiarLicencias.addEventListener("click", function () {
        if (!confirm("¿Está seguro de eliminar todos los registros de licencias?")) return;
        localStorage.removeItem("licenciasMedicas");
        mostrarTablaLicencias();
        alert("Todos los registros han sido eliminados.");
    });
}

mostrarTablaLicencias();

/*CONTROL DE ASISTENCIA*/

function obtenerRegistrosAsistencia() {
    return JSON.parse(localStorage.getItem("registrosAsistencia")) || [];
}

function guardarRegistrosAsistencia(registros) {
    localStorage.setItem("registrosAsistencia", JSON.stringify(registros));
}

function calcularHorasTrabajadas(entrada, salida) {
    if (!entrada || !salida) return 0;
    const [hE, mE] = entrada.split(":").map(Number);
    const [hS, mS] = salida.split(":").map(Number);
    const minutosEntrada = hE * 60 + mE;
    const minutosSalida  = hS * 60 + mS;
    const diff = minutosSalida - minutosEntrada;
    return diff > 0 ? parseFloat((diff / 60).toFixed(1)) : 0;
}

function esAtraso(horaEntrada, horaLimite) {
    if (!horaEntrada || !horaLimite) return false;
    const [hE, mE] = horaEntrada.split(":").map(Number);
    const [hL, mL] = horaLimite.split(":").map(Number);
    return (hE * 60 + mE) > (hL * 60 + mL);
}

function estadoBadge(ausente, atraso) {
    if (ausente === "Sí") return `<span class="badge bg-danger">Ausente</span>`;
    if (atraso   === "Sí") return `<span class="badge bg-warning text-dark">Atraso</span>`;
    return `<span class="badge bg-success">Presente</span>`;
}

function renderTablaAsistencia(registros) {
    const tabla = document.getElementById("tablaAsistencia");
    if (!tabla) return;

    if (registros.length === 0) {
        tabla.innerHTML = `<tr><td colspan="10" class="text-muted text-center">No hay registros de asistencia.</td></tr>`;
        return;
    }

    tabla.innerHTML = registros.map(function(r) {
        return `
        <tr>
            <td>${r.fecha}</td>
            <td>${r.nombre}</td>
            <td>${r.rut}</td>
            <td>${r.ausente === "Sí" ? "-" : (r.entrada || "-")}</td>
            <td>${r.ausente === "Sí" ? "-" : (r.salida  || "-")}</td>
            <td>${r.ausente === "Sí" ? "0 Horas" : r.horas + " Horas"}</td>
            <td>${r.atraso}</td>
            <td>${r.ausente}</td>
            <td>${estadoBadge(r.ausente, r.atraso)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="eliminarRegistroAsistencia(${r.id})">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </td>
        </tr>`;
    }).join("");
}

function eliminarRegistroAsistencia(id) {
    if (!confirm("¿Está seguro de eliminar este registro?")) return;
    let registros = obtenerRegistrosAsistencia().filter(r => r.id !== id);
    guardarRegistrosAsistencia(registros);
    renderTablaAsistencia(registros);
}

function mostrarTablaAsistencia() {
    const registros = obtenerRegistrosAsistencia();
    renderTablaAsistencia(registros);
}

const botonRegistrarAsistencia = document.getElementById("registrarAsistencia");
if (botonRegistrarAsistencia) {
    botonRegistrarAsistencia.addEventListener("click", function () {
        const nombre     = document.getElementById("asistNombre").value.trim();
        const rut        = document.getElementById("asistRut").value.trim();
        const fecha      = document.getElementById("asistFecha").value;
        const entrada    = document.getElementById("asistEntrada").value;
        const salida     = document.getElementById("asistSalida").value;
        const ausente    = document.getElementById("asistAusente").value;
        const horaLimite = document.getElementById("asistHoraLimite").value;

        if (!nombre || !rut || !fecha) {
            alert("Debe completar al menos Nombre, RUT y Fecha.");
            return;
        }

        if (ausente === "No" && (!entrada || !salida)) {
            alert("Debe ingresar hora de entrada y salida, o marcar al trabajador como Ausente.");
            return;
        }

        if (ausente === "No" && entrada && salida) {
            const [hE, mE] = entrada.split(":").map(Number);
            const [hS, mS] = salida.split(":").map(Number);
            if ((hS * 60 + mS) <= (hE * 60 + mE)) {
                alert("La hora de salida debe ser posterior a la hora de entrada.");
                return;
            }
        }

        const salidaFija = "17:30";
        const horas  = ausente === "Sí" ? 0 : calcularHorasTrabajadas(entrada, salidaFija);
        const atraso = ausente === "Sí" ? "No" : (esAtraso(entrada, horaLimite) ? "Sí" : "No");

        const registro = {
            id: Date.now(),
            nombre, rut, fecha,
            entrada: ausente === "Sí" ? "" : entrada,
            salida:  ausente === "Sí" ? "" : salidaFija,
            horas, atraso, ausente
        };

        const registros = obtenerRegistrosAsistencia();
        registros.push(registro);
        registros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        guardarRegistrosAsistencia(registros);
        renderTablaAsistencia(registros);

        // Limpiar formulario
        document.getElementById("asistNombre").value  = "";
        document.getElementById("asistRut").value     = "";
        document.getElementById("asistFecha").value   = "";
        document.getElementById("asistEntrada").value = "";
        document.getElementById("asistSalida").value  = "17:30";
        document.getElementById("asistAusente").value = "No";

        alert(`Asistencia registrada correctamente para ${nombre}.`);
    });
}

const botonLimpiarAsistencia = document.getElementById("limpiarAsistencia");
if (botonLimpiarAsistencia) {
    botonLimpiarAsistencia.addEventListener("click", function () {
        if (!confirm("¿Está seguro de eliminar TODOS los registros de asistencia?")) return;
        localStorage.removeItem("registrosAsistencia");
        mostrarTablaAsistencia();

// Forzar valor 17:30 en campo salida al cargar la página
const campoSalida = document.getElementById("asistSalida");
if (campoSalida) campoSalida.value = "17:30";
        alert("Todos los registros han sido eliminados.");
    });
}

const botonAplicarFiltro = document.getElementById("aplicarFiltro");
if (botonAplicarFiltro) {
    botonAplicarFiltro.addEventListener("click", function () {
        const nombre   = document.getElementById("filtroNombre").value.trim().toLowerCase();
        const fechaIni = document.getElementById("filtroFechaInicio").value;
        const fechaTer = document.getElementById("filtroFechaTermino").value;

        let registros = obtenerRegistrosAsistencia();

        if (nombre) {
            registros = registros.filter(r => r.nombre.toLowerCase().includes(nombre));
        }

        if (fechaIni) {
            registros = registros.filter(r => r.fecha >= fechaIni);
        }

        if (fechaTer) {
            registros = registros.filter(r => r.fecha <= fechaTer);
        }

        renderTablaAsistencia(registros);
    });
}

const botonLimpiarFiltro = document.getElementById("limpiarFiltro");
if (botonLimpiarFiltro) {
    botonLimpiarFiltro.addEventListener("click", function () {
        document.getElementById("filtroNombre").value       = "";
        document.getElementById("filtroFechaInicio").value  = "";
        document.getElementById("filtroFechaTermino").value = "";
        mostrarTablaAsistencia();

// Forzar valor 17:30 en campo salida al cargar la página
const campoSalida = document.getElementById("asistSalida");
if (campoSalida) campoSalida.value = "17:30";
    });
}

const botonImprimirAsistencia = document.getElementById("imprimirAsistencia");
if (botonImprimirAsistencia) {
    botonImprimirAsistencia.addEventListener("click", function () {
        const registros = obtenerRegistrosAsistencia();
        if (registros.length === 0) {
            alert("No hay registros para imprimir.");
            return;
        }
        window.print();
    });
}

mostrarTablaAsistencia();

// Forzar valor 17:30 en campo salida al cargar la página
const campoSalida = document.getElementById("asistSalida");
if (campoSalida) campoSalida.value = "17:30";

/*LIQUIDACIONES */

function cargarDatosLiquidaciones() {
    const ficha    = JSON.parse(localStorage.getItem("fichaPersonal"));
    const calculos = JSON.parse(localStorage.getItem("calculosParametricos")) || [];
    const ultimoCalculo = calculos.length > 0 ? calculos[calculos.length - 1] : null;

    const alertaSinDatos = document.getElementById("alertaSinDatos");

    if (!ficha && !ultimoCalculo) {
        if (alertaSinDatos) alertaSinDatos.classList.remove("d-none");
        return;
    }

    const nombre       = ficha ? ficha.nombre : "Sin nombre";
    const sueldoLiquido = ultimoCalculo ? ultimoCalculo.sueldoLiquido : 0;
    const formato      = (n) => `$${Math.round(n).toLocaleString("es-CL")}`;

    ["1", "2", "3"].forEach(function (n) {
        const elNombre  = document.getElementById("nombreLiq" + n);
        const elLiquido = document.getElementById("liquidoLiq" + n);
        if (elNombre)  elNombre.textContent  = nombre;
        if (elLiquido) elLiquido.textContent = formato(sueldoLiquido);
    });
}

function generarPDFLiquidacion(mes, anio) {
    const ficha    = JSON.parse(localStorage.getItem("fichaPersonal"));
    const calculos = JSON.parse(localStorage.getItem("calculosParametricos")) || [];
    const c        = calculos.length > 0 ? calculos[calculos.length - 1] : null;

    if (!ficha && !c) {
        alert("No hay datos guardados. Complete la Ficha Personal y el Cálculo Paramétrico primero.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const nombre       = ficha ? ficha.nombre       : "Sin datos";
    const rut          = ficha ? ficha.rut           : "-";
    const cargo        = ficha ? ficha.cargo         : "-";
    const afp          = ficha ? ficha.afp           : (c ? c.afp : "-");
    const salud        = ficha ? ficha.salud         : (c ? c.salud : "-");

    const sueldoBase    = c ? c.sueldoBase    : 0;
    const horasExtras   = c ? c.horasExtras   : 0;
    const bonos         = c ? c.bonos         : 0;
    const descuentos    = c ? c.descuentos    : 0;
    const colacion      = c ? c.colacion      : 0;
    const movilizacion  = c ? c.movilizacion  : 0;
    const sueldoLiquido = c ? c.sueldoLiquido : 0;

    const porcentajeAFP      = 0.1027;
    const porcentajeSalud    = 0.07;
    const porcentajeCesantia = 0.007;
    const valorHoraExtra     = (sueldoBase / 160) * 1.5;
    const totalHorasExtras   = valorHoraExtra * horasExtras;
    const baseImponible      = sueldoBase + totalHorasExtras + bonos;
    const descAFP            = baseImponible * porcentajeAFP;
    const descSalud          = baseImponible * porcentajeSalud;
    const descCesantia       = baseImponible * porcentajeCesantia;

    const fmt = (n) => `$${Math.round(n).toLocaleString("es-CL")}`;

    // ---- Encabezado ----
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SEGURIDAD LTDA", 14, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("RUT Empresa: 76.123.456-7  |  Giro: Servicios de Seguridad", 14, 20);
    doc.text(`Liquidacion de Sueldo - ${mes} ${anio}`, 140, 16);

    // ---- Datos trabajador ----
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL TRABAJADOR", 14, 38);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(14, 40, 196, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const col1x = 14, col2x = 110;
    doc.text(`Nombre:  ${nombre}`,       col1x, 48);
    doc.text(`RUT:     ${rut}`,          col1x, 55);
    doc.text(`Cargo:   ${cargo}`,        col1x, 62);
    doc.text(`AFP:     ${afp}`,          col2x, 48);
    doc.text(`Salud:   ${salud}`,        col2x, 55);
    doc.text(`Periodo: ${mes} ${anio}`,  col2x, 62);

    // ---- Haberes ----
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("HABERES", 14, 76);
    doc.line(14, 78, 196, 78);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const filaHaberes = [
        ["Sueldo Base",          fmt(sueldoBase)],
        ["Horas Extras",         fmt(totalHorasExtras)],
        ["Bonos",                fmt(bonos)],
        ["Asig. Colacion",       fmt(colacion)],
        ["Asig. Movilizacion",   fmt(movilizacion)],
        ["Base Imponible",       fmt(baseImponible)],
    ];

    let y = 86;
    filaHaberes.forEach(function([label, valor], i) {
        if (i % 2 === 0) doc.setFillColor(245, 245, 245);
        else             doc.setFillColor(255, 255, 255);
        doc.rect(14, y - 5, 182, 8, "F");
        doc.text(label, 16, y);
        doc.text(valor, 160, y, { align: "right" });
        y += 9;
    });

    // ---- Descuentos ----
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DESCUENTOS", 14, y);
    doc.line(14, y + 2, 196, y + 2);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const filaDescuentos = [
        [`AFP (${(porcentajeAFP * 100).toFixed(2)}%)`,  fmt(descAFP)],
        ["Salud (7%)",                                   fmt(descSalud)],
        ["Seguro Cesantia (0.7%)",                       fmt(descCesantia)],
        ["Otros Descuentos",                             fmt(descuentos)],
    ];

    filaDescuentos.forEach(function([label, valor], i) {
        if (i % 2 === 0) doc.setFillColor(255, 240, 240);
        else             doc.setFillColor(255, 255, 255);
        doc.rect(14, y - 5, 182, 8, "F");
        doc.text(label, 16, y);
        doc.text(valor, 160, y, { align: "right" });
        y += 9;
    });

    // ---- Sueldo líquido ----
    y += 6;
    doc.setFillColor(16, 185, 129);
    doc.rect(14, y - 6, 182, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SUELDO LIQUIDO A PAGAR", 16, y + 1);
    doc.text(fmt(sueldoLiquido), 194, y + 1, { align: "right" });

    
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Documento generado electronicamente por el Sistema de RRHH - Seguridad LTDA", 105, 285, { align: "center" });

    doc.save(`Liquidacion_${mes}_${anio}.pdf`);
}

const botonDesc1 = document.getElementById("descargarLiquidacion1");
const botonDesc2 = document.getElementById("descargarLiquidacion2");
const botonPendiente = document.getElementById("liquidacionPendiente");

if (botonDesc1) {
    botonDesc1.addEventListener("click", function () {
        generarPDFLiquidacion("Enero", "2026");
    });
}

if (botonDesc2) {
    botonDesc2.addEventListener("click", function () {
        generarPDFLiquidacion("Febrero", "2026");
    });
}

cargarDatosLiquidaciones();

/*CONSULTAS E INFORMES*/
const botonVerReportes = document.getElementById("verReportes");
const botonVerLiquidaciones = document.getElementById("verLiquidaciones");
const botonVerVacaciones = document.getElementById("verVacaciones");
const botonVerDocumentos = document.getElementById("verDocumentos");
const botonVerAsistencia = document.getElementById("verAsistencia");
const botonVerLicencias = document.getElementById("verLicencias");

if (botonVerReportes) {
    botonVerReportes.addEventListener("click", function () {
        const fichaGuardada = JSON.parse(localStorage.getItem("fichaPersonal"));
        const licencias     = JSON.parse(localStorage.getItem("licenciasMedicas")) || [];
        const anticipos     = JSON.parse(localStorage.getItem("solicitudesAnticipos")) || [];
        const vacaciones    = obtenerSolicitudes();

        let resumen = "===== REPORTE DEL PERSONAL =====\n\n";

        if (fichaGuardada) {
            resumen += `Trabajador registrado: ${fichaGuardada.nombre} (${fichaGuardada.rut})\n`;
            resumen += `Cargo: ${fichaGuardada.cargo}\n\n`;
        } else {
            resumen += "No hay ficha personal registrada.\n\n";
        }

        resumen += `Licencias médicas registradas: ${licencias.length}\n`;
        resumen += `Solicitudes de anticipo: ${anticipos.length}\n`;
        resumen += `Solicitudes de vacaciones: ${vacaciones.length}\n`;

        alert(resumen);
    });
}

if (botonVerLiquidaciones) {
    botonVerLiquidaciones.addEventListener("click", function () {
        window.location.href = "liquidaciones.html";
    });
}

if (botonVerVacaciones) {
    botonVerVacaciones.addEventListener("click", function () {
        window.location.href = "vacaciones.html";
    });
}

if (botonVerDocumentos) {
    botonVerDocumentos.addEventListener("click", function () {
        window.location.href = "contratoFiniquito.html";
    });
}

if (botonVerAsistencia) {
    botonVerAsistencia.addEventListener("click", function () {
        window.location.href = "controlAsistencia.html";
    });
}

if (botonVerLicencias) {
    botonVerLicencias.addEventListener("click", function () {
        window.location.href = "licenciasMedicas.html";
    });
}
