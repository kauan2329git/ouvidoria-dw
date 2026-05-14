/**
 * OUVIDORIA DIGITAL — consulta.js
 * Consulta pública de protocolo.
 * SEM dependência de utils.js
 */

$(function(){

  /* ── Helpers locais ─────────────────────────────── */
  function toast(msg, type, ms) {
    ms = ms || 3500;
    var icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', warning:'bi-exclamation-triangle-fill' };
    var $t = $('<div class="dw-t t-'+type+'"><i class="bi '+icons[type]+' ti"></i><span class="tm">'+msg+'</span><i class="bi bi-x tc"></i></div>');
    $('#toastWrap').append($t);
    $t.find('.tc').on('click', function(){ $t.remove(); });
    setTimeout(function(){ $t.fadeOut(300, function(){ $t.remove(); }); }, ms);
  }

  function formatDate(d) {
    if (!d) return '—';
    var dt = new Date(d.replace(' ','T'));
    return dt.toLocaleDateString('pt-BR') + ' às ' + dt.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
  }

  /* ── Labels ─────────────────────────────────────── */
  var statusLabels = {
    pendente:   ['Pendente',   'sb-pendente'],
    em_analise: ['Em Análise', 'sb-em_analise'],
    resolvido:  ['Resolvido',  'sb-resolvido'],
    arquivado:  ['Arquivado',  'sb-arquivado']
  };
  var statusIcons = {
    pendente:   'bi-hourglass-split',
    em_analise: 'bi-search',
    resolvido:  'bi-check-circle-fill',
    arquivado:  'bi-archive'
  };
  var catLabels = {
    infraestrutura:'Infraestrutura', ensino:'Ensino', convivencia:'Convivência',
    elogio:'Elogio', sugestao:'Sugestão', denuncia:'Denúncia', outros:'Outros'
  };
  var urgLabels = { normal:'Normal', alta:'Alta', urgente:'Urgente' };

  /* ── Navbar: atualiza se logado ─────────────────── */
  (function(){
    try {
      var u = JSON.parse(sessionStorage.getItem('dw_user'));
      if (u && u.nome) {
        $('#navLoginBtn')
          .html('<i class="bi bi-person-circle me-1"></i>' + $('<span>').text(u.nome.split(' ')[0]).html())
          .attr('href','minhas-manifestacoes.html')
          .css({background:'rgba(255,255,255,.12)',color:'#fff',border:'1.5px solid rgba(255,255,255,.2)'});

        $('#navLoginBtn').after(
          '<a id="navLogoutBtn" href="#" '+
          'style="color:rgba(255,255,255,.55);font-size:.83rem;padding:7px 12px;border-radius:8px;text-decoration:none">'+
          '<i class="bi bi-box-arrow-right"></i> Sair</a>'
        );
        $('#navLogoutBtn').on('click', function(e){
          e.preventDefault();
          sessionStorage.removeItem('dw_user');
          window.location.href = 'manifestacao.html';
        });
      }
    } catch(e){}
  })();

  /* ── Hamburger ──────────────────────────────────── */
  $('#navHamburger').on('click', function(){
    $('#navLinks').toggleClass('open');
    $(this).find('i').toggleClass('bi-list bi-x');
  });

  /* ── Scroll navbar ──────────────────────────────── */
  $(window).on('scroll', function(){
    $('.home-nav').toggleClass('scrolled', $(this).scrollTop() > 40);
  });

  /* ── Busca ──────────────────────────────────────── */
  function buscar() {
    var prot = $('#inpProtocolo').val().trim();
    if (!prot) { toast('Digite o número do protocolo.', 'warning'); return; }

    var $btn = $('#btnBuscar');
    $btn.addClass('loading');
    $('#resultado').hide();
    $('#buscandoLoader').show();

    $.ajax({
      url: 'api/auth.php', method: 'POST',
      data: { action: 'consultar_protocolo', protocolo: prot },
      dataType: 'json',
      success: function(res) {
        $btn.removeClass('loading');
        $('#buscandoLoader').hide();
        if (!res || !res.sucesso) {
          toast(res.mensagem || 'Protocolo não encontrado.', 'error');
          return;
        }
        renderResultado(res.manifestacao);
      },
      error: function() {
        $btn.removeClass('loading');
        $('#buscandoLoader').hide();
        toast('Erro de conexão. Tente novamente.', 'error');
      }
    });
  }

  function renderResultado(m) {
    var st   = statusLabels[m.status] || ['Desconhecido','sb-pendente'];
    var icon = statusIcons[m.status]  || 'bi-question-circle';

    $('#resProt').text(m.protocolo);
    $('#resCriado').text('Registrado em ' + formatDate(m.criado_em));
    $('#resStatus').attr('class','status-badge '+st[1]).html('<i class="bi '+icon+'"></i> '+st[0]);
    $('#resCat').text(catLabels[m.categoria] || m.categoria);
    $('#resUrg').text(urgLabels[m.urgencia]  || m.urgencia);
    $('#resAss').text(m.assunto);

    if (m.resolvido_em) {
      $('#resResolvidoRow').show();
      $('#resResolvido').text(formatDate(m.resolvido_em));
    } else {
      $('#resResolvidoRow').hide();
    }

    if (m.resposta) {
      $('#resRespostaWrap').html(
        '<div class="resposta-box">'+
          '<div class="resp-label"><i class="bi bi-reply-fill me-1"></i>Resposta da Ouvidoria</div>'+
          '<p>'+$('<span>').text(m.resposta).html().replace(/\n/g,'<br>')+'</p>'+
        '</div>'
      );
    } else {
      $('#resRespostaWrap').html(
        '<div class="no-resp-box">'+
          '<i class="bi bi-hourglass-split" style="color:var(--orange);font-size:1.3rem;display:block;margin-bottom:.4rem"></i>'+
          '<strong>Aguardando resposta</strong><br>'+
          '<span>A equipe está analisando sua manifestação. Volte em breve.</span>'+
        '</div>'
      );
    }

    $('#resultado').fadeIn(300);
    $('html,body').animate({ scrollTop: $('#resultado').offset().top - 120 }, 400);
  }

  /* ── Eventos ────────────────────────────────────── */
  $('#btnBuscar').on('click', buscar);
  $('#inpProtocolo').on('keydown', function(e){ if (e.key === 'Enter') buscar(); });

  $('#inpProtocolo').on('input', function(){
    var v = $(this).val().toUpperCase().replace(/[^A-Z0-9\-#]/g,'');
    if (v && !v.startsWith('#')) v = '#' + v;
    $(this).val(v);
  });

  // Protocolo via URL (?p=...)
  (function(){
    var p = new URLSearchParams(window.location.search).get('p');
    if (p) {
      $('#inpProtocolo').val(decodeURIComponent(p).toUpperCase());
      buscar();
    }
  })();

});
