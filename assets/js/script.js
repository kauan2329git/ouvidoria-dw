$(document).ready(function() {
    "use strict";

    // Efeito de clique nos links da sidebar
    $('.nav-link-custom').on('click', function() {
        $('.nav-link-custom').removeClass('active');
        $(this).addClass('active');
    });

    // Simulação de Loading para troca de páginas (UX Sênior)
    window.fazerLogin = function(event) {
        event.preventDefault();
        const user = $('#user').val();
        const pass = $('#pass').val();

        if(user && pass) {
            // Usando SweetAlert2 do seu projeto original
            Swal.fire({
                title: 'Acessando Portal...',
                text: 'Prepare sua voz para a mudança.',
                timer: 1500,
                timerProgressBar: true,
                didOpen: () => { Swal.showLoading(); }
            }).then(() => {
                window.location.href = 'dashboard.html';
            });
        }
    };
});