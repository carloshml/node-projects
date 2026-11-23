# Boas práticas de segurança — projeto_game

> Segurança não deve ser uma etapa isolada no fim do projeto. Ela precisa fazer parte do ciclo de vida: concepção, desenvolvimento, revisão, testes, entrega, operação e manutenção.
>
> Este documento é um guia vivo. Ajuste as ferramentas e os prazos conforme o contexto do projeto.

**Projeto:** MMORPG Game of Thrones (`projeto_game`)  
**Última revisão:** 23/11/2026

---

## 1. Princípios

- **Segurança por padrão:** o comportamento padrão deve ser o mais restritivo possível.
- **Privilégio mínimo:** cada usuário, processo e serviço deve ter apenas o acesso necessário.
- **Defesa em profundidade:** não depender de uma única camada (validação, autorização, banco, proxy, logs).
- **Falhar de forma segura:** em caso de erro, negar acesso em vez de liberar.
- **Não confiar na entrada:** validar e normalizar dados no servidor, mesmo que o cliente já valide.
- **Automatizar o que for repetitivo:** análise estática, segredos, dependências e testes devem rodar em pipeline.
- **Rastreabilidade:** ações sensíveis precisam de log, auditoria e alerta.
- **Privacidade desde a concepção:** coletar o mínimo de dados e definir retenção.

---

## 2. Práticas recomendadas por etapa

### 2.1 Análise estática durante o desenvolvimento

Objetivo: encontrar falhas de segurança e qualidade antes do code review e antes do merge.

- Rodar análise estática localmente e no CI.
- Priorizar regras para injeção, XSS, SSRF, path traversal, segredos, criptografia fraca e controle de acesso.
- Tratar achados críticos como bloqueadores de merge.
- Revisar falsos positivos, mas registrar a decisão.

**Ferramentas sugeridas:**

- **Semgrep:** foco em segurança, regras rápidas e fáceis de integrar ao CI.
- **SonarQube:** qualidade geral, dívida técnica, bugs e security hotspots.
- **ESLint** com plugins de segurança para o código Node.js.
- **npm audit** para dependências.

Exemplo de execução local:

```bash
npx semgrep --config auto .
npm audit
```

### 2.2 Prevenção de vazamento de credenciais (pré-commit)

Objetivo: impedir que chaves, tokens, senhas e strings de conexão cheguem ao repositório.

- Nunca commitar `.env`, chaves privadas, tokens ou senhas.
- Manter um `.env.example` sem valores reais.
- Usar hooks de pré-commit para bloquear segredos.
- Ativar secret scanning no GitHub/GitLab.
- Se um segredo vazar, **rotacionar imediatamente**; remover do histórico não basta.

**Ferramenta sugerida:** **Gitleaks** no pre-commit e no CI.

Boas práticas complementares:

- Usar gerenciador de segredos em produção (Vault, AWS Secrets Manager, Doppler etc.).
- Separar credenciais por ambiente.
- Nunca reutilizar o segredo de sessão entre ambientes.
- Revisar logs para não gravar tokens, senhas ou cookies.

### 2.3 Revisão de segurança em Pull Requests

Objetivo: avaliar o impacto de segurança das mudanças antes do merge.

- Exigir pelo menos uma revisão humana em mudanças sensíveis.
- Usar checklist de segurança no template de PR.
- Revisar autorização, validação, tratamento de erros, logs e dependências.
- Em mudanças de arquitetura, exigir revisão adicional.

**Skills recomendadas (Trail of Bits):**

- **Differential Review:** revisar o impacto de segurança das alterações do diff.
- **Sharp Edges:** identificar interfaces e configurações que facilitam erros.
- **Insecure Defaults:** detectar padrões inseguros usados por padrão.

Essas skills ajudam, mas não substituem revisão humana contextual.

### 2.4 Testes de penetração com IA

Objetivo: testar comportamento real, permissões e acessos indevidos antes da entrega.

- Testar autenticação, autorização, IDOR, CSRF, XSS, injeção, rate limit e abuso de fluxos.
- Testar com usuários de papéis diferentes (jogador comum, administrador, anônimo).
- Testar o chat, endpoints administrativos, ordens, compra de aldeão e liquidação de batalhas.
- Fazer pentest em ambiente de staging, nunca em produção sem autorização.

**Ferramenta sugerida:** **Strix**, com agentes de IA para identificar falhas e sugerir correções. Complementar com **OWASP ZAP** e **Burp Suite**.

Cuidados:

- IA pode gerar falsos positivos e falsos negativos.
- Todo achado precisa de validação e correção testada.
- Não enviar dados reais ou segredos para ferramentas externas sem avaliação.

### 2.5 Auditoria de segurança em grandes releases

Objetivo: garantir robustez em mudanças de arquitetura, autenticação, banco ou infraestrutura.

- Fazer auditoria segmentada: autenticação, autorização, sessão, banco, APIs, front-end, dependências e deploy.
- Revisar threat model e trust boundaries.
- Gerar SBOM e revisar dependências.
- Definir plano de rollback e resposta a incidentes.

**Skill sugerida:** **Security Audit Skill (Cloudflare)**.

### 2.6 Rotina de monitoramento

Segurança continua depois do deploy.

- Acompanhar vulnerabilidades das tecnologias base: Node.js, Express, EJS, MongoDB, Socket.IO e dependências.
- Ativar **Dependabot** ou **Renovate**.
- Monitorar alertas do GitHub Advisory, npm audit e CVEs.
- Acompanhar fóruns e sites especializados das tecnologias usadas.
- Definir janela de atualização para correções críticas.
- Monitorar logs de login, falhas de autorização, erros 5xx e abuso do chat.
- Criar alertas para picos de erro e tentativas de força bruta.

---

## 3. Minha opinião e prioridades para este projeto

As ferramentas acima são importantes, mas o maior ganho vem de corrigir os fundamentos. Hoje, o `projeto_game` tem pontos de segurança mais urgentes do que adicionar mais scanners.

### 3.1 Diagnóstico rápido do projeto

| Risco | Onde está | Impacto | Prioridade |
|---|---|---|---|
| Senhas com MD5 | `UsuariosDAO` | Alto: hash quebrado facilmente | P0 |
| Segredo da sessão e URI do MongoDB no código | `config/server.js`, `config/dbConection.js` | Alto: exposição e impossibilidade de rotação | P0 |
| `express-session` com MemoryStore | `config/server.js` | Alto: perda de sessão e não escala | P0 |
| Ausência de papéis/RBAC | rotas administrativas | Alto: qualquer usuário logado acessa o admin | P0 |
| POSTs sem CSRF | ordens, admin, venda, compra | Alto: ações em nome do usuário | P0 |
| Sem Helmet/CSP e headers de segurança | Express | Médio/alto | P1 |
| Sem rate limit HTTP | login, ordens, admin | Médio/alto: força bruta e abuso | P1 |
| Sem testes de segurança | projeto inteiro | Alto: regressões silenciosas | P1 |
| Sem logs/auditoria de ações sensíveis | admin, chat, login | Médio | P1 |
| MongoDB sem autenticação/TLS em produção | conexão local | Alto se exposto | P1 |
| Chat sem persistência/auditoria | `chatServer` | Médio: abuso e perda de histórico | P2 |
| Dependências sem automação | `package.json` | Médio | P1 |

### 3.2 O que já está bom

- EJS escapa variáveis por padrão.
- O chat usa `textContent` no cliente, evitando HTML injetado.
- O Socket.IO exige sessão autenticada.
- O chat limita tamanho de mensagem e frequência.
- As operações críticas de ordem/compra usam atualização atômica no MongoDB.
- As respostas de erro do jogo evitam detalhes internos na maioria dos fluxos.

### 3.3 Ordem de implementação recomendada

1. **Segredos e configuração:** mover URI, segredo de sessão e portas para variáveis de ambiente; criar `.env.example`; rotacionar segredos.
2. **Senhas:** migrar MD5 para **Argon2id** ou **bcrypt**; re-hash no próximo login; invalidar sessões após troca de senha.
3. **Sessão:** usar store persistente (Redis ou MongoDB); cookies `HttpOnly`, `Secure` em produção e `SameSite=Lax`; renovar segredo.
4. **Autorização:** criar papéis (`jogador`, `admin`) e verificar permissão em todas as rotas administrativas; nunca confiar apenas em `req.session.autorizado`.
5. **CSRF:** proteger POSTs com token ou padrão equivalente (`csrf-csrf` ou implementação própria com SameSite + token).
6. **Headers e limites:** Helmet, CSP compatível com os scripts atuais, limite de body e rate limit por IP/usuário.
7. **Pipeline:** Gitleaks, Semgrep, `npm audit`, testes e build em cada PR.
8. **Observabilidade:** logs estruturados, auditoria de admin e alertas.
9. **Pentest e auditoria:** OWASP ZAP/Strix em staging; auditoria de release.
10. **Continuidade:** backups do MongoDB, teste de restauração e plano de resposta a incidentes.

### 3.4 O que eu não faria

- Não confiaria apenas em “security score” de ferramenta.
- Não ativaria dezenas de scanners sem alguém responsável por triagem.
- Não usaria IA para “provar” que o sistema é seguro.
- Não deixaria um segredo exposto no histórico do Git sem rotação.
- Não adicionaria CSP restritiva sem remover os `onclick` inline e testar todas as telas.

---

## 4. Pipeline mínimo recomendado

```text
Pré-commit
  └── Gitleaks
  └── lint

Pull request
  └── npm ci
  └── npm audit
  └── Semgrep
  └── testes automatizados
  └── revisão de segurança do diff

Staging
  └── OWASP ZAP / Strix
  └── testes de autorização e fluxos críticos

Release
  └── SBOM
  └── revisão de dependências
  └── plano de rollback

Produção
  └── Dependabot/Renovate
  └── alertas de erro e abuso
  └── monitoramento de CVEs
```

Comandos úteis:

```bash
npm ci
npm audit
npx semgrep --config auto .
gitleaks detect --source . --verbose
```

---

## 5. Checklist de segurança para Pull Requests

- [ ] A mudança altera autenticação, autorização ou sessão?
- [ ] Todas as entradas são validadas no servidor?
- [ ] IDs e objetos são verificados contra o usuário da sessão?
- [ ] Há proteção contra CSRF em requisições que alteram estado?
- [ ] Há rate limit onde faz sentido?
- [ ] A saída é escapada ou inserida com `textContent`?
- [ ] Erros não expõem stack trace, segredo ou dado sensível?
- [ ] Logs não registram senha, token ou cookie?
- [ ] A mudança adiciona dependência? Ela é necessária e está auditada?
- [ ] Há teste cobrindo o caminho de sucesso e o de negação?
- [ ] O impacto de segurança foi revisado por outra pessoa?

---

## 6. Roadmap sugerido

### 0–30 dias

- Variáveis de ambiente e `.env.example`.
- Hash de senha forte.
- Store de sessão persistente.
- RBAC nas rotas administrativas.
- CSRF nos POSTs.
- Helmet e rate limit.
- Gitleaks no pré-commit.

### 30–60 dias

- Semgrep e `npm audit` no CI.
- Dependabot/Renovate.
- Testes de autenticação, autorização e abuso.
- Logs de auditoria e alertas.
- Revisão de headers/CSP.

### 60–90 dias

- Pentest com OWASP ZAP/Strix.
- SBOM e política de atualização.
- Backups e teste de restauração.
- Threat model documentado.
- Auditoria de release com Security Audit Skill.

---

## 7. Ferramentas de referência

| Necessidade | Ferramentas |
|---|---|
| Análise estática | Semgrep, SonarQube, ESLint |
| Segredos | Gitleaks, secret scanning do GitHub |
| Revisão de PR | Trail of Bits: Differential Review, Sharp Edges, Insecure Defaults |
| Pentest | Strix, OWASP ZAP, Burp Suite |
| Auditoria de release | Security Audit Skill (Cloudflare) |
| Dependências | npm audit, Dependabot, Renovate, Snyk |
| SBOM | CycloneDX, Syft |
| Monitoramento | GitHub Advisory, CVE feeds, logs e alertas |

---

## 8. Observação final

Ferramentas não substituem contexto, ameaça modelada e revisão humana. O objetivo não é ter o maior número de scanners, mas reduzir risco real com processos que o time consegue manter. Para este projeto, os maiores ganhos vêm de **segredos, senhas, sessão, autorização e CSRF** — antes de qualquer ferramenta nova.
