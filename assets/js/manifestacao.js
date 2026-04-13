  /* ─────────────────────────────────────────
     HOMEPAGE SCRIPT
  ───────────────────────────────────────── */

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

  /* Hero anon button → scroll + garantir tab anon */
  $('#heroAnonBtn').on('click', function(e){
    e.preventDefault();
    $('html,body').animate({ scrollTop: $('#registrar').offset().top - 80 }, 500);
    $('.form-tab[data-tab="anon"]').trigger('click');
  });

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