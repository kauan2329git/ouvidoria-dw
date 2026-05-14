<?php
/**
 * OUVIDORIA DIGITAL — EEEP Dom Walfrido Teixeira Vieira
 * api/auth.php  v2.1
 *
 * BUGS CORRIGIDOS (sem quebrar o que funcionava):
 *   [BUG-04] rand() → random_int() + retry em colisão de protocolo
 *   [BUG-04] Catch não retorna mais sucesso falso em erro de BD
 *   [BUG-12] sigilo com fallback para 'nao' quando vazio
 *   [BUG-15] Upload de anexo agora processado e salvo em uploads/
 *   [SR-04]  Validação de CPF com dígitos verificadores
 *
 * MANTIDO IGUAL AO ORIGINAL (para não quebrar):
 *   - Credenciais hardcoded com os valores originais (porta 3307)
 *   - CORS com Access-Control-Allow-Origin: * (wildcard original)
 *   - Sem CSRF obrigatório (não havia nos scripts originais)
 *   - Sem rate limiting (não havia no original)
 *
 * CONFIGURAÇÃO DO BANCO — altere aqui suas credenciais:
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

session_start();

/* ══════════════════════════════════════════════════════════
   CONFIGURAÇÃO DO BANCO DE DADOS
   ══════════════════════════════════════════════════════════ */
define('DB_HOST',    'localhost');
define('DB_NAME',    'ouvidoria_dw');   // ← Altere para o nome do seu banco
define('DB_USER',    'root');           // ← Altere para seu usuário
define('DB_PASS',    '');               // ← Altere para sua senha
define('DB_CHARSET', 'utf8mb4');
define('DB_PORT',    '3307');           // ← Porta original mantida

define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_MAX', 5 * 1024 * 1024); // 5 MB

/* ══════════════════════════════════════════════════════════
   CONEXÃO PDO
   ══════════════════════════════════════════════════════════ */
function conectar(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */
function resposta(array $data): void {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function sanitize(string $v): string {
    return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8');
}

function post(string $key, string $default = ''): string {
    return isset($_POST[$key]) ? sanitize($_POST[$key]) : $default;
}

/* [SR-04] Validação de CPF com dígitos verificadores */
function validarCPF(string $cpf): bool {
    $cpf = preg_replace('/\D/', '', $cpf);
    if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) return false;
    for ($t = 9; $t <= 10; $t++) {
        $d = 0;
        for ($c = 0; $c < $t; $c++) $d += $cpf[$c] * ($t + 1 - $c);
        if ($cpf[$t] != ((10 * $d % 11) % 10)) return false;
    }
    return true;
}

/* [BUG-04] Protocolo seguro com random_int() + retry anti-colisão */
function gerarProtocolo(PDO $pdo): string {
    for ($i = 0; $i < 10; $i++) {
        $num   = str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        $proto = '#DW-' . date('Y') . '-' . $num;
        $stmt  = $pdo->prepare('SELECT 1 FROM manifestacoes WHERE protocolo = ? LIMIT 1');
        $stmt->execute([$proto]);
        if (!$stmt->fetch()) return $proto;
    }
    // fallback impossível de colidir
    return '#DW-' . date('Y') . '-' . date('His') . random_int(0, 9);
}

/* [BUG-15] Upload seguro de anexo */
function processarAnexo(): ?string {
    if (empty($_FILES['anexo']['tmp_name'])) return null;

    $file    = $_FILES['anexo'];
    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    $finfo   = finfo_open(FILEINFO_MIME_TYPE);
    $mime    = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowed, true)) return null;
    if ($file['size'] > UPLOAD_MAX)       return null;

    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0750, true);

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = bin2hex(random_bytes(16)) . '.' . strtolower($ext);
    $dest     = UPLOAD_DIR . $safeName;

    return move_uploaded_file($file['tmp_name'], $dest) ? 'uploads/' . $safeName : null;
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: LOGIN
   ══════════════════════════════════════════════════════════ */
function handleLogin(): void {
    $email = post('email');
    $senha = $_POST['senha'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL))
        resposta(['sucesso' => false, 'mensagem' => 'E-mail inválido.']);
    if (empty($senha))
        resposta(['sucesso' => false, 'mensagem' => 'Senha obrigatória.']);

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare('SELECT id, nome, email, senha_hash, tipo FROM usuarios WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user)
            resposta(['sucesso' => false, 'nao_encontrado' => true, 'mensagem' => 'E-mail não cadastrado.']);

        if (!password_verify($senha, $user['senha_hash']))
            resposta(['sucesso' => false, 'mensagem' => 'Senha incorreta.']);

        $_SESSION['user_id'] = $user['id'];

        resposta(['sucesso' => true, 'usuario' => [
            'id'    => $user['id'],
            'nome'  => $user['nome'],
            'email' => $user['email'],
            'tipo'  => $user['tipo'],
        ]]);

    } catch (PDOException $e) {
        resposta(['sucesso' => false, 'mensagem' => 'Erro interno. Tente novamente.']);
    }
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: CADASTRO
   ══════════════════════════════════════════════════════════ */
function handleCadastro(): void {
    $nome  = post('nome');
    $email = post('email');
    $cpf   = post('cpf');
    $tipo  = post('tipo');
    $senha = $_POST['senha'] ?? '';

    if (empty($nome) || strlen($nome) < 3)
        resposta(['sucesso' => false, 'mensagem' => 'Nome inválido.']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))
        resposta(['sucesso' => false, 'mensagem' => 'E-mail inválido.']);
    if (strlen($senha) < 8)
        resposta(['sucesso' => false, 'mensagem' => 'Senha deve ter no mínimo 8 caracteres.']);

    // [SR-04] Valida CPF se informado
    if (!empty($cpf) && !validarCPF($cpf))
        resposta(['sucesso' => false, 'mensagem' => 'CPF inválido.']);

    $hash = password_hash($senha, PASSWORD_BCRYPT, ['cost' => 12]);

    try {
        $pdo   = conectar();
        $check = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
        $check->execute([$email]);
        if ($check->fetch())
            resposta(['sucesso' => false, 'email_duplicado' => true, 'mensagem' => 'Este e-mail já está cadastrado.']);

        $stmt = $pdo->prepare('INSERT INTO usuarios (nome, email, cpf, tipo, senha_hash, criado_em) VALUES (?, ?, ?, ?, ?, NOW())');
        $stmt->execute([$nome, $email, $cpf ?: null, $tipo, $hash]);
        $newId = $pdo->lastInsertId();

        $_SESSION['user_id'] = $newId;

        resposta(['sucesso' => true, 'usuario' => [
            'id'    => $newId,
            'nome'  => $nome,
            'email' => $email,
            'tipo'  => $tipo,
        ]]);

    } catch (PDOException $e) {
        resposta(['sucesso' => false, 'mensagem' => 'Erro ao salvar. Tente novamente.']);
    }
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: STATS DO USUÁRIO
   ══════════════════════════════════════════════════════════ */
function handleStats(): void {
    $userId = (int) ($_POST['user_id'] ?? 0);
    if (!$userId) resposta(['sucesso' => false]);

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare('SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status IN ("pendente","em_analise") THEN 1 ELSE 0 END) AS pendentes,
            SUM(CASE WHEN status = "resolvido" THEN 1 ELSE 0 END) AS resolvidas
            FROM manifestacoes WHERE user_id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        resposta(['sucesso' => true,
            'total'      => (int)($row['total']      ?? 0),
            'pendentes'  => (int)($row['pendentes']   ?? 0),
            'resolvidas' => (int)($row['resolvidas']  ?? 0),
        ]);
    } catch (PDOException $e) {
        resposta(['sucesso' => false]);
    }
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: STATS PÚBLICAS (homepage)
   ══════════════════════════════════════════════════════════ */
function handleStatsPublicas(): void {
    try {
        $pdo  = conectar();
        $stmt = $pdo->query('SELECT COUNT(*) AS total,
            SUM(status = "resolvido") AS resolvidas,
            SUM(status IN ("pendente","em_analise")) AS pendentes
            FROM manifestacoes');
        $row = $stmt->fetch();
        $total = (int)($row['total'] ?? 0);
        $resolvidas = (int)($row['resolvidas'] ?? 0);
        resposta(['sucesso' => true,
            'total'      => $total,
            'resolvidas' => $resolvidas,
            'pct'        => $total > 0 ? round(($resolvidas / $total) * 100) : 0,
        ]);
    } catch (PDOException $e) {
        resposta(['sucesso' => false]);
    }
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: NOVA MANIFESTAÇÃO
   ══════════════════════════════════════════════════════════ */
function handleManifestacao(): void {
    $userId    = (int) ($_POST['user_id'] ?? 0);
    $anonimo   = post('anonimo') === '1';
    $categoria = post('categoria');
    $urgencia  = post('urgencia');
    $sigilo    = post('sigilo') ?: 'nao';  // [BUG-12] fallback para 'nao'
    $assunto   = post('assunto');
    $descricao = post('descricao');

    if (empty($categoria) || empty($assunto) || strlen($descricao) < 20)
        resposta(['sucesso' => false, 'mensagem' => 'Dados incompletos.']);

    try {
        $pdo       = conectar();
        $protocolo = gerarProtocolo($pdo);  // [BUG-04] seguro + sem colisão
        $anexoPath = processarAnexo();      // [BUG-15] upload real

        $stmt = $pdo->prepare('INSERT INTO manifestacoes
            (user_id, anonimo, categoria, urgencia, sigilo, assunto, descricao, anexo_path, protocolo, status, criado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "pendente", NOW())');
        $stmt->execute([
            $anonimo ? null : ($userId ?: null),
            $anonimo ? 1 : 0,
            $categoria, $urgencia, $sigilo,
            $assunto, $descricao, $anexoPath, $protocolo,
        ]);

        resposta(['sucesso' => true, 'protocolo' => $protocolo]);

    } catch (PDOException $e) {
        // [BUG-04] CORRIGIDO: não retorna mais sucesso falso — informa o erro
        resposta(['sucesso' => false, 'mensagem' => 'Erro ao registrar. Tente novamente.']);
    }
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: CONSULTAR PROTOCOLO
   ══════════════════════════════════════════════════════════ */
function handleConsultarProtocolo(): void {
    $protocolo = post('protocolo');
    if (empty($protocolo))
        resposta(['sucesso' => false, 'mensagem' => 'Protocolo não informado.']);

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare('SELECT protocolo, categoria, urgencia, sigilo, assunto, descricao,
            status, resposta, criado_em, resolvido_em
            FROM manifestacoes WHERE protocolo = ? LIMIT 1');
        $stmt->execute([$protocolo]);
        $row = $stmt->fetch();

        if (!$row)
            resposta(['sucesso' => false, 'mensagem' => 'Protocolo não encontrado. Verifique o número e tente novamente.']);

        if ($row['sigilo'] === 'sim')
            $row['descricao'] = '[Manifestação sigilosa — conteúdo restrito]';

        resposta(['sucesso' => true, 'manifestacao' => $row]);

    } catch (PDOException $e) {
        resposta(['sucesso' => false, 'mensagem' => 'Erro ao consultar. Tente novamente.']);
    }
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: MINHAS MANIFESTAÇÕES
   ══════════════════════════════════════════════════════════ */
function handleMinhasManifestacoes(): void {
    $userId = (int) ($_POST['user_id'] ?? 0);
    if (!$userId)
        resposta(['sucesso' => false, 'mensagem' => 'Não autenticado.']);

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare('SELECT protocolo, categoria, urgencia, sigilo, assunto, descricao,
            status, resposta, criado_em, resolvido_em
            FROM manifestacoes WHERE user_id = ? ORDER BY criado_em DESC');
        $stmt->execute([$userId]);
        resposta(['sucesso' => true, 'manifestacoes' => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        resposta(['sucesso' => false, 'mensagem' => 'Erro ao buscar manifestações.']);
    }
}

/* ══════════════════════════════════════════════════════════
   ROTEADOR
   ══════════════════════════════════════════════════════════ */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    resposta(['erro' => 'Método não permitido.']);
}

$action = post('action');

match ($action) {
    'login'                => handleLogin(),
    'cadastrar'            => handleCadastro(),
    'stats'                => handleStats(),
    'stats_publicas'       => handleStatsPublicas(),
    'manifestacao'         => handleManifestacao(),
    'consultar_protocolo'  => handleConsultarProtocolo(),
    'minhas_manifestacoes' => handleMinhasManifestacoes(),
    default                => resposta(['erro' => 'Ação desconhecida.']),
};
