/**
 * OUVIDORIA DIGITAL — utils.js
 * Utilitários globais compartilhados por todas as páginas.
 *
 * [BUG-11] toast() centralizada aqui — removida dos scripts inline e manifestacao.js
 */

const DWUtils = (() => {

  // ── [BUG-11] Toast centralizado ─────────────────────────
  function toast(msg, type = 'success', ms = 3500) {
    const icons = {
      success: 'bi-check-circle-fill',
      error:   'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill'
    };
    const wrap = document.getElementById('toastWrap') || document.getElementById('toastContainer');
    if (!wrap) return;

    const el = document.createElement('div');
    el.className = `dw-t t-${type}`;
    el.innerHTML = `<i class="bi ${icons[type] || icons.success} ti"></i><span class="tm">${msg}</span><i class="bi bi-x tc"></i>`;
    wrap.appendChild(el);

    el.querySelector('.tc').addEventListener('click', () => el.remove());
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, ms);
  }

  // ── Ajax simples (compatível com o original — sem CSRF obrigatório) ──
  function ajax(opts) {
    return $.ajax({ method: 'POST', dataType: 'json', ...opts });
  }

  // ── Utilitários de sessão ─────────────────────────────────
  function salvarSessao(usuario) {
    sessionStorage.setItem('dw_user', JSON.stringify(usuario));
  }
  function carregarSessao() {
    try { return JSON.parse(sessionStorage.getItem('dw_user')); } catch { return null; }
  }
  function limparSessao() {
    sessionStorage.removeItem('dw_user');
  }

  // ── Formata data pt-BR ─────────────────────────────────────
  function formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d.replace(' ', 'T'));
    return dt.toLocaleDateString('pt-BR') + ' às ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Escape HTML seguro ─────────────────────────────────────
  function esc(s) { return $('<span>').text(s || '').html(); }

  return { toast, ajax, salvarSessao, carregarSessao, limparSessao, formatDate, esc };

})();

// Alias para compatibilidade com scripts que chamam DWUtils.csrfAjax()
DWUtils.csrfAjax = DWUtils.ajax;
DWUtils.getCsrfToken = () => Promise.resolve(null);
