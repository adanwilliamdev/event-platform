# 🎟️ Palco — Plataforma de Eventos

Plataforma full stack para **gerenciamento de eventos, ingressos, reservas e pedidos**, desenvolvida com **Node.js e Express**.

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

* 🔐 Autenticação com JWT
* 🎪 Gerenciamento de eventos
* 🎟️ Controle e reserva de ingressos
* ⏳ Expiração automática de reservas
* 🛒 Gerenciamento de pedidos
* 📱 Geração de QR Code
* ⚡ Atualizações em tempo real via WebSocket
* 💳 Integração opcional com Stripe

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
└── .env.example
```

## 🚀 Instalação

**Requisitos:** Node.js 22.5+

```bash
git clone https://github.com/SEU-USUARIO/event-platform-node.git
cd event-platform-node
npm install
npm start
```

Acesse:

```text
http://localhost:8000
```

Para desenvolvimento:

```bash
npm run dev
```

## 🔌 API

| Método | Endpoint                 | Descrição         |
| ------ | ------------------------ | ----------------- |
| POST   | `/api/auth/register`     | Cadastro          |
| POST   | `/api/auth/login`        | Login             |
| GET    | `/api/events`            | Eventos           |
| GET    | `/api/events/:id`        | Detalhes          |
| POST   | `/api/tickets/hold`      | Reservar ingresso |
| POST   | `/api/orders`            | Criar pedido      |
| GET    | `/api/orders/me`         | Meus pedidos      |
| WS     | `/ws/events/:id/tickets` | Tempo real        |

## 👤 Demonstração

```text
Organizador
organizador@eventos.com
organiza123

Administrador
admin@eventos.com
admin123
```

## 📄 Licença

Projeto desenvolvido para **estudo, portfólio e demonstração técnica**.
