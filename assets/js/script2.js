/* =====================================================
   OUVIDORIA DIGITAL — EEEP Dom Walfrido Teixeira Vieira
   script2.js — Homepage
   ===================================================== */

'use strict';

/* ---- Navbar scroll behavior ---- */
const navbar = document.getElementById('mainNavbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

/* ---- Active nav link on scroll ---- */
const sections = document.querySelectorAll('section[id]');

function setActiveNav() {
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 100;
    if (window.scrollY >= top) current = section.getAttribute('id');
  });
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) link.classList.add('active');
  });
}

window.addEventListener('scroll', setActiveNav, { passive: true });

/* ---- Scroll-triggered animations ---- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

/* ---- Step connectors animation ---- */
const connectorObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.5 });

document.querySelectorAll('.step-connector').forEach(el => connectorObserver.observe(el));

/* ---- Smooth scroll for anchor links ---- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      // Close mobile menu if open
      const navCollapse = document.getElementById('navMenu');
      if (navCollapse && navCollapse.classList.contains('show')) {
        bootstrap.Collapse.getInstance(navCollapse)?.hide();
      }
    }
  });
});

/* ---- Abrir opções de manifestação (hero button) ---- */
window.abrirOpcoes = function () {
  Swal.fire({
    title: '<strong>Como deseja se identificar?</strong>',
    html: `
      <p style="color:#64748b;font-size:.9rem;margin-bottom:1.5rem">
        Escolha como prefere realizar sua manifestação. Ambas as formas são seguras.
      </p>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <button id="swalAnonimo" class="swal-opt-btn swal-btn-anonimo">
          <span class="swal-opt-icon">🕵️</span>
          <div>
            <strong>Manifestação Anônima</strong>
            <small>Sem cadastro necessário</small>
          </div>
        </button>
        <button id="swalLogin" class="swal-opt-btn swal-btn-login">
          <span class="swal-opt-icon">👤</span>
          <div>
            <strong>Com Identificação</strong>
            <small>Acesse com seu cadastro</small>
          </div>
        </button>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    customClass: {
      popup: 'swal-popup-custom',
      title: 'swal-title-custom',
    },
    didOpen: () => {
      injectSwalStyles();

      document.getElementById('swalAnonimo').addEventListener('click', () => {
        Swal.close();
        setTimeout(abrirFormAnonimo, 200);
      });

      document.getElementById('swalLogin').addEventListener('click', () => {
        Swal.close();
        window.location.href = 'login.html';
      });
    }
  });
};

/* ---- Abrir formulário anônimo ---- */
window.abrirFormAnonimo = function () {
  const modal = new bootstrap.Modal(document.getElementById('modalAnonimo'));
  modal.show();
};

/* ---- Enviar manifestação (simulação AJAX) ---- */
window.enviarManifestacao = function () {
  const categoria   = document.getElementById('categoriaMani').value;
  const descricao   = document.getElementById('descricaoMani').value.trim();
  const btnEnviar   = document.getElementById('btnEnviarMani');
  const btnText     = btnEnviar.querySelector('.btn-text');
  const btnLoading  = btnEnviar.querySelector('.btn-loading');

  // Validação
  if (!categoria) {
    Swal.fire({ icon: 'warning', title: 'Campo obrigatório', text: 'Por favor, selecione uma categoria.', confirmButtonColor: '#008542' });
    return;
  }
  if (!descricao || descricao.length < 20) {
    Swal.fire({ icon: 'warning', title: 'Descrição muito curta', text: 'Por favor, descreva sua manifestação com ao menos 20 caracteres.', confirmButtonColor: '#008542' });
    return;
  }

  // Estado de loading
  btnEnviar.disabled = true;
  btnText.classList.add('d-none');
  btnLoading.classList.remove('d-none');

  // Simulação AJAX
  setTimeout(() => {
    const protocolo = gerarProtocolo();

    btnEnviar.disabled = false;
    btnText.classList.remove('d-none');
    btnLoading.classList.add('d-none');

    // Fechar modal
    bootstrap.Modal.getInstance(document.getElementById('modalAnonimo'))?.hide();

    // Sucesso
    Swal.fire({
      icon: 'success',
      title: '✅ Manifestação Enviada!',
      html: `
        <p style="color:#64748b;font-size:.9rem">Sua manifestação foi registrada com sucesso.</p>
        <div style="background:#e8f5ee;border-radius:12px;padding:1rem;margin:.75rem 0">
          <div style="font-size:.75rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Seu Protocolo</div>
          <div style="font-size:1.6rem;font-weight:800;color:#006832;letter-spacing:.05em">${protocolo}</div>
        </div>
        <p style="font-size:.78rem;color:#94a3b8">Guarde este número para acompanhar o andamento da sua manifestação.</p>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#008542',
      customClass: { popup: 'swal-popup-custom' }
    });

    // Limpar campos
    document.getElementById('categoriaMani').value = '';
    document.getElementById('descricaoMani').value = '';
  }, 2200);
};

/* ---- Gerar protocolo automático ---- */
function gerarProtocolo() {
  const ano = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
  return `#DW-${ano}-${num}`;
}

/* ---- Upload area visual feedback ---- */
const uploadArea = document.getElementById('uploadArea');
if (uploadArea) {
  const input = uploadArea.querySelector('.upload-input');

  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      const fileName = input.files[0].name;
      uploadArea.innerHTML = `
        <i class="bi bi-file-earmark-check" style="font-size:1.8rem;color:var(--verde)"></i>
        <span style="font-weight:600;color:var(--verde-dark)">${fileName}</span>
        <small style="color:var(--text-muted)">Arquivo anexado</small>
      `;
    }
  });

  // Drag & drop feedback
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--verde)';
    uploadArea.style.background = 'var(--verde-light)';
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
  });
  uploadArea.addEventListener('drop', (e) => {
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
  });
}

/* ---- Injetar estilos dos botões do SweetAlert ---- */
function injectSwalStyles() {
  if (document.getElementById('swal-custom-styles')) return;
  const style = document.createElement('style');
  style.id = 'swal-custom-styles';
  style.textContent = `
    .swal-popup-custom { font-family: 'Poppins', sans-serif !important; border-radius: 20px !important; }
    .swal-title-custom { font-family: 'Poppins', sans-serif !important; font-weight: 700 !important; }
    .swal-opt-btn {
      display: flex; align-items: center; gap: .9rem;
      width: 100%; padding: 1rem 1.2rem;
      border-radius: 12px; border: 1.5px solid #e2e8f0;
      cursor: pointer; text-align: left; transition: all .2s ease;
      background: white; font-family: 'Poppins', sans-serif;
    }
    .swal-opt-btn strong { display: block; font-size: .9rem; color: #1a2332; }
    .swal-opt-btn small  { font-size: .75rem; color: #64748b; font-weight: 400; }
    .swal-opt-icon { font-size: 1.6rem; }
    .swal-btn-anonimo:hover { border-color: #F47920; background: #fff3e8; }
    .swal-btn-login:hover   { border-color: #008542; background: #e8f5ee; }
  `;
  document.head.appendChild(style);
}

/* ---- Paralax leve nos shapes do hero ---- */
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const shapes  = document.querySelectorAll('.shape');
  shapes.forEach((shape, i) => {
    const speed  = [0.08, 0.12, 0.06, 0.10][i] || 0.08;
    const dir    = i % 2 === 0 ? 1 : -1;
    shape.style.transform = `translateY(${scrollY * speed * dir}px)`;
  });
}, { passive: true });

/* ---- Counter animation nos stats cards ---- */
function animateCounter(el, target, duration = 1500) {
  let start     = 0;
  const step    = target / (duration / 16);
  const timer   = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target; clearInterval(timer); return; }
    el.textContent = Math.floor(start);
  }, 16);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));
