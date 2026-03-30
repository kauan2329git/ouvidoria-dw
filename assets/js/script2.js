$(document).ready(function() {
    "use strict";

    // Abrir Modal Anônimo via Botão Principal
    $('#btnAnonimoOpen').on('click', function() {
        $('#modalAnonimo').modal('show');
    });

    // Envio do Formulário via AJAX (Simulado)
    $('#formAnonimoAjax').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $btn = $form.find('button[type="submit"]');
        const originalText = $btn.html();

        // 1. Feedback de Carregamento
        $btn.html('<i class="fa-solid fa-circle-notch fa-spin me-2"></i> Validando Dados...').attr('disabled', true);

        // 2. Chamada AJAX (Simulada com Timeout)
        setTimeout(() => {
            // Gerar protocolo aleatório
            const protocolo = "DW-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
            
            // 3. Esconder Modal
            $('#modalAnonimo').modal('hide');

            // 4. Mostrar Feedback de Sucesso Animado (Não é Alert!)
            $('#protocolId').text("#" + protocolo);
            $('#successOverlay').removeClass('d-none').addClass('d-flex');

            // 5. Resetar botão e formulário
            $btn.html(originalText).attr('disabled', false);
            $form[0].reset();
        }, 2000);
    });
});

// Função Global para fechar o overlay de sucesso
function closeSuccess() {
    $('#successOverlay').fadeOut(400, function() {
        $(this).addClass('d-none').css('display', '');
    });
}