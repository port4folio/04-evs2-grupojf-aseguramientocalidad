const boton = document.querySelectorAll('.btn');

boton.forEach(function(boton) {
    boton.addEventListener('click', function() {
        alert('¡Bienvenido al Sistema de Recursos Humanos!');
    });
});

