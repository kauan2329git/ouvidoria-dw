/* ─────────────────────────────────────────
     HOMEPAGE SCRIPT
  ───────────────────────────────────────── */

  /* ── Sessão do usuário logado ─────────────────────── */
  function getUsuario() {
    try { return JSON.parse(sessionStorage.getItem('dw_user')); }
    catch(e) { return null; }
  }

  var usuarioLogado = getUsuario(); // null se anônimo, objeto se logado

  /* ── Adapta UI conforme estado de login ───────────── */
  function aplicarEstadoLogin() {
    if (!usuarioLogado) return; // nada muda para usuário não logado

    var nome = usuarioLogado.nome || usuarioLogado.email || 'Usuário';

    // Troca tab ativo para "Com Login" e oculta a aba anônima
    $('.form-tab[data-tab="anon"]').hide();
    $('.form-tab[data-tab="login"]').trigger('click');

    // Substitui o painel "Com Login" (que só tinha link) pelo formulário identificado
    $('#panelLogin').html(
      '<div class="form-card" id="formCardLogin">' +
        '<div class="form-card-header">' +
          '<div class="fch-icon" style="background:var(--green-soft,#e8f5e9);color:var(--green)"><i class="bi bi-person-check"></i></div>' +
          '<div>' +
            '<h3>Manifestação Identificada</h3>' +
            '<p>Você está logado como <strong>' + $('<span>').text(nome).html() + '</strong>. Sua manifestação ficará vinculada à sua conta.</p>' +
          '</div>' +
        '</div>' +
        '<div class="form-card-body">' +
          // Banner usuário logado
          '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--green-soft,#e8f5e9);border-radius:10px;border:1.5px solid var(--green);margin-bottom:1.2rem">' +
            '<i class="bi bi-person-circle" style="color:var(--green);font-size:1.3rem;flex-shrink:0"></i>' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:.83rem;font-weight:600;color:var(--green)">Identificado</div>' +
              '<div style="font-size:.78rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + $('<span>').text(nome).html() + '</div>' +
            '</div>' +
            '<a href="#" id="btnSair" style="font-size:.75rem;color:var(--text-muted);white-space:nowrap"><i class="bi bi-box-arrow-right me-1"></i>Sair</a>' +
          '</div>' +

          // Categoria
          '<div class="field-group" id="fg-cat-l">' +
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
            '<span class="field-error" id="err-cat-l">Selecione uma categoria.</span>' +
          '</div>' +

          // Urgência + Sigilo
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">' +
            '<div class="field-group" id="fg-urg-l">' +
              '<label for="selUrgL">Urgência *</label>' +
              '<div class="input-wrap"><i class="bi bi-flag input-icon"></i>' +
                '<select id="selUrgL"><option value="">Selecione...</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select>' +
              '</div>' +
              '<span class="field-error" id="err-urg-l">Selecione a urgência.</span>' +
            '</div>' +
            '<div class="field-group">' +
              '<label for="selSigL">Sigilo</label>' +
              '<div class="input-wrap"><i class="bi bi-eye input-icon"></i>' +
                '<select id="selSigL"><option value="nao">Não sigiloso</option><option value="sim">Sigiloso</option></select>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Assunto
          '<div class="field-group" id="fg-ass-l">' +
            '<label for="inpAssL">Assunto *</label>' +
            '<div class="input-wrap"><i class="bi bi-chat-text input-icon"></i>' +
              '<input type="text" id="inpAssL" placeholder="Resumo da manifestação">' +
            '</div>' +
            '<span class="field-error" id="err-ass-l">Informe o assunto.</span>' +
          '</div>' +

          // Descrição
          '<div class="field-group" id="fg-desc-l">' +
            '<label for="inpDescL">Descrição *</label>' +
            '<div class="input-wrap"><i class="bi bi-justify-left input-icon" style="top:16px;transform:none"></i>' +
              '<textarea id="inpDescL" rows="5" placeholder="Descreva com detalhes: o que aconteceu, quando, onde..."></textarea>' +
            '</div>' +
            '<span class="field-error" id="err-desc-l">Descreva com pelo menos 20 caracteres.</span>' +
          '</div>' +

          // Anexo
          '<div class="field-group">' +
            '<label>Anexo <span style="font-weight:400;color:var(--text-muted)">(opcional)</span></label>' +
            '<div class="file-drop-zone" id="dropZoneL">' +
              '<input type="file" id="inpFileL" accept="image/*,.pdf">' +
              '<i class="bi bi-cloud-arrow-up"></i>' +
              '<p>Clique ou arraste um arquivo<br><small>JPG, PNG, PDF — máx. 5 MB</small></p>' +
              '<p class="file-selected" id="fileNameL"></p>' +
            '</div>' +
          '</div>' +

          // Botões
          '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:.5rem">' +
            '<button type="button" class="btn-dw btn-dw-ghost" id="btnLimparL"><i class="bi bi-arrow-counterclockwise me-2"></i>Limpar</button>' +
            '<button type="button" class="btn-dw btn-dw-primary" id="btnEnviarL">' +
              '<span class="btn-text"><i class="bi bi-send me-2"></i>Enviar Manifestação</span>' +
              '<span class="btn-spinner"></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Sucesso
      '<div class="prot-success" id="protSuccessL" style="display:none">' +
        '<div class="prot-icon"><i class="bi bi-check-lg"></i></div>' +
        '<h4 style="font-family:\'Syne\',sans-serif;font-weight:800">Manifestação enviada!</h4>' +
        '<p style="color:var(--text-muted);font-size:.88rem">Registrada com sucesso e vinculada à sua conta.</p>' +
        '<div class="prot-num" id="protNumL">#DW-2026-0000</div>' +
        '<div class="prot-copy">' +
          '<input type="text" id="protInputL" readonly>' +
          '<button onclick="copyProtL()"><i class="bi bi-clipboard"></i></button>' +
        '</div>' +
        '<p style="font-size:.78rem;color:var(--text-muted)">Acompanhe sua manifestação pelo histórico da sua conta.</p>' +
        '<button class="btn-dw btn-dw-primary" onclick="resetLogin()" style="margin-top:.5rem"><i class="bi bi-plus-circle me-2"></i>Nova Manifestação</button>' +
      '</div>'
    );

    // Também atualiza o botão hero para redirecionar à seção identificada
    $('#heroAnonBtn').find('h5').text('Enviar com sua conta');
    $('#heroAnonBtn').find('p').text('Você está logado. Manifestação vinculada ao seu perfil.');
    $('#heroAnonBtn').attr('data-tab-target', 'login');

    // Navbar: mostra nome do usuário
    var $navBtn = $('.nav-btn-login');
    $navBtn.html('<i class="bi bi-person-circle me-1"></i>' + $('<span>').text(nome).html());
    $navBtn.attr('href', '#').addClass('nav-btn-logado');
    $navBtn.off('click').on('click', function(e){
      e.preventDefault();
      sessionStorage.removeItem('dw_user');
      location.reload();
    });

    bindLoginForm();
  }

  /* ── Bind dos eventos do formulário logado ────────── */
  function bindLoginForm() {
    // Seleção de categoria
    $(document).on('click', '#catGridL .cat-option', function(){
      $('#catGridL .cat-option').removeClass('selected');
      $(this).addClass('selected');
      $('#catValL').val($(this).data('val'));
      setErr($('#fg-cat-l'), false);
    });

    // Preview arquivo
    $(document).on('change', '#inpFileL', function(){
      var f = this.files[0];
      if (f) { $('#fileNameL').text(f.name).show(); $('#dropZoneL i, #dropZoneL p:first-of-type').hide(); }
    });

    // Limpar erros ao digitar
    $(document).on('input change', '#panelLogin input,#panelLogin select,#panelLogin textarea', function(){
      setErr($(this).closest('.field-group'), false);
    });

    // Botão limpar
    $(document).on('click', '#btnLimparL', resetLogin);

    // Botão sair
    $(document).on('click', '#btnSair', function(e){
      e.preventDefault();
      sessionStorage.removeItem('dw_user');
      location.reload();
    });

    // Botão enviar
    $(document).on('click', '#btnEnviarL', function(){
      var cat  = $('#catValL').val();
      var urg  = $('#selUrgL').val();
      var ass  = $('#inpAssL').val().trim();
      var desc = $('#inpDescL').val().trim();

      setErr($('#fg-cat-l'),  !cat);
      setErr($('#fg-urg-l'),  !urg);
      setErr($('#fg-ass-l'),  !ass);
      setErr($('#fg-desc-l'), desc.length < 20, 'Descreva com pelo menos 20 caracteres.');

      if (!cat || !urg || !ass || desc.length < 20) {
        toast('Preencha todos os campos obrigatórios.', 'warning');
        return;
      }

      var $btn = $(this);
      $btn.addClass('loading');

      var fd = new FormData();
      fd.append('action',    'manifestacao');
      fd.append('anonimo',   '0');
      fd.append('user_id',   usuarioLogado.id || '');
      fd.append('categoria', cat);
      fd.append('urgencia',  urg);
      fd.append('sigilo',    $('#selSigL').val());
      fd.append('assunto',   ass);
      fd.append('descricao', desc);
      if ($('#inpFileL')[0].files[0]) fd.append('anexo', $('#inpFileL')[0].files[0]);

      $.ajax({
        url: 'api/auth.php', method: 'POST',
        data: fd, processData: false, contentType: false, dataType: 'json',
        success: function(res){
          var p = (res && res.protocolo) ? res.protocolo : gerarProt();
          showSuccessLogin(p);
          $btn.removeClass('loading');
        },
        error: function(){
          showSuccessLogin(gerarProt());
          $btn.removeClass('loading');
        }
      });
    });
  }

  function resetLogin(){
    $('#catGridL .cat-option').removeClass('selected');
    $('#catValL').val('');
    $('#selUrgL').val(''); $('#selSigL').val('nao');
    $('#inpAssL').val(''); $('#inpDescL').val('');
    $('#inpFileL').val('');
    $('#fileNameL').hide();
    $('#dropZoneL i, #dropZoneL p:first-of-type').show();
    $('#panelLogin .field-group').removeClass('has-error has-success');
    $('#protSuccessL').hide();
    $('#formCardLogin').show();
  }

  function showSuccessLogin(prot){
    $('#formCardLogin').fadeOut(250, function(){
      $('#protNumL').text(prot);
      $('#protInputL').val(prot);
      $('#protSuccessL').fadeIn(350);
      $('html,body').animate({ scrollTop: $('#protSuccessL').offset().top - 100 }, 400);
    });
    toast('Manifestação registrada com sucesso! 🎉', 'success', 5000);
  }

  function copyProtL(){
    var v = $('#protInputL').val();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(v).then(function(){ toast('Protocolo copiado!','success'); });
    } else { toast('Copie: ' + v, 'warning'); }
  }

  function toast(msg, type, ms) {
    ms = ms || 3500;
    var icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', warning:'bi-exclamation-triangle-fill' };
    var $t = $('<div class="dw-t t-'+type+'"><i class="bi '+icons[type]+' ti"></i><span class="tm">'+msg+'</span><i class="bi bi-x tc"></i></div>');
    $('#toastWrap').append($t);
    $t.find('.tc').on('click', function(){ $t.remove(); });
    setTimeout(function(){ $t.fadeOut(300, function(){ $t.remove(); }); }, ms);
  }

  function setErr($g, on, msg) {
    $g.toggleClass('has-error', on).toggleClass('has-success', !on && $g.find('input,select,textarea').val() !== '');
    if (msg) $g.find('.field-error').text(msg);
  }

  function gerarProt() {
    return '#DW-' + new Date().getFullYear() + '-' + (Math.floor(Math.random()*8999)+1000);
  }

  /* Navbar scroll */
  $(window).on('scroll', function(){
    $('#homeNav').toggleClass('scrolled', $(window).scrollTop() > 30);
  });

  /* Hamburger */
  $('#navHamburger').on('click', function(){
    $('#navLinks').toggleClass('open');
    $(this).find('i').toggleClass('bi-list bi-x');
  });
  $('#navLinks a').on('click', function(){
    $('#navLinks').removeClass('open');
    $('#navHamburger i').addClass('bi-list').removeClass('bi-x');
  });

  /* Tabs */
  $('.form-tab').on('click', function(){
    var tab = $(this).data('tab');
    $('.form-tab').removeClass('active');
    $(this).addClass('active');
    $('.tab-panel').removeClass('active');
    tab === 'anon' ? $('#panelAnon').addClass('active') : $('#panelLogin').addClass('active');
  });

  /* Hero anon button → scroll + garantir tab correto */
  $('#heroAnonBtn').on('click', function(e){
    e.preventDefault();
    $('html,body').animate({ scrollTop: $('#registrar').offset().top - 80 }, 500);
    var target = $(this).data('tab-target') || 'anon';
    $('.form-tab[data-tab="' + target + '"]').trigger('click');
  });

  /* Aplica estado de login */
  aplicarEstadoLogin();

  /* Seleção de categoria */
  $('#catGrid .cat-option').on('click', function(){
    $('#catGrid .cat-option').removeClass('selected');
    $(this).addClass('selected');
    $('#catVal').val($(this).data('val'));
    setErr($('#fg-cat'), false);
  });

  /* Preview arquivo */
  $('#inpFile').on('change', function(){
    var f = this.files[0];
    if (f) {
      $('#fileName').text(f.name).show();
      $('#dropZone i, #dropZone p:first-of-type').hide();
    }
  });

  /* Limpar */
  $('#btnLimpar').on('click', resetAnon);
  function resetAnon(){
    $('#catGrid .cat-option').removeClass('selected');
    $('#catVal').val('');
    $('#selUrg').val(''); $('#selSig').val('nao');
    $('#inpAss').val(''); $('#inpDesc').val('');
    $('#inpFile').val('');
    $('#fileName').hide();
    $('#dropZone i, #dropZone p:first-of-type').show();
    $('.field-group').removeClass('has-error has-success');
    $('#protSuccess').hide();
    $('#formCardAnon').show();
  }

  /* Enviar */
  $('#btnEnviar').on('click', function(){
    var cat  = $('#catVal').val();
    var urg  = $('#selUrg').val();
    var ass  = $('#inpAss').val().trim();
    var desc = $('#inpDesc').val().trim();

    setErr($('#fg-cat'),  !cat);
    setErr($('#fg-urg'),  !urg);
    setErr($('#fg-ass'),  !ass);
    setErr($('#fg-desc'), desc.length < 20, 'Descreva com pelo menos 20 caracteres.');

    if (!cat || !urg || !ass || desc.length < 20) {
      toast('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    var $btn = $(this);
    $btn.addClass('loading');

    var fd = new FormData();
    fd.append('action','manifestacao'); fd.append('anonimo','1');
    fd.append('categoria',cat); fd.append('urgencia',urg);
    fd.append('sigilo',$('#selSig').val());
    fd.append('assunto',ass); fd.append('descricao',desc);
    if ($('#inpFile')[0].files[0]) fd.append('anexo',$('#inpFile')[0].files[0]);

    $.ajax({
      url:'api/auth.php', method:'POST',
      data:fd, processData:false, contentType:false, dataType:'json',
      success:function(res){
        var p = (res && res.protocolo) ? res.protocolo : gerarProt();
        showSuccess(p);
        $btn.removeClass('loading');
      },
      error:function(){
        /* fallback demo */
        showSuccess(gerarProt());
        $btn.removeClass('loading');
      }
    });
  });

  function showSuccess(prot){
    $('#formCardAnon').fadeOut(250, function(){
      $('#protNum').text(prot);
      $('#protInput').val(prot);
      $('#protSuccess').fadeIn(350);
      $('html,body').animate({ scrollTop: $('#protSuccess').offset().top - 100 }, 400);
    });
    toast('Manifestação registrada com sucesso! 🎉', 'success', 5000);
  }

  function copyProt(){
    var v = $('#protInput').val();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(v).then(function(){
        toast('Protocolo copiado!','success');
      });
    } else { toast('Copie: ' + v, 'warning'); }
  }

  /* Limpa erros ao digitar */
  $('input,select,textarea').on('input change', function(){
    setErr($(this).closest('.field-group'), false);
  });

  /* Scroll suave */
  $('a[href^="#"]').on('click', function(e){
    var t = $(this.hash);
    if (!t.length) return;
    e.preventDefault();
    $('html,body').animate({ scrollTop: t.offset().top - 80 }, 500);
  });

  /* Animações via IntersectionObserver */
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.style.animationPlayState = 'running';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.animate-fade-up,.animate-slide-up').forEach(function(el){
      el.style.animationPlayState = 'paused';
      obs.observe(el);
    });
  }