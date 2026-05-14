/**
 * OUVIDORIA DIGITAL — manifestacao.js
 * Mapeado exatamente aos IDs do manifestacao.html
 */

$(function () {

  /* ── Helpers ──────────────────────────────────────── */
  function toast(msg, type, ms) {
    ms = ms || 3500;
    var icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', warning:'bi-exclamation-triangle-fill' };
    var $t = $('<div class="dw-t t-'+type+'"><i class="bi '+icons[type]+' ti"></i><span class="tm">'+msg+'</span><i class="bi bi-x tc"></i></div>');
    $('#toastWrap').append($t);
    $t.find('.tc').on('click', function(){ $t.remove(); });
    setTimeout(function(){ $t.fadeOut(300, function(){ $t.remove(); }); }, ms);
  }

  function esc(s) { return $('<span>').text(s || '').html(); }

  function setFieldError(fgId, errId, show) {
    if (show) {
      $('#'+fgId).addClass('has-error');
      $('#'+errId).show();
    } else {
      $('#'+fgId).removeClass('has-error');
      $('#'+errId).hide();
    }
  }

  /* ── Sessão ───────────────────────────────────────── */
  var usuario;
  try { usuario = JSON.parse(sessionStorage.getItem('dw_user')); } catch(e) { usuario = null; }

  /* ── Navbar ───────────────────────────────────────── */
  if (usuario && usuario.nome) {
    $('#navLoginBtn')
      .html('<i class="bi bi-person-circle me-1"></i>' + esc(usuario.nome.split(' ')[0]))
      .attr('href', '#registrar')
      .css({ background:'rgba(255,255,255,.12)', color:'#fff', border:'1.5px solid rgba(255,255,255,.2)' });

    if (!$('#navLogoutBtn').length) {
      $('#navLoginBtn').after(
        '<a id="navLogoutBtn" href="#" '+
        'style="color:rgba(255,255,255,.55);font-size:.83rem;padding:7px 12px;border-radius:8px;text-decoration:none">'+
        '<i class="bi bi-box-arrow-right"></i> Sair</a>'
      );
      $('#navLogoutBtn').on('click', function(e){
        e.preventDefault();
        sessionStorage.removeItem('dw_user');
        window.location.reload();
      });
    }

    // Se logado, muda o tab "Com Login" para mostrar form
    $('#tabLogin').text('Com Login ✓');
  }

  /* ── Stats públicas ───────────────────────────────── */
  $.ajax({
    url: 'api/auth.php', method: 'POST',
    data: { action: 'stats_publicas' },
    dataType: 'json',
    success: function(res) {
      if (!res || !res.sucesso) return;
      if (res.total      != null) $('#heroTotal').text(res.total);
      if (res.resolvidas != null) $('#heroPct').text(
        Math.round((res.resolvidas / Math.max(res.total, 1)) * 100) + '%'
      );
    }
  });

  /* ── Navbar scroll ────────────────────────────────── */
  $(window).on('scroll', function(){
    $('.home-nav').toggleClass('scrolled', $(this).scrollTop() > 40);
  });

  /* ── Hamburger ────────────────────────────────────── */
  $('#navHamburger').on('click', function(){
    $('#navLinks').toggleClass('open');
    $(this).find('i').toggleClass('bi-list bi-x');
  });

  /* ── Tabs Anônimo / Com Login ─────────────────────── */
  $('.form-tab').on('click', function(){
    $('.form-tab').removeClass('active');
    $(this).addClass('active');
    var tab = $(this).data('tab');
    $('.tab-panel').removeClass('active');
    // O HTML usa id="panelAnon" e id="panelLogin"
    if (tab === 'anon')  $('#panelAnon').addClass('active');
    if (tab === 'login') $('#panelLogin').addClass('active');
  });

  /* ── Categorias — HTML usa data-val ──────────────── */
  // (não data-cat como estava no JS anterior)
  $('#catGrid').on('click', '.cat-option', function(){
    $('#catGrid .cat-option').removeClass('selected');
    $(this).addClass('selected');
    $('#catVal').val($(this).data('val'));  // data-val é o atributo correto do HTML
    setFieldError('fg-cat', 'err-cat', false);
  });

  /* ── Arquivo: preview nome ────────────────────────── */
  $('#inpFile').on('change', function(){
    var name = this.files[0] ? this.files[0].name : '';
    $('#fileName').text(name).toggle(!!name);
  });

  /* ── Limpar form ──────────────────────────────────── */
  $('#btnLimpar').on('click', function(){
    $('#catGrid .cat-option').removeClass('selected');
    $('#catVal').val('');
    $('#selUrg').val('');
    $('#selSig').val('nao');
    $('#inpAss').val('');
    $('#inpDesc').val('');
    $('#inpFile').val('');
    $('#fileName').text('').hide();
    $('#fg-cat, #fg-urg, #fg-ass, #fg-desc').removeClass('has-error');
    $('#err-cat, #err-urg, #err-ass, #err-desc').hide();
  });

  /* ── Limpar erros ao digitar ──────────────────────── */
  $('#selUrg').on('change',  function(){ setFieldError('fg-urg',  'err-urg',  false); });
  $('#inpAss').on('input',   function(){ setFieldError('fg-ass',  'err-ass',  false); });
  $('#inpDesc').on('input',  function(){ setFieldError('fg-desc', 'err-desc', false); });

  /* ════════════════════════════════════════════════════
     ENVIO ANÔNIMO — botão #btnEnviar
  ════════════════════════════════════════════════════ */
  $('#btnEnviar').on('click', function(){
    var categoria = $('#catVal').val();
    var urgencia  = $('#selUrg').val();
    var sigilo    = $('#selSig').val() || 'nao';
    var assunto   = $('#inpAss').val().trim();
    var descricao = $('#inpDesc').val().trim();

    // Validação
    var ok = true;
    if (!categoria) { setFieldError('fg-cat',  'err-cat',  true); ok = false; }
    if (!urgencia)  { setFieldError('fg-urg',  'err-urg',  true); ok = false; }
    if (!assunto)   { setFieldError('fg-ass',  'err-ass',  true); ok = false; }
    if (descricao.length < 20) { setFieldError('fg-desc', 'err-desc', true); ok = false; }
    if (!ok) return;

    var $btn = $(this);
    $btn.addClass('loading');

    var fd = new FormData();
    fd.append('action',    'manifestacao');
    fd.append('anonimo',   '1');
    fd.append('categoria', categoria);
    fd.append('urgencia',  urgencia);
    fd.append('sigilo',    sigilo);
    fd.append('assunto',   assunto);
    fd.append('descricao', descricao);

    var file = $('#inpFile')[0].files[0];
    if (file) fd.append('anexo', file);

    $.ajax({
      url: 'api/auth.php', type: 'POST',
      data: fd, processData: false, contentType: false,
      dataType: 'json',
      success: function(res) {
        $btn.removeClass('loading');
        if (res.sucesso) {
          mostrarSucessoAnon(res.protocolo);
        } else {
          toast(res.mensagem || 'Erro ao enviar. Tente novamente.', 'error');
        }
      },
      error: function() {
        $btn.removeClass('loading');
        toast('Erro de conexão com o servidor.', 'error');
      }
    });
  });

  /* ── Tela de sucesso anônimo ──────────────────────── */
  function mostrarSucessoAnon(protocolo) {
    $('#formCardAnon').hide();
    $('#protNum').text(protocolo);
    $('#protInput').val(protocolo);
    $('#protSuccess').show();
  }

  /* Copiar protocolo — chamado pelo onclick do HTML */
  window.copyProt = function() {
    var prot = $('#protInput').val();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(prot).then(function(){
        toast('Protocolo copiado!', 'success');
      });
    } else {
      $('#protInput').select();
      document.execCommand('copy');
      toast('Protocolo copiado!', 'success');
    }
  };

  /* Nova manifestação — chamado pelo onclick do HTML */
  window.resetAnon = function() {
    $('#formCardAnon').show();
    $('#protSuccess').hide();
    $('#btnLimpar').trigger('click');
  };

  /* ════════════════════════════════════════════════════
     TAB COM LOGIN — renderiza form se já logado,
     caso contrário mostra botões de login/cadastro
  ════════════════════════════════════════════════════ */
  if (usuario && usuario.id) {
    // Substitui o conteúdo do panelLogin pelo formulário logado
    $('#panelLogin').html(
      '<div class="form-card" id="formCardLogado">' +
        '<div class="form-card-header">' +
          '<div class="fch-icon" style="background:var(--green-soft,#d1fae5);color:var(--green)"><i class="bi bi-person-check"></i></div>' +
          '<div>' +
            '<h3>Nova Manifestação</h3>' +
            '<p>Enviando como <strong>'+esc(usuario.nome)+'</strong></p>' +
          '</div>' +
        '</div>' +
        '<div class="form-card-body">' +

          '<div class="field-group" id="fg-catL">' +
            '<label>Categoria *</label>' +
            '<div class="category-grid" id="catGridL">' +
              '<div class="cat-option" data-val="infraestrutura"><i class="bi bi-building"></i><span>Infraestrutura</span></div>' +
              '<div class="cat-option" data-val="ensino"><i class="bi bi-book-half"></i><span>Ensino</span></div>' +
              '<div class="cat-option" data-val="convivencia"><i class="bi bi-people"></i><span>Convivência</span></div>' +
              '<div class="cat-option" data-val="elogio"><i class="bi bi-star"></i><span>Elogio</span></div>' +
              '<div class="cat-option" data-val="sugestao"><i class="bi bi-lightbulb"></i><span>Sugestão</span></div>' +
              '<div class="cat-option" data-val="denuncia"><i class="bi bi-exclamation-triangle"></i><span>Denúncia</span></div>' +
            '</div>' +
            '<input type="hidden" id="catValL">' +
            '<span class="field-error" id="err-catL" style="display:none">Selecione uma categoria.</span>' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
            '<div class="field-group" id="fg-urgL">' +
              '<label>Urgência *</label>' +
              '<div class="input-wrap"><i class="bi bi-flag input-icon"></i>' +
                '<select id="selUrgL"><option value="">Selecione...</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select>' +
              '</div>' +
              '<span class="field-error" id="err-urgL" style="display:none">Selecione a urgência.</span>' +
            '</div>' +
            '<div class="field-group">' +
              '<label>Sigilo</label>' +
              '<div class="input-wrap"><i class="bi bi-eye input-icon"></i>' +
                '<select id="selSigL"><option value="nao">Não sigiloso</option><option value="sim">Sigiloso</option></select>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="field-group" id="fg-assL">' +
            '<label>Assunto *</label>' +
            '<div class="input-wrap"><i class="bi bi-chat-text input-icon"></i>' +
              '<input type="text" id="inpAssL" placeholder="Resumo da manifestação">' +
            '</div>' +
            '<span class="field-error" id="err-assL" style="display:none">Informe o assunto.</span>' +
          '</div>' +

          '<div class="field-group" id="fg-descL">' +
            '<label>Descrição *</label>' +
            '<div class="input-wrap"><i class="bi bi-justify-left input-icon" style="top:16px;transform:none"></i>' +
              '<textarea id="inpDescL" rows="5" placeholder="Descreva com detalhes: o que aconteceu, quando, onde..."></textarea>' +
            '</div>' +
            '<span class="field-error" id="err-descL" style="display:none">Descreva com pelo menos 20 caracteres.</span>' +
          '</div>' +

          '<div class="field-group">' +
            '<label>Anexo <span style="font-weight:400;color:var(--text-muted)">(opcional)</span></label>' +
            '<div class="file-drop-zone">' +
              '<input type="file" id="inpFileL" accept="image/*,.pdf">' +
              '<i class="bi bi-cloud-arrow-up"></i>' +
              '<p>Clique ou arraste um arquivo<br><small>JPG, PNG, PDF — máx. 5 MB</small></p>' +
              '<p class="file-selected" id="fileNameL"></p>' +
            '</div>' +
          '</div>' +

          '<div style="display:flex;justify-content:flex-end;margin-top:.5rem">' +
            '<button type="button" class="btn-dw btn-dw-orange" id="btnEnviarL">' +
              '<span class="btn-text"><i class="bi bi-send me-2"></i>Enviar Manifestação</span>' +
              '<span class="btn-spinner"></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="prot-success" id="protSuccessL" style="display:none"></div>'
    );

    /* Categoria logado */
    $('#catGridL').on('click', '.cat-option', function(){
      $('#catGridL .cat-option').removeClass('selected');
      $(this).addClass('selected');
      $('#catValL').val($(this).data('val'));
      $('#fg-catL').removeClass('has-error');
      $('#err-catL').hide();
    });

    /* Preview arquivo logado */
    $('#inpFileL').on('change', function(){
      var name = this.files[0] ? this.files[0].name : '';
      $('#fileNameL').text(name).toggle(!!name);
    });

    /* Limpar erros ao digitar */
    $('#selUrgL').on('change', function(){ $('#fg-urgL').removeClass('has-error'); $('#err-urgL').hide(); });
    $('#inpAssL').on('input',  function(){ $('#fg-assL').removeClass('has-error'); $('#err-assL').hide(); });
    $('#inpDescL').on('input', function(){ $('#fg-descL').removeClass('has-error'); $('#err-descL').hide(); });

    /* ── Envio logado ──────────────────────────────── */
    $('#panelLogin').on('click', '#btnEnviarL', function(){
      var categoria = $('#catValL').val();
      var urgencia  = $('#selUrgL').val();
      var sigilo    = $('#selSigL').val() || 'nao';
      var assunto   = $('#inpAssL').val().trim();
      var descricao = $('#inpDescL').val().trim();

      var ok = true;
      if (!categoria)            { $('#fg-catL').addClass('has-error');  $('#err-catL').show();  ok = false; }
      if (!urgencia)             { $('#fg-urgL').addClass('has-error');  $('#err-urgL').show();  ok = false; }
      if (!assunto)              { $('#fg-assL').addClass('has-error');  $('#err-assL').show();  ok = false; }
      if (descricao.length < 20) { $('#fg-descL').addClass('has-error'); $('#err-descL').show(); ok = false; }
      if (!ok) return;

      var $btn = $(this);
      $btn.addClass('loading');

      var fd = new FormData();
      fd.append('action',    'manifestacao');
      fd.append('anonimo',   '0');
      fd.append('user_id',   usuario.id);
      fd.append('categoria', categoria);
      fd.append('urgencia',  urgencia);
      fd.append('sigilo',    sigilo);
      fd.append('assunto',   assunto);
      fd.append('descricao', descricao);

      var file = $('#inpFileL')[0].files[0];
      if (file) fd.append('anexo', file);

      $.ajax({
        url: 'api/auth.php', type: 'POST',
        data: fd, processData: false, contentType: false,
        dataType: 'json',
        success: function(res) {
          $btn.removeClass('loading');
          if (res.sucesso) {
            $('#formCardLogado').hide();
            $('#protSuccessL').html(
              '<div class="prot-icon"><i class="bi bi-check-lg"></i></div>' +
              '<h4 style="font-family:\'Syne\',sans-serif;font-weight:800">Manifestação enviada!</h4>' +
              '<p style="color:var(--text-muted);font-size:.88rem">Registrada com sucesso. Guarde seu protocolo.</p>' +
              '<div class="prot-num">'+esc(res.protocolo)+'</div>' +
              '<div class="prot-copy">' +
                '<input type="text" id="protInputL" value="'+esc(res.protocolo)+'" readonly>' +
                '<button onclick="navigator.clipboard.writeText(\''+esc(res.protocolo)+'\').then(function(){ })"><i class="bi bi-clipboard"></i></button>' +
              '</div>' +
              '<a href="minhas-manifestacoes.html" class="btn-dw btn-dw-orange" style="margin-top:.5rem;display:inline-flex">' +
                '<i class="bi bi-collection me-2"></i>Ver Minhas Manifestações' +
              '</a>'
            ).show();
          } else {
            toast(res.mensagem || 'Erro ao enviar. Tente novamente.', 'error');
          }
        },
        error: function() {
          $btn.removeClass('loading');
          toast('Erro de conexão com o servidor.', 'error');
        }
      });
    });

    // Clica na aba "Com Login" automaticamente pois está logado
    $('[data-tab="login"]').trigger('click');
  }

});
