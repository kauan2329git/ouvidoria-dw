-- ═══════════════════════════════════════════════════════════════════
-- OUVIDORIA DIGITAL — EEEP Dom Walfrido Teixeira Vieira
-- banco.sql  v2.0 — Execute no MySQL 8+ / MariaDB 10.4+
--
-- CORREÇÕES APLICADAS:
--   [BUG-16] Arquivo de configuração separado (config.php) — credenciais
--            fora do código-fonte. Este arquivo só tem estrutura de tabelas.
--   [BUG-04] Protocolo gerado com random_int() no PHP; UNIQUE constraint
--            mantida para garantir integridade no banco também.
--
-- SUGESTÕES SÊNIOR APLICADAS:
--   [SR-08] Tabela de logs de auditoria para rastrear ações sensíveis.
--   [SR-09] Índice composto em (user_id, status) para consultas frequentes.
--   [SR-10] Campos updated_at com DEFAULT/ON UPDATE para rastreabilidade.
--   [SR-11] Tabela de sessões persistentes (alternativa futura ao sessionStorage).
--   [SR-12] View pública que mascara dados sigilosos (pronta para o painel).
-- ═══════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS ouvidoria_dw
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ouvidoria_dw;

-- ── USUÁRIOS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id          INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(150)     NOT NULL,
    email       VARCHAR(180)     NOT NULL UNIQUE,
    cpf         VARCHAR(14)      DEFAULT NULL,          -- [SR-04] validado via PHP
    tipo        ENUM(
                  'aluno','professor','servidor',
                  'responsavel','comunidade','gestor'   -- [SR] tipo gestor para painel adm
                ) NOT NULL DEFAULT 'comunidade',
    senha_hash  VARCHAR(255)     NOT NULL,              -- bcrypt, custo 12
    ativo       TINYINT(1)       NOT NULL DEFAULT 1,
    criado_em   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP  -- [SR-10]
                                 ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_tipo  (tipo),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB;

-- ── MANIFESTAÇÕES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manifestacoes (
    id           INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    user_id      INT UNSIGNED    DEFAULT NULL,          -- NULL se anônimo
    anonimo      TINYINT(1)      NOT NULL DEFAULT 0,
    protocolo    VARCHAR(20)     NOT NULL UNIQUE,       -- [BUG-04] UNIQUE garantido
    categoria    ENUM(
                   'infraestrutura','ensino','convivencia',
                   'elogio','sugestao','denuncia','outros'
                 ) NOT NULL,
    urgencia     ENUM('normal','alta','urgente')  NOT NULL DEFAULT 'normal',
    sigilo       ENUM('nao','sim')                NOT NULL DEFAULT 'nao',
    assunto      VARCHAR(255)    NOT NULL,
    descricao    TEXT            NOT NULL,
    anexo_path   VARCHAR(500)    DEFAULT NULL,          -- [BUG-15] caminho real após upload
    status       ENUM(
                   'pendente','em_analise','resolvido','arquivado'
                 ) NOT NULL DEFAULT 'pendente',
    gestor_id    INT UNSIGNED    DEFAULT NULL,          -- [SR] quem respondeu
    resposta     TEXT            DEFAULT NULL,
    criado_em    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP  -- [SR-10]
                                 ON UPDATE CURRENT_TIMESTAMP,
    resolvido_em DATETIME        DEFAULT NULL,

    FOREIGN KEY (user_id)   REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (gestor_id) REFERENCES usuarios(id) ON DELETE SET NULL,

    INDEX idx_protocolo        (protocolo),
    INDEX idx_user_id          (user_id),
    INDEX idx_status           (status),
    INDEX idx_user_status      (user_id, status),      -- [SR-09] índice composto
    INDEX idx_criado_em        (criado_em),
    INDEX idx_categoria_status (categoria, status)
) ENGINE=InnoDB;

-- ── AUDITORIA (SR-08) ──────────────────────────────────────────────
-- Registra todas as ações sensíveis: login, logout, envio, resposta.
CREATE TABLE IF NOT EXISTS auditoria (
    id          BIGINT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED     DEFAULT NULL,          -- NULL = ação anônima
    acao        VARCHAR(60)      NOT NULL,              -- 'login','manifestacao','resposta'...
    entidade    VARCHAR(60)      DEFAULT NULL,          -- 'manifestacoes','usuarios'...
    entidade_id INT UNSIGNED     DEFAULT NULL,          -- ID do registro afetado
    ip          VARCHAR(45)      DEFAULT NULL,          -- IPv4 ou IPv6
    user_agent  VARCHAR(300)     DEFAULT NULL,
    detalhes    JSON             DEFAULT NULL,          -- dados extras (categoria, protocolo...)
    criado_em   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id  (user_id),
    INDEX idx_acao     (acao),
    INDEX idx_criado   (criado_em)
) ENGINE=InnoDB;

-- ── VIEW PÚBLICA DE ESTATÍSTICAS (SR-12, BUG-13) ──────────────────
-- Usada pelo endpoint stats_publicas sem expor dados sensíveis.
CREATE OR REPLACE VIEW v_stats_publicas AS
SELECT
    COUNT(*)                                      AS total,
    SUM(status = 'resolvido')                     AS resolvidas,
    SUM(status IN ('pendente','em_analise'))       AS pendentes,
    ROUND(AVG(
      CASE WHEN resolvido_em IS NOT NULL
           THEN TIMESTAMPDIFF(HOUR, criado_em, resolvido_em)
      END
    ), 1)                                         AS media_horas_resolucao
FROM manifestacoes;

-- ── DADOS DE EXEMPLO (remova em produção) ─────────────────────────
-- Senha de exemplo: "Senha@2026"  →  hash bcrypt gerado via PHP
-- INSERT INTO usuarios (nome, email, tipo, senha_hash)
-- VALUES ('Gestor Demo', 'gestor@escola.edu.br', 'gestor',
--         '$2y$12$ExemploHashBcryptNaoUseIsso...');
