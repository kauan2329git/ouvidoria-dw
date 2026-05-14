/**
 * OUVIDORIA DIGITAL — minhas-manifestacoes.js
 * Script externo da página minhas-manifestacoes.html
 *
 * BUGS CORRIGIDOS:
 *   [BUG-01/06] Navbar com links corretos (âncoras apontam para manifestacao.html)
 *   [BUG-05]    Navbar atualizada com nome do usuário logado
 *   [BUG-10]    Botão de logout injetado via JS (era #btnSair inexistente no HTML)
 *
 * SEM dependência de utils.js — todos os helpers são locais.
 */

$(function () {

  /* ── Helpers locais ─────────────────────────────────── */
  function toast(msg, type, ms) {
    ms = ms || 3500;
    var icons = {
      success: 'bi-check-circle-fill',
      error:   'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill'
    };
    var $t = $('<div class="dw-t t-' + type + '">' +
      '<i class="bi ' + icons[type] + ' ti"></i>' +
      '<span class="tm">' + msg + '</span>' +
      '<i class="bi bi-x tc"></i></div>');
    $('#toastWrap').append($t);
    $t.find('.tc').on('click', function () { $t.remove(); });
    setTimeout(function () { $t.fadeOut(300, function () { $t.remove(); }); }, ms);
  }

  function esc(s) { return $('<span>').text(s || '').html(); }

  function formatDate(d) {
    if (!d) return '—';
    var dt = new Date(d.replace(' ', 'T'));
    return dt.toLocaleDateString('pt-BR') + ' às ' +
      dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ── Tabelas de labels ──────────────────────────────── */
  var statusLabels = {
    pendente:   ['Pendente',   'sb-pendente',   'bi-hourglass-split'],
    em_analise: ['Em Análise', 'sb-em_analise', 'bi-search'],
    resolvido:  ['Resolvido',  'sb-resolvido',  'bi-check-circle-fill'],
    arquivado:  ['Arquivado',  'sb-arquivado',  'bi-archive']
  };
  var catLabels = {
    infraestrutura: 'Infraestrutura', ensino: 'Ensino', convivencia: 'Convivência',
    elogio: 'Elogio', sugestao: 'Sugestão', denuncia: 'Denúncia', outros: 'Outros'
  };
  var catIcons = {
    infraestrutura: 'bi-building', ensino: 'bi-book-half', convivencia: 'bi-people',
    elogio: 'bi-star', sugestao: 'bi-lightbulb', denuncia: 'bi-exclamation-triangle', outros: 'bi-three-dots'
  };
  var urgLabels = { normal: 'Normal', alta: 'Alta', urgente: 'Urgente' };
  var urgColors = { normal: 'var(--text-muted)', alta: 'var(--orange)', urgente: '#dc2626' };

  /* ── Estado ─────────────────────────────────────────── */
  var todasMf     = [];
  var filtroAtual = 'todos';

  /* ── Verifica login ─────────────────────────────────── */
  var usuario;
  try { usuario = JSON.parse(sessionStorage.getItem('dw_user')); } catch (e) { usuario = null; }

  // CORRIGIDO: return dentro do else — script para completamente se não logado
  if (!usuario || !usuario.id) {
    window.location.href = 'login.html';
    return; // impede qualquer linha abaixo de executar
  }

  /* ── Navbar ─────────────────────────────────────────── */
  var $btn = $('#navLoginBtn');
  $btn.html('<i class="bi bi-person-circle"></i> ' + esc((usuario.nome || '').split(' ')[0]))
      .attr('href', '#')
      .addClass('logado');

  // BUG-10: botão de logout injetado aqui — não existia no HTML original
  $btn.after(
    '<a id="navLogoutBtn" href="#" ' +
    'style="color:rgba(255,255,255,.55);font-size:.83rem;padding:7px 12px;border-radius:8px;text-decoration:none">' +
    '<i class="bi bi-box-arrow-right"></i> Sair</a>'
  );
  $('#navLogoutBtn').on('click', function (e) {
    e.preventDefault();
    sessionStorage.removeItem('dw_user');
    window.location.href = 'manifestacao.html';
  });

  /* ── Saudação ───────────────────────────────────────── */
  $('#userGreeting').text('Olá, ' + (usuario.nome || '').split(' ')[0] + '! Aqui estão todas as suas manifestações.');

  /* ── Hamburger ──────────────────────────────────────── */
  $('#navHamburger').on('click', function () {
    $('#navLinks').toggleClass('open');
    $(this).find('i').toggleClass('bi-list bi-x');
  });

  /* ── Filtros ────────────────────────────────────────── */
  $(document).on('click', '.filtro-btn', function () {
    $('.filtro-btn').removeClass('active');
    $(this).addClass('active');
    filtroAtual = $(this).data('filtro');
    renderLista();
  });

  /* ── Carregar manifestações ─────────────────────────── */
  function carregarMf() {
    $.ajax({
      url:      'api/auth.php',
      method:   'POST',
      data:     { action: 'minhas_manifestacoes', user_id: usuario.id },
      dataType: 'json',
      success: function (res) {
        if (!res || !res.sucesso) { mostrarErro(); return; }
        todasMf = res.manifestacoes || [];

        var total = todasMf.length;
        var pend  = todasMf.filter(function (m) { return m.status === 'pendente' || m.status === 'em_analise'; }).length;
        var resol = todasMf.filter(function (m) { return m.status === 'resolvido'; }).length;

        $('#statTotal').text(total);
        $('#statPend').text(pend);
        $('#statRes').text(resol);
        renderLista();
      },
      error: mostrarErro
    });
  }

  function mostrarErro() {
    $('#listaMf').html(
      '<div class="empty-state">' +
        '<i class="bi bi-wifi-off" style="color:var(--orange)"></i>' +
        '<h5>Erro de conexão</h5>' +
        '<p>Não foi possível carregar. <a href="#" onclick="carregarMf();return false;">Tentar novamente</a></p>' +
      '</div>'
    );
  }

  /* ── Renderizar lista ───────────────────────────────── */
  function renderLista() {
    var lista = filtroAtual === 'todos'
      ? todasMf
      : todasMf.filter(function (m) { return m.status === filtroAtual; });

    if (!lista.length) {
      var msgs = {
        todos:      ['bi-inbox',        'Nenhuma manifestação ainda', 'Você ainda não registrou nenhuma.'],
        pendente:   ['bi-hourglass',    'Nenhuma pendente',           'Não há manifestações pendentes.'],
        em_analise: ['bi-search',       'Nenhuma em análise',         'Não há manifestações em análise.'],
        resolvido:  ['bi-check-circle', 'Nenhuma resolvida',          'Nenhuma foi resolvida ainda.']
      };
      var msg = msgs[filtroAtual] || msgs['todos'];
      $('#listaMf').html(
        '<div class="empty-state">' +
          '<i class="bi ' + msg[0] + '"></i>' +
          '<h5>' + msg[1] + '</h5>' +
          '<p>' + msg[2] + '</p>' +
          (filtroAtual === 'todos'
            ? '<a href="manifestacao.html#registrar" class="btn-dw btn-dw-orange" style="margin-top:1rem;display:inline-flex">Nova Manifestação</a>'
            : '') +
        '</div>'
      );
      return;
    }

    var html = '';
    lista.forEach(function (m, idx) {
      var st   = statusLabels[m.status] || ['Desconhecido', 'sb-pendente', 'bi-question-circle'];
      var cat  = catLabels[m.categoria] || m.categoria;
      var catI = catIcons[m.categoria]  || 'bi-tag';
      var urg  = urgLabels[m.urgencia]  || m.urgencia;
      var urgC = urgColors[m.urgencia]  || 'var(--text-muted)';

      html +=
        '<div class="mf-card" id="mfc-' + idx + '">' +
          '<div class="mf-card-head" onclick="toggleCard(' + idx + ')">' +
            '<div class="mf-card-head-left">' +
              '<div class="mf-card-prot">' + esc(m.protocolo) + '</div>' +
              '<div class="mf-card-ass">'  + esc(m.assunto)   + '</div>' +
            '</div>' +
            '<div class="mf-card-meta">' +
              '<span class="cat-badge"><i class="bi ' + catI + '"></i>' + esc(cat) + '</span>' +
              '<span class="status-badge ' + st[1] + '"><i class="bi ' + st[2] + '"></i>' + st[0] + '</span>' +
            '</div>' +
            '<i class="bi bi-chevron-down mf-card-chevron"></i>' +
          '</div>' +
          '<div class="mf-card-body">' +
            '<div class="mf-row">' +
              '<span class="mf-label"><i class="bi bi-calendar3 me-1"></i>Registrado em</span>' +
              '<span class="mf-value">' + formatDate(m.criado_em) + '</span>' +
            '</div>' +
            '<div class="mf-row">' +
              '<span class="mf-label"><i class="bi bi-flag me-1"></i>Urgência</span>' +
              '<span class="mf-value" style="color:' + urgC + ';font-weight:600">' + esc(urg) + '</span>' +
            '</div>' +
            '<div class="mf-row">' +
              '<span class="mf-label"><i class="bi bi-eye me-1"></i>Sigilo</span>' +
              '<span class="mf-value">' + (m.sigilo === 'sim' ? '🔒 Sigiloso' : 'Público') + '</span>' +
            '</div>' +
            (m.resolvido_em
              ? '<div class="mf-row">' +
                  '<span class="mf-label"><i class="bi bi-check-circle me-1"></i>Resolvido em</span>' +
                  '<span class="mf-value" style="color:var(--green)">' + formatDate(m.resolvido_em) + '</span>' +
                '</div>'
              : '') +
            '<div class="mf-desc-box">' +
              '<div class="mf-desc-label">Descrição</div>' +
              esc(m.descricao).replace(/\n/g, '<br>') +
            '</div>' +
            (m.resposta
              ? '<div class="resp-box">' +
                  '<div class="resp-label"><i class="bi bi-reply-fill me-1"></i>Resposta da Ouvidoria</div>' +
                  '<p>' + esc(m.resposta).replace(/\n/g, '<br>') + '</p>' +
                '</div>'
              : '<div style="margin-top:.6rem;padding:.7rem 1rem;background:#fffbf5;border-radius:10px;' +
                'border:1.5px dashed rgba(244,121,32,.25);font-size:.8rem;color:var(--text-muted);text-align:center">' +
                '<i class="bi bi-hourglass-split me-1" style="color:var(--orange)"></i>Aguardando resposta da equipe</div>'
            ) +
            '<button class="btn-prot-share" onclick="compartilhar(\'' + esc(m.protocolo) + '\')">' +
              '<i class="bi bi-share"></i> Compartilhar protocolo' +
            '</button>' +
          '</div>' +
        '</div>';
    });

    $('#listaMf').html(html);
  }

  /* ── Funções globais chamadas pelo HTML gerado ────── */
  window.toggleCard = function (idx) {
    $('#mfc-' + idx).toggleClass('open');
  };

  window.compartilhar = function (prot) {
    var url = window.location.origin +
      window.location.pathname.replace('minhas-manifestacoes.html', '') +
      'consulta.html?p=' + encodeURIComponent(prot);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { toast('Link copiado!', 'success'); });
    } else {
      toast('Link: ' + url, 'warning', 6000);
    }
  };

  /* ── Init ───────────────────────────────────────────── */
  carregarMf();

});
