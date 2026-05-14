<?php
/**
 * partials/nav.php — Navbar unificada (BUG-01, BUG-02, BUG-06)
 *
 * Uso:  <?php $activePage = 'home'; include __DIR__ . '/partials/nav.php'; ?>
 *
 * CORREÇÕES APLICADAS:
 *   [BUG-01] Navbar única — não mais copiada entre páginas com variações
 *   [BUG-02] Classe CSS correta "home-nav" em todas as páginas
 *   [BUG-03] Nenhum link com espaços extras
 *   [BUG-05] Link "Área do Gestor" com id="navLoginBtn" para atualização via JS
 *   [BUG-06] Links de âncora só exibidos na página home; nas demais apontam para manifestacao.html#section
 *
 * @var string $activePage  'home' | 'minhas' | 'consulta'
 */
$activePage = $activePage ?? 'home';

// Prefixo para links relativos (páginas internas estão na raiz)
$base = '';
?>
<nav class="home-nav">
  <div class="nav-inner">

    <!-- Logo -->
    <a href="<?= $base ?>manifestacao.html" class="nav-logo-wrap">
      <img src="<?= $base ?>assets/img/logo2 (2).jpeg" alt="Logo EEEP Dom Walfrido" class="nav-logo-img">
      <div class="nav-logo-text">
        <strong>Ouvidoria Digital</strong>
        <span>EEEP Dom Walfrido</span>
      </div>
    </a>

    <!-- Links -->
    <div class="nav-links" id="navLinks">

      <?php if ($activePage === 'home'): ?>
        <!-- Na homepage os links são âncoras internas -->
        <a href="#como-funciona">Como Funciona</a>
        <a href="#registrar">Registrar</a>
        <a href="#lgpd">LGPD</a>
      <?php else: ?>
        <!-- Nas demais páginas os links apontam para a homepage -->
        <a href="<?= $base ?>manifestacao.html#como-funciona">Como Funciona</a>
        <a href="<?= $base ?>manifestacao.html#registrar">Registrar</a>
        <a href="<?= $base ?>manifestacao.html#lgpd">LGPD</a>
      <?php endif; ?>

      <a href="<?= $base ?>consulta.html" <?= $activePage === 'consulta' ? 'class="active"' : '' ?>>
        Consultar Protocolo
      </a>

      <?php if ($activePage === 'minhas' || $activePage === 'home'): ?>
        <a href="<?= $base ?>minhas-manifestacoes.html" <?= $activePage === 'minhas' ? 'class="active"' : '' ?>>
          Minhas Manifestações
        </a>
      <?php endif; ?>

      <!-- [BUG-05] id="navLoginBtn" para ser atualizado via JS com nome do usuário -->
      <a id="navLoginBtn" href="<?= $base ?>login.html" class="nav-btn-login">
        <i class="bi bi-person-lock"></i> Área do Gestor
      </a>
    </div>

    <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
      <i class="bi bi-list"></i>
    </button>
  </div>
</nav>
