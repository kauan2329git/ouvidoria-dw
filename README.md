# Ouvidoria Digital — EEEP Dom Walfrido Teixeira Vieira

Sistema web de ouvidoria escolar. PHP + jQuery + Bootstrap 5 + MySQL.

## Estrutura

```
ouvidoria-dw/
  api/
    auth.php          → API REST (login, cadastro, manifestação, consulta)
  assets/
    css/              → Estilos por página
    js/
      utils.js        → Utilitários globais (toast, csrfAjax, sessão)
      script.js       → Lógica de login e cadastro
      manifestacao.js → Homepage e formulários
  partials/
    nav.php           → Navbar unificada (include em todas as páginas)
  manifestacao.html   → Homepage principal
  login.html          → Autenticação
  cadastro.html       → Cadastro multi-step
  minhas-manifestacoes.html → Histórico do usuário
  consulta.html       → Consulta pública de protocolo
  banco.sql           → Schema do banco de dados
  config.example.php  → Template de configuração (copie para config.php)
  .gitignore          → config.php e .env nunca versionados
```

## Configuração

1. Crie o banco de dados: `mysql -u root -p < banco.sql`
2. Copie o template de config: `cp config.example.php config.php`
3. Edite `config.php` com suas credenciais reais
4. Aponte o servidor para a pasta raiz do projeto

## Segurança

- **Nunca versione `config.php`** — já está no `.gitignore`
- O diretório `uploads/` é criado automaticamente pela API
- O diretório `logs/` é criado automaticamente para erros de servidor

## Bugs corrigidos (v2.0)

Veja `relatorio-bugs-ouvidoria.docx` para o relatório completo.
16 bugs corrigidos, incluindo: navbar dessincronizada, classe CSS inexistente,
CSRF, protocolo seguro com random_int(), upload de anexo, credenciais externas.
