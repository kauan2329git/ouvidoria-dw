/**
 * OUVIDORIA DIGITAL — EEEP Dom Walfrido Teixeira Vieira
 * script2.js — Módulo principal
 *
 * Estrutura:
 *   DW.toast()         → notificações
 *   DW.loginPage()     → lógica da tela de login
 *   DW.cadastroPage()  → lógica do cadastro multi-step
 *   DW.manifestacaoPage() → lógica do formulário pós-login
 *   DW.copiarProtocolo() / DW.novaManifestacao()
 *
 * INTEGRAÇÃO PHP:
 *   Todos os $.ajax apontam para api/auth.php
 *   Troque a URL ou action conforme seu backend.
 */

const DW = (() => {

  /* ══════════════════════════════════════════════════════════
     UTILIDADES INTERNAS
  ══════════════════════════════════════════════════════════ */

  /** Exibe um toast flutuante */
  function toast(msg, type = 'success', duration = 3500) {
    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill' };
    const $t = $(`
      <div class="dw-toast toast-${type}">
        <i class="bi ${icons[type] || icons.success} toast-icon"></i>
        <span class="toast-msg">${msg}</span>
        <i class="bi bi-x toast-close"></i>
      </div>
    `);
    $('#toastContainer').append($t);
    $t.find('.toast-close').on('click', () => $t.remove());
    setTimeout(() => $t.fadeOut(300, () => $t.remove()), duration);
  }

  /** Valida e-mail */
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /** Formata CPF enquanto digita */
  function maskCPF(v) {
    return v.replace(/\D/g,'')
      .replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
      .slice(0,14);
  }

  /** Aplica/remove estado de erro num field-group */
  function setError($group, show, msg) {
    $group.toggleClass('has-error', show).toggleClass('has-success', !show && $group.find('input,select,textarea').val() !== '');
    if (msg) $group.find('.field-error').text(msg);
  }

  /** Coloca o botão em estado loading */
  function btnLoad($btn, on) {
    $btn.toggleClass('loading', on);
  }

  /** Gera número de protocolo */
  function gerarProtocolo() {
    const num = String(Math.floor(Math.random() * 9000) + 1000);
    return `#DW-${new Date().getFullYear()}-${num}`;
  }

  /** Salva sessão simples no sessionStorage */
  function salvarSessao(usuario) {
    sessionStorage.setItem('dw_user', JSON.stringify(usuario));
  }

  function carregarSessao() {
    try { return JSON.parse(sessionStorage.getItem('dw_user')); }
    catch(e) { return null; }
  }

  function limparSessao() {
    sessionStorage.removeItem('dw_user');
  }

  /* ══════════════════════════════════════════════════════════
     FORÇA DA SENHA
  ══════════════════════════════════════════════════════════ */
  function calcForcaSenha(s) {
    let score = 0;
    if (s.length >= 8)  score++;
    if (s.length >= 12) score++;
    if (/[A-Z]/.test(s) && /[a-z]/.test(s)) score++;
    if (/\d/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    return Math.min(4, score);
  }

  function atualizarForcaSenha(val) {
    const score = calcForcaSenha(val);
    const classes = ['', 'filled-weak', 'filled-weak', 'filled-medium', 'filled-strong'];
    const labels  = ['Digite sua senha', 'Muito fraca', 'Fraca', 'Média', 'Forte 💪'];
    for (let i = 1; i <= 4; i++) {
      const $bar = $(`#sb${i}`);
      $bar.removeClass('filled-weak filled-medium filled-strong');
      if (i <= score) $bar.addClass(classes[score]);
    }
    $('#sbLabel').text(val ? labels[score] : 'Digite sua senha');
  }

  /* ══════════════════════════════════════════════════════════
     LOGIN PAGE
  ══════════════════════════════════════════════════════════ */
  function loginPage() {

    /* Toggle olho */
    $('#toggleSenha').on('click', function() {
      const $inp = $('#inputSenha');
      const isPass = $inp.attr('type') === 'password';
      $inp.attr('type', isPass ? 'text' : 'password');
      $(this).toggleClass('bi-eye bi-eye-slash');
    });

    /* Submit */
    $('#formLogin').on('submit', function(e) {
      e.preventDefault();
      const email = $('#inputEmail').val().trim();
      const senha = $('#inputSenha').val();
      let ok = true;

      setError($('#fgEmail'), !isEmail(email));
      setError($('#fgSenha'), !senha);
      if (!isEmail(email) || !senha) return;

      const $btn = $('#btnEntrar');
      btnLoad($btn, true);

      /* ── AJAX → api/auth.php ── */
      $.ajax({
        url: 'api/auth.php',
        method: 'POST',
        dataType: 'json',
        data: { action: 'login', email, senha },
        success(res) {
          if (res.sucesso) {
            salvarSessao(res.usuario);
            toast('Login realizado! Redirecionando...', 'success');
            setTimeout(() => { window.location.href = 'manifestacao.html'; }, 1200);
          } else if (res.nao_encontrado) {
            /* Usuário não existe → redireciona para cadastro passando o e-mail */
            toast('E-mail não encontrado. Criando sua conta...', 'warning', 2500);
            setTimeout(() => {
              window.location.href = `cadastro.html?email=${encodeURIComponent(email)}`;
            }, 1800);
          } else {
            toast(res.mensagem || 'Senha incorreta. Tente novamente.', 'error');
            setError($('#fgSenha'), true, res.mensagem || 'Senha incorreta.');
            btnLoad($btn, false);
          }
        },
        error() {
          toast('Erro de conexão. Verifique o servidor.', 'error');
          btnLoad($btn, false);
        }
      });
    });

    /* Limpa erro ao digitar */
    $('#inputEmail').on('input', () => setError($('#fgEmail'), false));
    $('#inputSenha').on('input', () => setError($('#fgSenha'), false));
  }

  /* ══════════════════════════════════════════════════════════
     CADASTRO PAGE  (multi-step)
  ══════════════════════════════════════════════════════════ */
  function cadastroPage() {
    let stepAtual = 1;
    const dados = {};

    /* Pré-preenche e-mail se veio da URL */
    const params = new URLSearchParams(window.location.search);
    if (params.get('email')) $('#inputEmail').val(params.get('email'));

    /* Máscara CPF */
    $('#inputCpf').on('input', function() {
      $(this).val(maskCPF($(this).val()));
    });

    /* Força da senha */
    $('#inputSenha').on('input', function() {
      atualizarForcaSenha($(this).val());
      setError($('#fgSenha'), false);
    });

    /* Toggle olhos */
    $('#toggleSenha1').on('click', function() {
      const $i = $('#inputSenha');
      $i.attr('type', $i.attr('type') === 'password' ? 'text' : 'password');
      $(this).toggleClass('bi-eye bi-eye-slash');
    });
    $('#toggleSenha2').on('click', function() {
      const $i = $('#inputConfirma');
      $i.attr('type', $i.attr('type') === 'password' ? 'text' : 'password');
      $(this).toggleClass('bi-eye bi-eye-slash');
    });

    /* ── Helpers de step ── */
    function irPara(n) {
      $(`#step${stepAtual}`).removeClass('active');
      $(`#dot${stepAtual}`).removeClass('active').addClass('done');
      if (n > stepAtual) $(`#line${Math.min(stepAtual,2)}`).addClass('done');
      stepAtual = n;
      $(`#step${n}`).addClass('active');
      $(`#dot${n}`).removeClass('done').addClass('active');
    }

    function voltarPara(n) {
      $(`#step${stepAtual}`).removeClass('active');
      $(`#dot${stepAtual}`).removeClass('active done');
      stepAtual = n;
      $(`#step${n}`).addClass('active');
      $(`#dot${n}`).removeClass('done').addClass('active');
    }

    /* ── STEP 1: Validar dados pessoais ── */
    $('#btnStep1').on('click', function() {
      const nome  = $('#inputNome').val().trim();
      const email = $('#inputEmail').val().trim();
      const tipo  = $('#inputTipo').val();
      let ok = true;

      setError($('#fgNome'),  nome.split(' ').length < 2, 'Informe nome e sobrenome.');
      setError($('#fgEmail'), !isEmail(email));
      setError($('#fgTipo'),  !tipo);

      if (nome.split(' ').length < 2 || !isEmail(email) || !tipo) return;

      dados.nome  = nome;
      dados.email = email;
      dados.cpf   = $('#inputCpf').val().trim();
      dados.tipo  = tipo;

      irPara(2);
    });

    $('#btnBackStep1').on('click', () => voltarPara(1));

    /* ── STEP 2: Validar senha ── */
    $('#btnStep2').on('click', function() {
      const senha    = $('#inputSenha').val();
      const confirma = $('#inputConfirma').val();

      setError($('#fgSenha'),   senha.length < 8);
      setError($('#fgConfirma'), senha !== confirma, 'As senhas não coincidem.');

      if (senha.length < 8 || senha !== confirma) return;

      dados.senha = senha;
      preencherReview();
      irPara(3);
    });

    $('#btnBackStep2').on('click', () => voltarPara(2));

    function preencherReview() {
      const tipoMap = { aluno:'Aluno(a)', professor:'Professor(a)', servidor:'Servidor(a)', responsavel:'Responsável', comunidade:'Comunidade' };
      const linhas = [
        { label: 'Nome', val: dados.nome },
        { label: 'E-mail', val: dados.email },
        { label: 'CPF', val: dados.cpf || '—' },
        { label: 'Tipo', val: tipoMap[dados.tipo] || dados.tipo },
        { label: 'Senha', val: '••••••••' },
      ];
      $('#reviewContent').html(linhas.map(l => `
        <div style="display:flex;justify-content:space-between;gap:1rem;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="color:var(--text-muted);font-size:.82rem">${l.label}</span>
          <span style="font-weight:600;font-size:.82rem;text-align:right">${l.val}</span>
        </div>
      `).join(''));
    }

    /* ── STEP 3: Enviar cadastro ── */
    $('#formCadastro').on('submit', function(e) {
      e.preventDefault();
      if (!$('#checkTermos').prop('checked')) {
        setError($('#checkTermos').closest('.field-group'), true);
        $('<span class="field-error" style="display:block" id="errTermos">Você precisa aceitar os termos.</span>').insertAfter('#checkTermos').parent();
        return;
      }

      const $btn = $('#btnCadastrar');
      btnLoad($btn, true);

      /* ── AJAX → api/auth.php ── */
      $.ajax({
        url: 'api/auth.php',
        method: 'POST',
        dataType: 'json',
        data: {
          action: 'cadastrar',
          nome:   dados.nome,
          email:  dados.email,
          cpf:    dados.cpf,
          tipo:   dados.tipo,
          senha:  dados.senha   /* O PHP faz o hash — NUNCA armazene sem hash! */
        },
        success(res) {
          if (res.sucesso) {
            salvarSessao(res.usuario);
            toast('Conta criada com sucesso! Bem-vindo(a) 🎉', 'success');
            setTimeout(() => { window.location.href = 'manifestacao.html'; }, 1500);
          } else {
            toast(res.mensagem || 'Erro ao criar conta.', 'error');
            if (res.email_duplicado) {
              voltarPara(1);
              setError($('#fgEmail'), true, 'Este e-mail já está cadastrado.');
            }
            btnLoad($btn, false);
          }
        },
        error() {
          toast('Erro de conexão. Verifique o servidor.', 'error');
          btnLoad($btn, false);
        }
      });
    });

    /* Limpa erros ao digitar */
    $('input, select').on('input change', function() {
      setError($(this).closest('.field-group'), false);
    });
  }

  /* ══════════════════════════════════════════════════════════
     MANIFESTAÇÃO PAGE
  ══════════════════════════════════════════════════════════ */
  function manifestacaoPage() {

    /* ── Verificar sessão ── */
    const user = carregarSessao();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    /* Preenche dados do usuário na UI */
    const firstName = (user.nome || '').split(' ')[0];
    $('#welcomeName').text(firstName);
    $('#userDisplayName').text(user.nome || '—');
    $('#userDisplayEmail').text(user.email || '—');
    $('#userAvatarLetter').text((user.nome || 'U')[0].toUpperCase());

    /* Carregar stats do usuário */
    $.ajax({
      url: 'api/auth.php',
      method: 'POST',
      dataType: 'json',
      data: { action: 'stats', user_id: user.id },
      success(res) {
        if (res.sucesso) {
          animarContador('#statTotal',     res.total     || 0);
          animarContador('#statPendentes', res.pendentes || 0);
          animarContador('#statResolvidas',res.resolvidas|| 0);
        }
      },
      error() {} // silencioso — stats não críticos
    });

    /* ── Sidebar mobile ── */
    $('#openSidebar').on('click', () => {
      $('#sidebar').addClass('open');
      $('#sidebarOverlay').addClass('show');
    });
    $('#closeSidebar, #sidebarOverlay').on('click', () => {
      $('#sidebar').removeClass('open');
      $('#sidebarOverlay').removeClass('show');
    });

    /* ── Logout ── */
    $('#btnLogout').on('click', () => {
      limparSessao();
      window.location.href = 'login.html';
    });

    /* ── Toggle anônimo ── */
    $('#switchAnonimo').on('change', function() {
      $('#anonRow').toggleClass('active-anon', this.checked);
    });

    /* ── Seleção de categoria ── */
    $('#categoryGrid .cat-option').on('click', function() {
      $('#categoryGrid .cat-option').removeClass('selected');
      $(this).addClass('selected');
      $('#inputCategoria').val($(this).data('value'));
      setError($('#fgCategoria'), false);
    });

    /* ── Preview de arquivo ── */
    $('#inputAnexo').on('change', function() {
      const f = this.files[0];
      if (f) {
        $('#fileSelected').text(f.name).show();
        $('#fileDropZone i, #fileDropZone p:first-of-type').hide();
      }
    });

    /* ── Limpar formulário ── */
    $('#btnLimpar').on('click', () => {
      $('#categoryGrid .cat-option').removeClass('selected');
      $('#inputCategoria').val('');
      $('#inputUrgencia, #inputSigilo').val('');
      $('#inputAssunto, #inputDescricao').val('');
      $('#inputAnexo').val('');
      $('#fileSelected').hide();
      $('#fileDropZone i, #fileDropZone p:first-of-type').show();
      $('#switchAnonimo').prop('checked', false);
      $('#anonRow').removeClass('active-anon');
      $('.field-group').removeClass('has-error has-success');
    });

    /* ── Envio da manifestação ── */
    $('#btnEnviar').on('click', function() {
      const categoria  = $('#inputCategoria').val();
      const urgencia   = $('#inputUrgencia').val();
      const assunto    = $('#inputAssunto').val().trim();
      const descricao  = $('#inputDescricao').val().trim();

      setError($('#fgCategoria'), !categoria);
      setError($('#fgUrgencia'),  !urgencia);
      setError($('#fgAssunto'),   !assunto);
      setError($('#fgDescricao'), descricao.length < 20, 'Descreva com pelo menos 20 caracteres.');

      if (!categoria || !urgencia || !assunto || descricao.length < 20) {
        toast('Preencha todos os campos obrigatórios.', 'warning');
        return;
      }

      const $btn = $(this);
      btnLoad($btn, true);

      const formData = new FormData();
      formData.append('action',    'manifestacao');
      formData.append('user_id',   user.id || '');
      formData.append('anonimo',   $('#switchAnonimo').prop('checked') ? '1' : '0');
      formData.append('categoria', categoria);
      formData.append('urgencia',  urgencia);
      formData.append('sigilo',    $('#inputSigilo').val());
      formData.append('assunto',   assunto);
      formData.append('descricao', descricao);
      if ($('#inputAnexo')[0].files[0]) {
        formData.append('anexo', $('#inputAnexo')[0].files[0]);
      }

      $.ajax({
        url: 'api/auth.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success(res) {
          if (res.sucesso) {
            const protocolo = res.protocolo || gerarProtocolo();
            mostrarSucesso(protocolo);
          } else {
            toast(res.mensagem || 'Erro ao enviar manifestação.', 'error');
            btnLoad($btn, false);
          }
        },
        error() {
          /* Fallback offline: simula envio para demo */
          const protocolo = gerarProtocolo();
          mostrarSucesso(protocolo);
        }
      });
    });

    function mostrarSucesso(protocolo) {
      $('#manifestacaoForm').fadeOut(300, () => {
        $('#protocoloGerado').text(protocolo);
        $('#protocolInput').val(protocolo);
        $('#successCard').fadeIn(400);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      toast('Manifestação registrada com sucesso! 🎉', 'success', 5000);
    }
  }

  /* ── Contador animado ── */
  function animarContador(sel, target) {
    const $el = $(sel);
    let current = 0;
    const step  = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      $el.text(current);
      if (current >= target) clearInterval(timer);
    }, 30);
  }

  /* ── Copiar protocolo ── */
  function copiarProtocolo() {
    const val = $('#protocolInput').val();
    navigator.clipboard.writeText(val).then(() => {
      toast('Protocolo copiado para a área de transferência!', 'success');
    }).catch(() => {
      toast('Não foi possível copiar automaticamente.', 'warning');
    });
  }

  /* ── Nova manifestação (reset) ── */
  function novaManifestacao() {
    $('#successCard').fadeOut(300, () => {
      $('#manifestacaoForm').fadeIn(400);
      // reset form
      $('#categoryGrid .cat-option').removeClass('selected');
      $('#inputCategoria, #inputUrgencia, #inputAssunto').val('');
      $('#inputDescricao').val('');
      $('#switchAnonimo').prop('checked', false);
      $('#anonRow').removeClass('active-anon');
      $('.field-group').removeClass('has-error has-success');
    });
  }

  /* ── API pública ── */
  return { toast, loginPage, cadastroPage, manifestacaoPage, copiarProtocolo, novaManifestacao };

})();
