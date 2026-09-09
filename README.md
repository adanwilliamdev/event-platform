# 🎟️ Palco — Plataforma de Eventos

Plataforma full stack para **gerenciamento de eventos, ingressos, reservas e pedidos**, desenvolvida com Node.js.

## 🛠️ Stack

![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?style=for-the-badge\&logo=node.js\&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge\&logo=express\&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge\&logo=sqlite\&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge\&logo=zod\&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge\&logo=jsonwebtokens\&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-333333?style=for-the-badge\&logo=websocket\&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge\&logo=stripe\&logoColor=white)

## ✨ Funcionalidades

* 🔐 Autenticação e autorização com JWT
* 👤 Gerenciamento de usuários
* 🎪 Criação e gerenciamento de eventos
* 🎟️ Controle e reserva de ingressos
* ⏳ Expiração automática de reservas
* 🛒 Criação e gerenciamento de pedidos
* 📱 Geração de QR Code
* ⚡ Atualizações em tempo real via WebSocket
* 💳 Integração opcional com Stripe
* 🌱 Seed com dados de demonstração

## 📁 Estrutura

```text
event-platform-node/
├── src/
│   ├── config/
│   ├── models/
│   ├── services/
│   ├── routers/
│   ├── middleware/
│   └── utils/
├── public/
├── package.json
├── .env.example
└── .gitignore
```

## 🚀 Como executar

**Requisitos:** Node.js 22.5+

```bash
npm install
npm start
```

Modo desenvolvimento:

```bash
npm run dev
```

Acesse:

```text
http://localhost:8000
```

O banco SQLite é criado automaticamente na primeira execução.

## ⚙️ Variáveis de ambiente

```env
PORT=8000
DATABASE_PATH=./eventplatform.db
JWT_SECRET=sua-chave-secreta
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

O Stripe é opcional. Sem as chaves configuradas, o sistema funciona em **modo demonstração**.

## 👥 Usuários de demonstração

```text
Organizador
organizador@eventos.com
organiza123

Administrador
admin@eventos.com
admin123
```

## 🔌 API

| Método | Endpoint                   | Descrição                  |
| ------ | -------------------------- | -------------------------- |
| `POST` | `/api/auth/register`       | Cadastro                   |
| `POST` | `/api/auth/login`          | Login                      |
| `GET`  | `/api/auth/me`             | Usuário autenticado        |
| `GET`  | `/api/events`              | Listar eventos             |
| `GET`  | `/api/events/upcoming`     | Próximos eventos           |
| `GET`  | `/api/events/:id`          | Detalhes do evento         |
| `POST` | `/api/events`              | Criar evento               |
| `GET`  | `/api/events/:id/tickets`  | Ingressos disponíveis      |
| `POST` | `/api/tickets/hold`        | Reservar ingresso          |
| `POST` | `/api/tickets/:id/release` | Liberar ingresso           |
| `POST` | `/api/orders`              | Criar pedido               |
| `GET`  | `/api/orders/me`           | Meus pedidos               |
| `GET`  | `/api/orders/:id`          | Detalhes do pedido         |
| `POST` | `/api/orders/:id/confirm`  | Confirmar pagamento        |
| `POST` | `/api/webhooks/stripe`     | Webhook Stripe             |
| `WS`   | `/ws/events/:id/tickets`   | Atualizações em tempo real |

## ☁️ Deploy

O projeto possui configuração para **Fly.io**, utilizando Docker e volume persistente para o banco SQLite.

```bash
fly launch --no-deploy
fly volumes create palco_data --region gru --size 1
fly secrets set JWT_SECRET="sua-chave-secreta"
fly deploy
```

> A aplicação utiliza estado em memória para controle de concorrência e WebSocket, sendo recomendada uma única instância para este modelo de deployment.

## 📄 Licença

Projeto desenvolvido para **estudo, portfólio e demonstração técnica**.
