# 🎟️ Palco — Plataforma de Eventos (Node.js)

> Conversão para **Node.js / Express** da plataforma de eventos originalmente escrita em **Python / FastAPI**.

Esta versão reproduz fielmente as regras de negócio, rotas e comportamento do backend original: autenticação JWT, gestão de eventos e ingressos, reservas com expiração, pedidos com QR Code, atualização em tempo real via WebSocket e webhook do Stripe (com modo demonstração).

---

## 🧰 Tecnologias

| Camada | Original (Python) | Node.js |
| --- | --- | --- |
| Framework web | FastAPI | Express |
| Banco de dados | SQLAlchemy + SQLite | `node:sqlite` (módulo nativo do Node.js, síncrono) |
| Validação | Pydantic | Zod |
| Senhas | passlib/bcrypt | bcryptjs |
| JWT | python-jose | jsonwebtoken |
| WebSocket | FastAPI WebSocket | pacote `ws`, ligado ao servidor HTTP |
| QR Code | qrcode + Pillow | pacote `qrcode` |
| Pagamentos | Stripe (opcional) | Stripe SDK (opcional) |

O frontend (`public/`) é o mesmo HTML/CSS/JavaScript puro do projeto original — nenhuma alteração foi necessária, pois ele já consumia apenas endpoints relativos (`/api/...` e `/ws/...`).

---

## 📁 Estrutura do projeto

```text
event-platform-node/
├── src/
│   ├── app.js            # montagem do Express (equivalente a main.py)
│   ├── server.js         # ponto de entrada: HTTP + WebSocket + seed + cleanup
│   ├── schemas.js         # validação de entrada (Zod) — equivalente a schemas.py
│   ├── config/
│   │   └── database.js    # conexão SQLite + criação de schema
│   ├── models/            # camada de dados (equivalente a models.py)
│   │   ├── enums.js
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Ticket.js
│   │   ├── Order.js
│   │   └── OrderItem.js
│   ├── services/          # regras de negócio (equivalente a services/)
│   │   ├── authService.js
│   │   ├── eventService.js
│   │   ├── ticketService.js
│   │   └── orderService.js
│   ├── routers/           # rotas HTTP e WebSocket (equivalente a routers/)
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── tickets.js
│   │   ├── orders.js
│   │   ├── webhooks.js
│   │   └── ws.js
│   ├── middleware/
│   │   ├── auth.js         # autenticação/autorização (equivalente a deps.py)
│   │   └── validate.js     # middleware de validação Zod
│   └── utils/
│       ├── security.js     # hash de senha + JWT (equivalente a security.py)
│       ├── locks.js        # mutex assíncrono por ingresso (equivalente a locks.py)
│       ├── wsManager.js     # broadcast de WebSocket (equivalente a ws_manager.py)
│       ├── qr.js            # geração de QR Code (equivalente a qr.py)
│       ├── background.js    # limpeza de reservas expiradas (equivalente a background.py)
│       ├── seed.js          # dados de demonstração
│       └── errors.js
├── public/                 # frontend estático (HTML/CSS/JS), sem alterações
├── package.json
├── .env.example
└── .gitignore
```

---

## 🚀 Como executar

> **Requisito**: Node.js **22.5 ou superior** (o projeto usa o módulo nativo `node:sqlite`, então não é preciso instalar nada além do Node — nenhuma ferramenta de build C++ é necessária). Verifique sua versão com `node -v`.

### 1. Instale as dependências

```bash
npm install
```

### 2. (Opcional) configure variáveis de ambiente

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `8000` | Porta do servidor HTTP |
| `DATABASE_PATH` | `./eventplatform.db` | Caminho do arquivo SQLite |
| `JWT_SECRET` | chave de desenvolvimento | Chave usada para assinar os tokens |
| `STRIPE_SECRET_KEY` | não definido | Ativa pagamentos reais via Stripe |
| `STRIPE_WEBHOOK_SECRET` | não definido | Necessário para validar o webhook do Stripe |

Sem `STRIPE_SECRET_KEY`, o sistema usa o **modo demonstração** (idêntico ao comportamento original).

### 3. Inicie a aplicação

```bash
npm start
```

Para reiniciar automaticamente a cada alteração de código (usa `node --watch`, nativo do Node 18+):

```bash
npm run dev
```

### 4. Acesse

```text
http://localhost:8000
```

O banco SQLite (`eventplatform.db`) é criado e populado automaticamente com dados de demonstração na primeira execução — as mesmas contas e eventos de exemplo do projeto original.

---

## 👥 Usuários de demonstração

```text
Organizador — organizador@eventos.com / organiza123
Administrador — admin@eventos.com / admin123
```

Novos usuários cadastrados via `/api/auth/register` recebem automaticamente o perfil `CLIENT`.

---

## 🔌 API

Os mesmos endpoints do backend original foram preservados (mesmos métodos, caminhos e formatos de resposta):

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Cadastrar usuário |
| `POST` | `/api/auth/login` | Autenticar usuário |
| `GET` | `/api/auth/me` | Usuário autenticado |
| `GET` | `/api/events` | Listar eventos |
| `GET` | `/api/events/upcoming` | Próximos eventos |
| `GET` | `/api/events/{id}` | Detalhes do evento |
| `POST` | `/api/events` | Criar evento (ADMIN/ORGANIZER) |
| `GET` | `/api/events/{id}/tickets` | Ingressos disponíveis |
| `POST` | `/api/tickets/hold` | Reservar ingresso |
| `POST` | `/api/tickets/{id}/release` | Liberar ingresso |
| `POST` | `/api/orders` | Criar pedido |
| `GET` | `/api/orders/me` | Pedidos do usuário |
| `GET` | `/api/orders/{id}` | Detalhes do pedido |
| `POST` | `/api/orders/{id}/confirm` | Confirmar pagamento |
| `POST` | `/api/webhooks/stripe` | Webhook do Stripe |
| `WS` | `/ws/events/{id}/tickets` | Atualizações de disponibilidade em tempo real |

> Este projeto não inclui documentação interativa (Swagger/OpenAPI) como o FastAPI gera automaticamente. Se desejar, o pacote `swagger-ui-express` pode ser adicionado posteriormente.

---

## 📌 Notas sobre a conversão

* **Banco de dados**: usa `node:sqlite` (`DatabaseSync`), o módulo de SQLite **embutido no próprio Node.js** desde a versão 22.5 — não é um pacote npm, então não há compilação nativa, `node-gyp` ou dependência de Visual Studio/Xcode/build-essential. Requer **Node.js 22.5 ou superior** (recomendado 22 LTS ou mais recente). É síncrono, o que simplifica a camada de dados (sem `await` em cada consulta) — as consultas foram escritas manualmente na pasta `models/`, seguindo exatamente as mesmas tabelas e relações do `models.py` original. Por ser uma feature experimental do Node, um aviso (`ExperimentalWarning`) aparece no console ao iniciar; isso é esperado e inofensivo.
* **Locks de concorrência**: o `threading.Lock` por ingresso foi substituído por um mutex assíncrono (`src/utils/locks.js`) baseado em encadeamento de Promises, apropriado para o modelo single-threaded do Node.js, mas preservando a mesma garantia de exclusividade por `ticket_id`.
* **WebSocket**: como o Express não tem suporte nativo a WebSocket, a rota `/ws/events/{id}/tickets` é tratada diretamente no evento `upgrade` do servidor HTTP (`src/routers/ws.js`), com o pacote `ws`.
* **Validação**: os DTOs Pydantic foram convertidos para schemas Zod (`src/schemas.js`), com mensagens de erro equivalentes.
* **Job de limpeza**: o loop assíncrono que liberava reservas expiradas a cada 60s foi convertido para `setInterval` (`src/utils/background.js`).
