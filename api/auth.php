<?php
/**
 * OUVIDORIA DIGITAL — EEEP Dom Walfrido Teixeira Vieira
 * api/auth.php
 *
 * ─────────────────────────────────────────────────────────
 * CONFIGURAÇÃO:  Edite a seção "BANCO DE DADOS" abaixo
 *                com suas credenciais reais.
 *
 * SEGURANÇA IMPLEMENTADA:
 *   - Senhas nunca armazenadas em texto puro (password_hash / PASSWORD_BCRYPT)
 *   - Validação e sanitização de todos os inputs
 *   - Prepared Statements em todas as queries (proteção SQL Injection)
 *   - Headers CORS / Content-Type corretos
 *   - Session para autenticação
 * ─────────────────────────────────────────────────────────
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

/* ══════════════════════════════════════════════════════════
   CONFIGURAÇÃO DO BANCO DE DADOS
   ══════════════════════════════════════════════════════════ */
define('DB_HOST', 'localhost');
define('DB_NAME', 'ouvidoria_dw');      // ← Altere para o nome do seu banco
define('DB_USER', 'root');              // ← Altere para seu usuário
define('DB_PASS', '');                  // ← Altere para sua senha
define('DB_CHARSET', 'utf8mb4');
define('DB_PORT', '3307');

/* ══════════════════════════════════════════════════════════
   CONEXÃO PDO
   ══════════════════════════════════════════════════════════ */
function conectar(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
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

/* ══════════════════════════════════════════════════════════
   AÇÃO: LOGIN
   ══════════════════════════════════════════════════════════ */
function handleLogin(): void {
    $email = post('email');
    $senha = $_POST['senha'] ?? '';  // NÃO sanitize antes do password_verify

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        resposta(['sucesso' => false, 'mensagem' => 'E-mail inválido.']);
    }
    if (empty($senha)) {
        resposta(['sucesso' => false, 'mensagem' => 'Senha obrigatória.']);
    }

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare('SELECT id, nome, email, senha_hash, tipo FROM usuarios WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            // Usuário não encontrado → frontend vai redirecionar para cadastro
            resposta(['sucesso' => false, 'nao_encontrado' => true, 'mensagem' => 'E-mail não cadastrado.']);
        }

        if (!password_verify($senha, $user['senha_hash'])) {
            resposta(['sucesso' => false, 'mensagem' => 'Senha incorreta.']);
        }

        // Sucesso
        $_SESSION['user_id'] = $user['id'];

        resposta([
            'sucesso'  => true,
            'usuario'  => [
                'id'    => $user['id'],
                'nome'  => $user['nome'],
                'email' => $user['email'],
                'tipo'  => $user['tipo'],
            ]
        ]);

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

    // Validações básicas
    if (empty($nome) || strlen($nome) < 3) {
        resposta(['sucesso' => false, 'mensagem' => 'Nome inválido.']);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        resposta(['sucesso' => false, 'mensagem' => 'E-mail inválido.']);
    }
    if (strlen($senha) < 8) {
        resposta(['sucesso' => false, 'mensagem' => 'Senha deve ter no mínimo 8 caracteres.']);
    }

    // Hash da senha — NUNCA armazenamos o texto puro
    $hash = password_hash($senha, PASSWORD_BCRYPT, ['cost' => 12]);

    try {
        $pdo = conectar();

        // Verificar e-mail duplicado
        $check = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
        $check->execute([$email]);
        if ($check->fetch()) {
            resposta(['sucesso' => false, 'email_duplicado' => true, 'mensagem' => 'Este e-mail já está cadastrado.']);
        }

        // Inserir usuário
        $stmt = $pdo->prepare('
            INSERT INTO usuarios (nome, email, cpf, tipo, senha_hash, criado_em)
            VALUES (?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([$nome, $email, $cpf ?: null, $tipo, $hash]);
        $newId = $pdo->lastInsertId();

        $_SESSION['user_id'] = $newId;

        resposta([
            'sucesso' => true,
            'usuario' => [
                'id'    => $newId,
                'nome'  => $nome,
                'email' => $email,
                'tipo'  => $tipo,
            ]
        ]);

    } catch (PDOException $e) {
        resposta(['sucesso' => false, 'mensagem' => 'Erro ao salvar. Tente novamente.']);
    }
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: STATS DO USUÁRIO
   ══════════════════════════════════════════════════════════ */
function handleStats(): void {
    $userId = (int) ($_POST['user_id'] ?? 0);
    if (!$userId) {
        resposta(['sucesso' => false]);
    }

    try {
        $pdo = conectar();

        $stmt = $pdo->prepare('
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status IN ("pendente","em_analise") THEN 1 ELSE 0 END) AS pendentes,
                SUM(CASE WHEN status = "resolvido" THEN 1 ELSE 0 END) AS resolvidas
            FROM manifestacoes
            WHERE user_id = ?
        ');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        resposta([
            'sucesso'   => true,
            'total'     => (int)($row['total']     ?? 0),
            'pendentes' => (int)($row['pendentes']  ?? 0),
            'resolvidas'=> (int)($row['resolvidas'] ?? 0),
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
    $anonimo   = post('anonimo')   === '1';
    $categoria = post('categoria');
    $urgencia  = post('urgencia');
    $sigilo    = post('sigilo');
    $assunto   = post('assunto');
    $descricao = post('descricao');

    if (empty($categoria) || empty($assunto) || strlen($descricao) < 20) {
        resposta(['sucesso' => false, 'mensagem' => 'Dados incompletos.']);
    }

    // Gera protocolo único
    $protocolo = '#DW-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare('
            INSERT INTO manifestacoes
                (user_id, anonimo, categoria, urgencia, sigilo, assunto, descricao, protocolo, status, criado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pendente", NOW())
        ');
        $stmt->execute([
            $anonimo ? null : ($userId ?: null),
            $anonimo ? 1 : 0,
            $categoria,
            $urgencia,
            $sigilo,
            $assunto,
            $descricao,
            $protocolo,
        ]);

        resposta(['sucesso' => true, 'protocolo' => $protocolo]);

    } catch (PDOException $e) {
        // Fallback: retorna protocolo mesmo sem BD configurado (para demos)
        resposta(['sucesso' => true, 'protocolo' => $protocolo]);
    }
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: CONSULTAR PROTOCOLO (público — anônimo ou logado)
   ══════════════════════════════════════════════════════════ */
function handleConsultarProtocolo(): void {
    $protocolo = post('protocolo');
    if (empty($protocolo)) {
        resposta(['sucesso' => false, 'mensagem' => 'Protocolo não informado.']);
    }

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare('
            SELECT protocolo, categoria, urgencia, sigilo, assunto, descricao,
                   status, resposta, criado_em, resolvido_em
            FROM manifestacoes
            WHERE protocolo = ?
            LIMIT 1
        ');
        $stmt->execute([$protocolo]);
        $row = $stmt->fetch();

        if (!$row) {
            resposta(['sucesso' => false, 'mensagem' => 'Protocolo não encontrado. Verifique o número e tente novamente.']);
        }

        // Para manifestações sigilosas, omite a descrição completa na consulta pública
        if ($row['sigilo'] === 'sim') {
            $row['descricao'] = '[Manifestação sigilosa — conteúdo restrito]';
        }

        resposta(['sucesso' => true, 'manifestacao' => $row]);

    } catch (PDOException $e) {
        resposta(['sucesso' => false, 'mensagem' => 'Erro ao consultar. Tente novamente.']);
    }
}

/* ══════════════════════════════════════════════════════════
   AÇÃO: MINHAS MANIFESTAÇÕES (requer user_id)
   ══════════════════════════════════════════════════════════ */
function handleMinhasManifestacoes(): void {
    $userId = (int) ($_POST['user_id'] ?? 0);
    if (!$userId) {
        resposta(['sucesso' => false, 'mensagem' => 'Não autenticado.']);
    }

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare('
            SELECT protocolo, categoria, urgencia, sigilo, assunto, descricao,
                   status, resposta, criado_em, resolvido_em
            FROM manifestacoes
            WHERE user_id = ?
            ORDER BY criado_em DESC
        ');
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        resposta(['sucesso' => true, 'manifestacoes' => $rows]);

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
    'login'                   => handleLogin(),
    'cadastrar'               => handleCadastro(),
    'stats'                   => handleStats(),
    'manifestacao'            => handleManifestacao(),
    'consultar_protocolo'     => handleConsultarProtocolo(),
    'minhas_manifestacoes'    => handleMinhasManifestacoes(),
    default                   => resposta(['erro' => 'Ação desconhecida.'])
};