-- ═══════════════════════════════════════════════════════════
-- OUVIDORIA DIGITAL — EEEP Dom Walfrido Teixeira Vieira
-- banco.sql  →  Execute este script no seu MySQL/MariaDB
-- ═══════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS ouvidoria_dw
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ouvidoria_dw;

-- ── TABELA DE USUÁRIOS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(150)    NOT NULL,
    email       VARCHAR(180)    NOT NULL UNIQUE,
    cpf         VARCHAR(14)     DEFAULT NULL,
    tipo        ENUM('aluno','professor','servidor','responsavel','comunidade') NOT NULL,
    senha_hash  VARCHAR(255)    NOT NULL,       -- bcrypt hash, NUNCA texto puro
    ativo       TINYINT(1)      NOT NULL DEFAULT 1,
    criado_em   DATETIME        NOT NULL,
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- ── TABELA DE MANIFESTAÇÕES ───────────────────────────────
CREATE TABLE IF NOT EXISTS manifestacoes (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED    DEFAULT NULL,   -- NULL se anônimo
    anonimo     TINYINT(1)      NOT NULL DEFAULT 0,
    protocolo   VARCHAR(20)     NOT NULL UNIQUE,
    categoria   ENUM('infraestrutura','ensino','convivencia','elogio','sugestao','denuncia','outros') NOT NULL,
    urgencia    ENUM('normal','alta','urgente') NOT NULL DEFAULT 'normal',
    sigilo      ENUM('nao','sim') NOT NULL DEFAULT 'nao',
    assunto     VARCHAR(255)    NOT NULL,
    descricao   TEXT            NOT NULL,
    anexo_path  VARCHAR(500)    DEFAULT NULL,
    status      ENUM('pendente','em_analise','resolvido','arquivado') NOT NULL DEFAULT 'pendente',
    resposta    TEXT            DEFAULT NULL,
    criado_em   DATETIME        NOT NULL,
    resolvido_em DATETIME       DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_protocolo (protocolo),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;
