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
    if (fechaInicio.value && fechaTermino.value) {
        const inicio = convertirFecha(fechaInicio.value);
        const termino = convertirFecha(fechaTermino.value);

        const diferencia = termino - inicio;
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24)) + 1;

        const diaInicio = inicio.getDate();
        const mesInicio = meses[inicio.getMonth()];

        resumenVacaciones.value = `Desde el ${diaInicio} de ${mesInicio}, son ${dias} días de vacaciones.`;
        return dias;
    }

    return 0;
}

fechaInicio.addEventListener("change", calcularDias);
fechaTermino.addEventListener("change", calcularDias);

botonGuardar.addEventListener("click", function () {
    const estado = "Pendiente";
    const dias = calcularDias();

    if (fechaInicio.value === "" || fechaTermino.value === "" || dias <= 0) {
        alert("Debe completar correctamente las fechas de vacaciones.");
        return;
    }

    const inicio = convertirFecha(fechaInicio.value);
    const termino = convertirFecha(fechaTermino.value);

    tablaVacaciones.innerHTML = `
        <tr>
            <td>${inicio.getFullYear()}</td>
            <td>${fechaInicio.value}</td>
            <td>${fechaTermino.value}</td>
            <td>${dias}</td>
            <td>
                <span class="badge bg-warning text-dark">${estado}</span>
            </td>
        </tr>
    `;

    alert("La solicitud fue guardada y se envió un correo a Recursos Humanos para autorizar las vacaciones.");
});