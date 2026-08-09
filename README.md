# Palco — Plataforma de Eventos (100% Python)

Conversão completa do projeto original (**Spring Boot + Java** no backend, **React/TypeScript**
no frontend) para uma stack **100% Python**, mantendo toda a lógica de negócio e
adicionando uma interface nova, fluida e com identidade visual própria.

## O que mudou em relação ao projeto original

| Original (Java) | Nova versão (Python) |
|---|---|
| Spring Boot + Spring Security | **FastAPI** |
| JPA / Hibernate + PostgreSQL | **SQLAlchemy** + SQLite (zero config; troque por Postgres via `DATABASE_URL`) |
| Spring Security + JWT | JWT próprio (`python-jose`) + `bcrypt` |
| RabbitMQ (fila de confirmação) | Tarefa assíncrona interna (`asyncio`) — sem infraestrutura extra |
| Redis (hold de ingresso) | Lock em memória por ingresso + expiração automática via job em background |
| STOMP / WebSocket (Spring) | **WebSocket nativo do FastAPI** (`/ws/events/{id}/tickets`) |
| E-mail com QR code anexado | QR code gerado sob demanda e exibido direto em "Meus Ingressos" |
| Stripe (obrigatório) | Stripe **opcional** — sem chave configurada, o checkout roda em modo demonstração (confirma o pagamento com um clique, sem custo) |
| React + Vite + Tailwind | **HTML + CSS + JavaScript puro**, sem build step, servidos pelo próprio FastAPI |

Toda a regra de negócio foi preservada: reserva de assento com expiração de 10 minutos,
liberação automática de reservas expiradas, transição de status do ingresso
(`AVAILABLE → RESERVED → SOLD`), papéis de usuário (`ADMIN`, `ORGANIZER`, `CLIENT`) com
permissões, e atualização de disponibilidade em tempo real via WebSocket.

## Como rodar

```bash
cd event-platform-py
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

Acesse **http://localhost:8000** — pronto, sem Docker, sem banco externo, sem fila de
mensagens. Um banco SQLite (`eventplatform.db`) é criado automaticamente na primeira
execução, já populado com 2 usuários e 4 eventos de demonstração:

- **Organizador:** `organizador@eventos.com` / `organiza123`
- **Admin:** `admin@eventos.com` / `admin123`

Qualquer novo cadastro entra como `CLIENT`. Apenas `ADMIN`/`ORGANIZER` podem criar eventos.

## Variáveis de ambiente (opcionais)

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./eventplatform.db` | Aponte para Postgres/MySQL em produção |
| `JWT_SECRET` | chave de desenvolvimento | **Troque em produção** |
| `STRIPE_SECRET_KEY` | não definido | Se definido, ativa pagamentos reais via Stripe |
| `STRIPE_WEBHOOK_SECRET` | não definido | Necessário para validar o webhook `/api/webhooks/stripe` |

## Estrutura

```
app/
  main.py            # app FastAPI, seed de dados, ciclo de vida
  models.py           # modelos SQLAlchemy (User, Event, Ticket, Order, OrderItem)
  schemas.py           # schemas Pydantic (request/response)
  security.py           # hashing de senha e JWT
  deps.py                 # dependências de autenticação/autorização
  qr.py                     # geração de QR code
  locks.py                   # locks em memória por ingresso
  ws_manager.py                # WebSocket broadcast (disponibilidade em tempo real)
  background.py                  # job de limpeza de reservas expiradas
  services/                        # regras de negócio (auth, event, ticket, order)
  routers/                          # rotas HTTP e WebSocket
  static/                            # frontend (HTML/CSS/JS puro)
requirements.txt
```

## Principais endpoints da API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/events`, `GET /api/events/upcoming`, `GET /api/events/{id}`, `POST /api/events`
- `GET /api/events/{id}/tickets`
- `POST /api/tickets/hold`, `POST /api/tickets/{id}/release`
- `POST /api/orders`, `GET /api/orders/me`, `GET /api/orders/{id}`, `POST /api/orders/{id}/confirm`
- `WS /ws/events/{id}/tickets`
- Documentação interativa automática em **`/docs`**
