/**
 * OUVIDORIA DIGITAL — script.js
 * Login e cadastro multi-step.
 * SEM dependência de utils.js
 */

/* ── Helpers locais ─────────────────────────────── */
function toast(msg, type, ms) {
  ms = ms || 3500;
  var icons = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', warning:'bi-exclamation-triangle-fill' };
  var $t = $('<div class="dw-t t-'+type+'"><i class="bi '+icons[type]+' ti"></i><span class="tm">'+msg+'</span><i class="bi bi-x tc"></i></div>');
  $('#toastWrap').append($t);
  $t.find('.tc').on('click', function(){ $t.remove(); });
  setTimeout(function(){ $t.fadeOut(300, function(){ $t.remove(); }); }, ms);
}

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function maskCPF(v) {
  return v.replace(/\D/g,'')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
    .slice(0, 14);
}

function setError($group, show, msg) {
  $group.toggleClass('has-error', show)
        .toggleClass('has-success', !show && !!$group.find('input,select,textarea').val());
  if (msg) $group.find('.field-error').text(msg);
}

function btnLoad($btn, on) { $btn.toggleClass('loading', on); }

/* ── Força da senha ─────────────────────────────── */
function calcForcaSenha(s) {
  var score = 0;
  if (s.length >= 8)  score++;
  if (s.length >= 12) score++;
  if (/[A-Z]/.test(s) && /[a-z]/.test(s)) score++;
  if (/\d/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;
  return Math.min(4, score);
}

function atualizarForcaSenha(val) {
  var score   = calcForcaSenha(val);
  var classes = ['','filled-weak','filled-weak','filled-medium','filled-strong'];
  var labels  = ['Digite sua senha','Muito fraca','Fraca','Média','Forte 💪'];
  for (var i = 1; i <= 4; i++) {
    $('#sb'+i).removeClass('filled-weak filled-medium filled-strong');
    if (i <= score) $('#sb'+i).addClass(classes[score]);
  }
  $('#sbLabel').text(val ? labels[score] : 'Digite sua senha');
}

/* ════════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════════ */
function loginPage() {
  $('#toggleSenha').on('click', function(){
    var $inp = $('#inputSenha');
    $inp.attr('type', $inp.attr('type') === 'password' ? 'text' : 'password');
    $(this).toggleClass('bi-eye bi-eye-slash');
  });

  $('#formLogin').on('submit', function(e){
    e.preventDefault();
    var email = $('#inputEmail').val().trim();
    var senha = $('#inputSenha').val();

    setError($('#fgEmail'), !isEmail(email));
    setError($('#fgSenha'), !senha);
    if (!isEmail(email) || !senha) return;

    var $btn = $('#btnEntrar');
    btnLoad($btn, true);

    $.ajax({
      url: 'api/auth.php', method: 'POST',
      data: { action: 'login', email: email, senha: senha },
      dataType: 'json',
      success: function(res) {
        if (res.sucesso) {
          sessionStorage.setItem('dw_user', JSON.stringify(res.usuario));
          toast('Login realizado! Redirecionando...', 'success');
          setTimeout(function(){ window.location.href = 'manifestacao.html'; }, 1200);
        } else if (res.nao_encontrado) {
          toast('E-mail não encontrado. Criando sua conta...', 'warning', 2500);
          setTimeout(function(){
            window.location.href = 'cadastro.html?email=' + encodeURIComponent(email);
          }, 1800);
        } else {
          toast(res.mensagem || 'Senha incorreta.', 'error');
          setError($('#fgSenha'), true, res.mensagem || 'Senha incorreta.');
          btnLoad($btn, false);
        }
      },
      error: function() {
        toast('Erro de conexão. Verifique o servidor.', 'error');
        btnLoad($btn, false);
      }
    });
  });

  $('#inputEmail').on('input', function(){ setError($('#fgEmail'), false); });
  $('#inputSenha').on('input', function(){ setError($('#fgSenha'), false); });
}

/* ════════════════════════════════════════════════
   CADASTRO (multi-step)
════════════════════════════════════════════════ */
function cadastroPage() {
  var stepAtual = 1;
  var dados = {};

  var params = new URLSearchParams(window.location.search);
  if (params.get('email')) $('#inputEmail').val(params.get('email'));

  $('#inputCpf').on('input', function(){ $(this).val(maskCPF($(this).val())); });
  $('#inputSenha').on('input', function(){
    atualizarForcaSenha($(this).val());
    setError($('#fgSenha'), false);
  });

  $('#toggleSenha1').on('click', function(){
    var $i = $('#inputSenha');
    $i.attr('type', $i.attr('type') === 'password' ? 'text' : 'password');
    $(this).toggleClass('bi-eye bi-eye-slash');
  });
  $('#toggleSenha2').on('click', function(){
    var $i = $('#inputConfirma');
    $i.attr('type', $i.attr('type') === 'password' ? 'text' : 'password');
    $(this).toggleClass('bi-eye bi-eye-slash');
  });

  function irPara(n) {
    $('#step'+stepAtual).removeClass('active');
    $('#dot'+stepAtual).removeClass('active').addClass('done');
    if (n > stepAtual) $('#line'+Math.min(stepAtual,2)).addClass('done');
    stepAtual = n;
    $('#step'+n).addClass('active');
    $('#dot'+n).removeClass('done').addClass('active');
  }

  function voltarPara(n) {
    $('#step'+stepAtual).removeClass('active');
    $('#dot'+stepAtual).removeClass('active done');
    stepAtual = n;
    $('#step'+n).addClass('active');
    $('#dot'+n).removeClass('done').addClass('active');
  }

  $('#btnStep1').on('click', function(){
    var nome  = $('#inputNome').val().trim();
    var email = $('#inputEmail').val().trim();
    var tipo  = $('#inputTipo').val();

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

  $('#btnBackStep1').on('click', function(){ voltarPara(1); });

  $('#btnStep2').on('click', function(){
    var senha    = $('#inputSenha').val();
    var confirma = $('#inputConfirma').val();

    setError($('#fgSenha'),    senha.length < 8);
    setError($('#fgConfirma'), senha !== confirma, 'As senhas não coincidem.');
    if (senha.length < 8 || senha !== confirma) return;

    dados.senha = senha;
    preencherReview();
    irPara(3);
  });

  $('#btnBackStep2').on('click', function(){ voltarPara(2); });

  function preencherReview() {
    var tipoMap = { aluno:'Aluno(a)', professor:'Professor(a)', servidor:'Servidor(a)', responsavel:'Responsável', comunidade:'Comunidade' };
    var linhas  = [
      { label:'Nome',   val: dados.nome },
      { label:'E-mail', val: dados.email },
      { label:'CPF',    val: dados.cpf || '—' },
      { label:'Tipo',   val: tipoMap[dados.tipo] || dados.tipo },
      { label:'Senha',  val: '••••••••' }
    ];
    $('#reviewContent').html(linhas.map(function(l){
      return '<div style="display:flex;justify-content:space-between;gap:1rem;padding:6px 0;border-bottom:1px solid var(--border)">' +
        '<span style="color:var(--text-muted);font-size:.82rem">'+l.label+'</span>' +
        '<span style="font-weight:600;font-size:.82rem;text-align:right">'+l.val+'</span></div>';
    }).join(''));
  }

  $('#formCadastro').on('submit', function(e){
    e.preventDefault();
    if (!$('#checkTermos').prop('checked')) { setError($('#fgTermos'), true); return; }
    setError($('#fgTermos'), false);

    var $btn = $('#btnCadastrar');
    btnLoad($btn, true);

    $.ajax({
      url: 'api/auth.php', method: 'POST',
      data: { action:'cadastrar', nome:dados.nome, email:dados.email, cpf:dados.cpf, tipo:dados.tipo, senha:dados.senha },
      dataType: 'json',
      success: function(res) {
        if (res.sucesso) {
          sessionStorage.setItem('dw_user', JSON.stringify(res.usuario));
          toast('Conta criada com sucesso! Bem-vindo(a) 🎉', 'success');
          setTimeout(function(){ window.location.href = 'manifestacao.html'; }, 1500);
        } else {
          toast(res.mensagem || 'Erro ao criar conta.', 'error');
          if (res.email_duplicado) {
            voltarPara(1);
            setError($('#fgEmail'), true, 'Este e-mail já está cadastrado.');
          }
          btnLoad($btn, false);
        }
      },
      error: function() {
        toast('Erro de conexão. Verifique o servidor.', 'error');
        btnLoad($btn, false);
      }
    });
  });

  $('input, select').on('input change', function(){ setError($(this).closest('.field-group'), false); });
  $('#checkTermos').on('change', function(){ setError($('#fgTermos'), !$(this).prop('checked')); });
}

/* ── Exposição global ── */
var DW = { loginPage: loginPage, cadastroPage: cadastroPage };
