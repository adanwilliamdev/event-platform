# 🎟️ Palco — Plataforma de Eventos

> Plataforma Full Stack para **gerenciamento de eventos, ingressos, reservas e pedidos**, desenvolvida com Node.js e arquitetura modular.

O **Palco** permite gerenciar eventos, controlar a disponibilidade de ingressos, realizar reservas temporárias, processar pedidos e acompanhar alterações em tempo real através de WebSocket.

O projeto foi desenvolvido com foco em **boas práticas de desenvolvimento backend, segurança, concorrência, validação de dados e integração com serviços externos**.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-ES2023-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-333333?style=for-the-badge&logo=websocket&logoColor=white" />
  <img src="https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## ✨ Funcionalidades

### 🔐 Autenticação e usuários

* Cadastro de usuários
* Login com autenticação JWT
* Autorização baseada em perfil
* Consulta do usuário autenticado
* Controle de acesso às operações protegidas

### 🎪 Eventos

* Criação e gerenciamento de eventos
* Listagem de eventos
* Consulta de próximos eventos
* Visualização detalhada
* Gerenciamento de ingressos associados

### 🎟️ Ingressos

* Controle de disponibilidade
* Reserva temporária
* Liberação de ingressos
* Expiração automática de reservas
* Controle de concorrência por ingresso

### 🛒 Pedidos

* Criação de pedidos
* Consulta dos pedidos do usuário
* Detalhamento de pedidos
* Confirmação de pagamento
* Geração de QR Code

### ⚡ Tempo real

* Comunicação através de WebSocket
* Atualização da disponibilidade de ingressos em tempo real
* Notificação dos clientes conectados após alterações nas reservas

### 💳 Pagamentos

* Integração opcional com Stripe
* Processamento através de webhook
* Modo demonstração sem necessidade de configuração do Stripe

### 🌱 Dados de demonstração

* Seed com dados iniciais
* Usuários de teste
* Eventos e ingressos para demonstração

---

## 🏗️ Arquitetura

```text
event-platform-node/
│
├── src/
│   ├── config/          # Configurações
│   ├── middleware/      # Middlewares e autenticação
│   ├── models/          # Persistência e acesso aos dados
│   ├── routers/         # Rotas HTTP e WebSocket
│   ├── services/        # Regras de negócio
│   ├── utils/           # Utilitários e tarefas auxiliares
│   └── schemas.js       # Validação com Zod
│
├── public/              # Arquivos públicos
├── package.json
├── Dockerfile
├── .env.example
└── .gitignore
```

A aplicação utiliza uma arquitetura modular, separando **rotas, regras de negócio, persistência, validação e infraestrutura**.

---

## 🧰 Stack

| Tecnologia            | Finalidade               |
| --------------------- | ------------------------ |
| **Node.js 22+**       | Runtime                  |
| **Express**           | API REST                 |
| **JavaScript ES2023** | Desenvolvimento          |
| **SQLite**            | Banco de dados           |
| **node:sqlite**       | Persistência             |
| **Zod**               | Validação                |
| **JWT**               | Autenticação             |
| **ws**                | WebSocket                |
| **Stripe**            | Pagamentos               |
| **QR Code**           | Identificação de pedidos |
| **Docker**            | Containerização          |
| **Fly.io**            | Deploy                   |

---

## 🔄 Fluxo principal

```text
┌─────────────┐
│    Usuário  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Seleciona evento│
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│ Reserva ingresso  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Cria pedido     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Confirma pagamento│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    QR Code        │
└──────────────────┘
```

Reservas não confirmadas são automaticamente liberadas após o período de expiração.

---

## 🔒 Controle de concorrência

O sistema possui um mecanismo de **mutex por ingresso** para evitar que múltiplas requisições concorrentes reservem o mesmo ticket simultaneamente.

```text
Cliente A ──┐
            │
            ▼
         ┌───────┐
         │ Mutex │
         └───┬───┘
             │
             ▼
          Ticket
             ▲
             │
Cliente B ───┘
```

Esse mecanismo garante exclusividade durante a operação de reserva.

---

## ⏳ Expiração automática

Reservas temporárias possuem tempo de expiração.

Um processo em background verifica periodicamente as reservas pendentes e libera automaticamente os ingressos expirados.

```text
Reserva criada
      │
      ▼
Tempo de expiração
      │
      ▼
Verificação automática
      │
      ▼
Reserva expirada
      │
      ▼
Ingresso liberado
```

---

## 🔌 API

### Autenticação

| Método | Endpoint             | Descrição           |
| ------ | -------------------- | ------------------- |
| `POST` | `/api/auth/register` | Cadastro            |
| `POST` | `/api/auth/login`    | Login               |
| `GET`  | `/api/auth/me`       | Usuário autenticado |

### Eventos

| Método | Endpoint                  | Descrição             |
| ------ | ------------------------- | --------------------- |
| `GET`  | `/api/events`             | Listar eventos        |
| `GET`  | `/api/events/upcoming`    | Próximos eventos      |
| `GET`  | `/api/events/:id`         | Detalhes do evento    |
| `POST` | `/api/events`             | Criar evento          |
| `GET`  | `/api/events/:id/tickets` | Ingressos disponíveis |

### Ingressos

| Método | Endpoint                   | Descrição         |
| ------ | -------------------------- | ----------------- |
| `POST` | `/api/tickets/hold`        | Reservar ingresso |
| `POST` | `/api/tickets/:id/release` | Liberar ingresso  |

### Pedidos

| Método | Endpoint                  | Descrição           |
| ------ | ------------------------- | ------------------- |
| `POST` | `/api/orders`             | Criar pedido        |
| `GET`  | `/api/orders/me`          | Meus pedidos        |
| `GET`  | `/api/orders/:id`         | Detalhes do pedido  |
| `POST` | `/api/orders/:id/confirm` | Confirmar pagamento |

### Stripe

| Método | Endpoint               | Descrição            |
| ------ | ---------------------- | -------------------- |
| `POST` | `/api/webhooks/stripe` | Webhook de pagamento |

### WebSocket

```text
WS /ws/events/:id/tickets
```

Utilizado para atualização da disponibilidade dos ingressos em tempo real.

---

## 🚀 Como executar

### Requisitos

* Node.js **22.5+**
* npm

### Instalação

```bash
git clone https://github.com/adanwilliamdev/palco.git

cd palco

npm install
```

### Configuração

Crie um arquivo `.env` baseado no `.env.example`:

```env
PORT=8000
DATABASE_PATH=./eventplatform.db

JWT_SECRET=sua-chave-secreta

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Executar

```bash
npm start
```

### Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:8000
```

O banco SQLite é criado automaticamente na primeira execução.

---

## 👥 Usuários de demonstração

### Organizador

```text
E-mail: organizador@eventos.com
Senha: organiza123
```

### Administrador

```text
E-mail: admin@eventos.com
Senha: admin123
```

> ⚠️ As credenciais são destinadas exclusivamente ao ambiente de demonstração.

---

## 💳 Configuração do Stripe

O Stripe é opcional.

Sem as credenciais configuradas, a aplicação funciona normalmente em **modo demonstração**.

Para habilitar a integração:

```env
STRIPE_SECRET_KEY=sua-chave
STRIPE_WEBHOOK_SECRET=seu-webhook-secret
```

---

## 🐳 Docker

Build da imagem:

```bash
docker build -t palco .
```

Execução:

```bash
docker run \
  -p 8000:8000 \
  -e JWT_SECRET="sua-chave-secreta" \
  palco
```

---

## ☁️ Deploy

O projeto possui configuração para deploy no **Fly.io**, utilizando Docker e volume persistente para o banco SQLite.

```bash
fly launch --no-deploy

fly volumes create palco_data \
  --region gru \
  --size 1

fly secrets set JWT_SECRET="sua-chave-secreta"

fly deploy
```

### ⚠️ Escalabilidade

A aplicação mantém informações de concorrência e conexões WebSocket em memória.

Por isso, o modelo atual é indicado para **uma única instância**.

Para escalabilidade horizontal, seria necessário externalizar o estado compartilhado, utilizando uma solução como Redis e uma estratégia de distribuição das conexões WebSocket.

---

## 🧪 Conceitos demonstrados

O projeto aplica conhecimentos práticos em:

* API REST
* Arquitetura modular
* Autenticação e autorização
* JWT
* Validação de dados
* SQLite
* Controle de concorrência
* Programação assíncrona
* WebSocket
* Background jobs
* Webhooks
* Integração com APIs externas
* Pagamentos
* QR Code
* Docker
* Deploy em cloud

---

## 📌 Roadmap

* [ ] Documentação OpenAPI / Swagger
* [ ] Testes automatizados
* [ ] Redis para estado compartilhado
* [ ] Suporte a múltiplas instâncias
* [ ] Observabilidade e métricas
* [ ] Pipeline CI/CD

---

## 📄 Licença

Projeto desenvolvido para **estudo, portfólio e demonstração técnica**.

---

<p align="center">

### 🎟️ Palco

**Event Platform • Node.js • Express • WebSocket • Stripe**

</p>
