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
const botonRegistrarLicencia = document.getElementById("registrarLicencia");

if (botonRegistrarLicencia) {
    botonRegistrarLicencia.addEventListener("click", function () {
        const nombre       = document.querySelectorAll("input[type='text']")[0].value.trim();
        const rut          = document.querySelectorAll("input[type='text']")[1].value.trim();
        const tipoLicencia = document.querySelectorAll("select")[0].value;
        const estado       = document.querySelectorAll("select")[1].value;
        const fechaIni     = document.querySelectorAll("input[type='date']")[0].value;
        const fechaTer     = document.querySelectorAll("input[type='date']")[1].value;
        const centroMedico = document.querySelectorAll("input[type='text']")[2].value.trim();
        const medico       = document.querySelectorAll("input[type='text']")[3].value.trim();

        if (!nombre || !rut || !fechaIni || !fechaTer || !centroMedico || !medico) {
            alert("Debe completar todos los campos obligatorios.");
            return;
        }

        if (tipoLicencia === "Seleccione tipo") {
            alert("Debe seleccionar un tipo de licencia.");
            return;
        }

        if (estado === "Seleccione estado") {
            alert("Debe seleccionar un estado para la licencia.");
            return;
        }

        if (new Date(fechaIni) > new Date(fechaTer)) {
            alert("La fecha de inicio no puede ser posterior a la fecha de término.");
            return;
        }

        const licencia = {
            id: Date.now(),
            nombre,
            rut,
            tipoLicencia,
            estado,
            fechaInicio: fechaIni,
            fechaTermino: fechaTer,
            centroMedico,
            medico
        };

        const licencias = JSON.parse(localStorage.getItem("licenciasMedicas")) || [];
        licencias.push(licencia);
        localStorage.setItem("licenciasMedicas", JSON.stringify(licencias));

        alert(
            `Licencia registrada correctamente.\n\n` +
            `Trabajador: ${nombre}\n` +
            `Tipo: ${tipoLicencia}\n` +
            `Estado: ${estado}\n` +
            `Período: ${fechaIni} al ${fechaTer}\n` +
            `Centro Médico: ${centroMedico}`
        );
    });
}

/*CONTROL DE ASISTENCIA*/
const botonImprimirAsistencia = document.getElementById("imprimirAsistencia");

if (botonImprimirAsistencia) {
    botonImprimirAsistencia.addEventListener("click", function () {
        const nombre    = document.querySelector("input[placeholder='Ingrese nombre']").value.trim();
        const fechaIni  = document.querySelectorAll("input[type='date']")[0].value;
        const fechaTer  = document.querySelectorAll("input[type='date']")[1].value;

        if (!nombre) {
            alert("Debe ingresar el nombre del trabajador antes de imprimir.");
            return;
        }

        if (fechaIni && fechaTer && new Date(fechaIni) > new Date(fechaTer)) {
            alert("La fecha de inicio no puede ser posterior a la fecha de término.");
            return;
        }

        window.print();
    });
}

/*LIQUIDACIONES*/
const botonDesc1 = document.getElementById("descargarLiquidacion1");
const botonDesc2 = document.getElementById("descargarLiquidacion2");
const botonPendiente = document.getElementById("liquidacionPendiente");

function simularDescarga(mes, anio) {
    alert(`Descargando liquidación de ${mes} ${anio}...\n\nEn un sistema real, aquí se generaría el PDF de la liquidación.`);
}

if (botonDesc1) {
    botonDesc1.addEventListener("click", function () {
        simularDescarga("Enero", "2026");
    });
}

if (botonDesc2) {
    botonDesc2.addEventListener("click", function () {
        simularDescarga("Febrero", "2026");
    });
}

if (botonPendiente) {
    botonPendiente.addEventListener("click", function () {
        alert("La liquidación de Marzo 2026 aún no está disponible. Por favor, intente más tarde.");
    });
}

/*CONSULTAS E INFORMES*/
const botonVerReportes = document.getElementById("verReportes");

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
