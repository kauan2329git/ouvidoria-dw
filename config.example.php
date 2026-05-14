<?php
/**
 * OUVIDORIA DIGITAL — Configuração do Servidor
 *
 * [BUG-16] Credenciais de banco fora do código-fonte e do controle de versão.
 *
 * INSTRUÇÕES:
 *   1. Copie este arquivo para config.php  (um nível acima de /api/)
 *   2. Preencha com suas credenciais reais
 *   3. Certifique-se que config.php está listado no .gitignore
 *      (nunca versione credenciais reais)
 */

// ── Banco de dados ─────────────────────────────────────────────────
define('DB_HOST',    'localhost');
define('DB_PORT',    '3307');
define('DB_NAME',    'ouvidoria_dw');
define('DB_USER',    'seu_usuario');
define('DB_PASS',    'sua_senha_aqui');
define('DB_CHARSET', 'utf8mb4');

// ── Uploads ────────────────────────────────────────────────────────
// Caminho absoluto para o diretório de uploads (fora do webroot é mais seguro)
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_MAX', 5 * 1024 * 1024); // 5 MB

// ── Aplicação ──────────────────────────────────────────────────────
define('APP_URL',  'https://seudominio.com.br'); // URL base sem barra final (usado no CORS)
define('APP_ENV',  'production');                // 'development' | 'production'
