$(document).ready(function() {
    // Abrir Modal (ID corrigido para bater com o HTML)
    $('#btnAnonimoOpen').on('click', function() {
        $('#modalAnonimo').modal('show');
    });

    // Controle Sidebar Mobile
    $('#openSidebar').on('click', function() {
        $('#mainSidebar').addClass('show');
        $('#overlay').addClass('show');
    });

    $('#closeSidebar, #overlay').on('click', function() {
        $('#mainSidebar').removeClass('show');
        $('#overlay').removeClass('show');
    });

    // Envio do Formulário com SweetAlert2
    $('#formAnonimoAjax').on('submit', function(e) {
        e.preventDefault();
        const $btn = $(this).find('button');
        $btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Enviando...').prop('disabled', true);

        setTimeout(() => {
            $('#modalAnonimo').modal('hide');
            Swal.fire({
                title: 'Sucesso!',
                text: 'Sua manifestação foi enviada. Protocolo: #DW-' + Math.floor(Math.random() * 9999),
                icon: 'success',
                confirmButtonColor: '#008542'
            });
            $btn.html('Enviar Agora').prop('disabled', false);
            this.reset();
        }, 1500);
    });
});

function fazerLogin(event) {
            event.preventDefault();
            const user = document.getElementById('user').value;
            const pass = document.getElementById('pass').value;

            if (user && pass) {
                Swal.fire({
                    title: 'Autenticando...',
                    text: 'Aguarde enquanto validamos seus dados.',
                    allowOutsideClick: false,
                    didOpen: () => { Swal.showLoading(); }
                });
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        }