# 🎟️ Palco — Plataforma de Eventos

> Plataforma completa para **criação, gerenciamento e venda de ingressos para eventos**, desenvolvida com FastAPI e uma interface web moderna, responsiva e fluida.

O **Palco** permite que organizadores criem e gerenciem eventos, disponibilizem ingressos e acompanhem sua disponibilidade em tempo real. Usuários podem explorar eventos, reservar ingressos, realizar pedidos e acessar seus ingressos digitais com QR Code.

A aplicação foi projetada com foco em **simplicidade, segurança, concorrência e experiência do usuário**, utilizando uma arquitetura enxuta e sem dependências de infraestrutura externa para execução local.

---

## ✨ Funcionalidades

### 👤 Autenticação e usuários

* Cadastro de usuários
* Login com autenticação JWT
* Senhas armazenadas com hash seguro
* Recuperação dos dados do usuário autenticado
* Controle de acesso baseado em funções

### 🎫 Eventos e ingressos

* Criação e gerenciamento de eventos
* Listagem de eventos disponíveis
* Eventos futuros
* Visualização detalhada de eventos
* Controle de disponibilidade dos ingressos
* Reserva temporária de ingressos
* Liberação automática de reservas expiradas
* Controle de status dos ingressos:

  * `AVAILABLE`
  * `RESERVED`
  * `SOLD`

### 🛒 Pedidos e checkout

* Criação de pedidos
* Reserva de ingressos durante o checkout
* Confirmação de pagamento
* Histórico de pedidos
* Consulta detalhada dos pedidos
* Integração opcional com Stripe
* Modo demonstração para pagamentos sem configuração externa

### 📱 Ingressos digitais

* Geração automática de QR Code
* Visualização dos ingressos adquiridos
* Identificação do ingresso através de QR Code
* Disponibilização do ingresso diretamente na plataforma

### ⚡ Atualização em tempo real

A disponibilidade dos ingressos é atualizada em tempo real através de WebSockets.

Quando um ingresso é reservado, liberado ou vendido, os clientes conectados ao evento recebem a atualização automaticamente.

```text
Cliente A reserva ingresso
        ↓
     Backend
        ↓
Atualização do ingresso
        ↓
   WebSocket
        ↓
Clientes conectados
        ↓
Disponibilidade atualizada
```

---

## 🔐 Perfis de acesso

O sistema possui três níveis de acesso:

| Perfil      | Permissões                                                   |
| ----------- | ------------------------------------------------------------ |
| `CLIENT`    | Navegar pelos eventos, reservar ingressos e realizar pedidos |
| `ORGANIZER` | Criar e gerenciar eventos e ingressos                        |
| `ADMIN`     | Gerenciamento administrativo da plataforma                   |

Novos usuários são cadastrados automaticamente como `CLIENT`.

---

## 🏗️ Arquitetura

A aplicação utiliza uma arquitetura organizada por responsabilidades, separando autenticação, regras de negócio, persistência, comunicação em tempo real e interface.

```text
┌─────────────────────────────────────────────┐
│                 Frontend                    │
│          HTML + CSS + JavaScript             │
└──────────────────────┬──────────────────────┘
                       │
                       │ HTTP / WebSocket
                       ▼
┌─────────────────────────────────────────────┐
│                  FastAPI                    │
│                                             │
│  ┌────────────┐  ┌────────────┐             │
│  │   Routers  │  │    Auth    │             │
│  └────────────┘  └────────────┘             │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │             Services                 │   │
│  │ Auth • Events • Tickets • Orders      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌────────────┐  ┌────────────┐             │
│  │ WebSocket  │  │ Background │             │
│  └────────────┘  └────────────┘             │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   SQLAlchemy   │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │ SQLite /        │
              │ PostgreSQL      │
              └────────────────┘
```

---

## 🧰 Tecnologias

### Backend

* **Python 3**
* **FastAPI**
* **SQLAlchemy**
* **Pydantic**
* **Uvicorn**
* **python-jose**
* **bcrypt**
* **WebSockets**

### Banco de dados

* **SQLite** para desenvolvimento
* **PostgreSQL** recomendado para produção
* Suporte configurável através de `DATABASE_URL`

### Frontend

* **HTML5**
* **CSS3**
* **JavaScript**
* Interface responsiva
* Comunicação com API REST
* Atualizações em tempo real via WebSocket

### Pagamentos

* **Stripe** opcional
* Modo demonstração disponível sem configuração de credenciais

### Outros

* QR Code
* Background tasks
* Controle de concorrência para reservas
* API REST
* WebSocket

---

## 🔄 Fluxo de reserva

Um dos principais pontos da plataforma é o controle de concorrência durante a reserva de ingressos.

```text
1. Usuário seleciona um ingresso
            ↓
2. Sistema verifica disponibilidade
            ↓
3. Ingresso é bloqueado temporariamente
            ↓
4. Status → RESERVED
            ↓
5. Usuário realiza o checkout
            ↓
       ┌────┴────┐
       ↓         ↓
   Pagamento   Expiração
   confirmado    10 min
       ↓         ↓
   SOLD       AVAILABLE
```

As reservas possuem validade de **10 minutos**.

Caso o pedido não seja confirmado dentro desse período, o ingresso é liberado automaticamente e volta a ficar disponível.

---

## 💳 Pagamentos

O Stripe pode ser configurado para processar pagamentos reais.

Sem uma chave do Stripe configurada, o sistema utiliza um **modo demonstração**, permitindo testar todo o fluxo de compra sem realizar uma transação financeira real.

### Stripe

Configure:

```env
STRIPE_SECRET_KEY=sua_chave
STRIPE_WEBHOOK_SECRET=seu_webhook_secret
```

O webhook utilizado pela aplicação é:

```text
POST /api/webhooks/stripe
```

---

## 📁 Estrutura do projeto

```text
event-platform-py/
│
├── app/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   ├── deps.py
│   ├── qr.py
│   ├── locks.py
│   ├── ws_manager.py
│   ├── background.py
│   │
│   ├── services/
│   │   ├── auth.py
│   │   ├── event.py
│   │   ├── ticket.py
│   │   └── order.py
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── events.py
│   │   ├── tickets.py
│   │   ├── orders.py
│   │   └── websocket.py
│   │
│   └── static/
│       ├── index.html
│       ├── css/
│       └── js/
│
├── requirements.txt
├── eventplatform.db
└── README.md
```

### Organização

| Diretório / Arquivo | Responsabilidade                           |
| ------------------- | ------------------------------------------ |
| `main.py`           | Inicialização da aplicação e ciclo de vida |
| `models.py`         | Modelos do banco de dados                  |
| `schemas.py`        | Schemas de entrada e saída                 |
| `security.py`       | JWT e segurança de autenticação            |
| `deps.py`           | Dependências de autenticação e autorização |
| `services/`         | Regras de negócio                          |
| `routers/`          | Endpoints HTTP e WebSocket                 |
| `locks.py`          | Controle de concorrência das reservas      |
| `background.py`     | Limpeza de reservas expiradas              |
| `ws_manager.py`     | Gerenciamento das conexões WebSocket       |
| `qr.py`             | Geração dos QR Codes                       |
| `static/`           | Interface web                              |

---

## 🚀 Como executar

### 1. Clone o projeto

```bash
git clone <URL_DO_REPOSITORIO>
cd event-platform-py
```

### 2. Crie o ambiente virtual

#### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Inicie a aplicação

```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Acesse

Aplicação:

```text
http://localhost:8000
```

Documentação interativa da API:

```text
http://localhost:8000/docs
```

Documentação alternativa:

```text
http://localhost:8000/redoc
```

O banco SQLite é criado automaticamente na primeira execução. Finalmente, uma aplicação que não exige uma pequena procissão de containers só para mostrar uma tela de login.

---

## 👥 Usuários de demonstração

O projeto já possui usuários e eventos de exemplo para facilitar os testes.

### Organizador

```text
E-mail: organizador@eventos.com
Senha: organiza123
Perfil: ORGANIZER
```

### Administrador

```text
E-mail: admin@eventos.com
Senha: admin123
Perfil: ADMIN
```

Novos usuários cadastrados pela plataforma recebem automaticamente o perfil:

```text
CLIENT
```

> **Importante:** essas credenciais existem apenas para ambiente de demonstração. Não utilize essas senhas em produção.

---

## 🔌 API

### 🔑 Autenticação

| Método | Endpoint             | Descrição                 |
| ------ | -------------------- | ------------------------- |
| `POST` | `/api/auth/register` | Cadastrar usuário         |
| `POST` | `/api/auth/login`    | Autenticar usuário        |
| `GET`  | `/api/auth/me`       | Obter usuário autenticado |

### 🎪 Eventos

| Método | Endpoint                   | Descrição               |
| ------ | -------------------------- | ----------------------- |
| `GET`  | `/api/events`              | Listar eventos          |
| `GET`  | `/api/events/upcoming`     | Listar próximos eventos |
| `GET`  | `/api/events/{id}`         | Detalhes do evento      |
| `POST` | `/api/events`              | Criar evento            |
| `GET`  | `/api/events/{id}/tickets` | Listar ingressos        |

### 🎟️ Ingressos

| Método | Endpoint                    | Descrição         |
| ------ | --------------------------- | ----------------- |
| `POST` | `/api/tickets/hold`         | Reservar ingresso |
| `POST` | `/api/tickets/{id}/release` | Liberar ingresso  |

### 🛒 Pedidos

| Método | Endpoint                   | Descrição                 |
| ------ | -------------------------- | ------------------------- |
| `POST` | `/api/orders`              | Criar pedido              |
| `GET`  | `/api/orders/me`           | Listar pedidos do usuário |
| `GET`  | `/api/orders/{id}`         | Consultar pedido          |
| `POST` | `/api/orders/{id}/confirm` | Confirmar pagamento       |

### ⚡ WebSocket

```text
/ws/events/{id}/tickets
```

Utilizado para transmitir atualizações de disponibilidade dos ingressos em tempo real.

---

## ⚙️ Variáveis de ambiente

As configurações podem ser definidas através de variáveis de ambiente:

| Variável                | Padrão                         | Descrição                                  |
| ----------------------- | ------------------------------ | ------------------------------------------ |
| `DATABASE_URL`          | `sqlite:///./eventplatform.db` | URL do banco de dados                      |
| `JWT_SECRET`            | Chave de desenvolvimento       | Chave utilizada para assinatura dos tokens |
| `STRIPE_SECRET_KEY`     | Não definido                   | Chave da API do Stripe                     |
| `STRIPE_WEBHOOK_SECRET` | Não definido                   | Chave para validação dos webhooks          |

### Exemplo

```env
DATABASE_URL=sqlite:///./eventplatform.db
JWT_SECRET=sua_chave_secreta
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Para produção, utilize uma chave JWT forte e mantenha as credenciais fora do código-fonte.

---

## 🗄️ Banco de dados

Por padrão, o projeto utiliza SQLite:

```env
DATABASE_URL=sqlite:///./eventplatform.db
```

Para ambientes de produção, é possível utilizar PostgreSQL alterando a configuração:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/eventplatform
```

A camada de persistência é abstraída pelo SQLAlchemy, permitindo alterar o banco sem modificar as regras principais da aplicação.

---

## 🧪 Testando a API

Depois de iniciar o projeto, acesse:

```text
http://localhost:8000/docs
```

A interface do Swagger permite:

* Visualizar todos os endpoints
* Consultar schemas de requisição e resposta
* Realizar autenticação
* Executar requisições
* Testar o fluxo completo de eventos, ingressos e pedidos

---

## 📌 Principais regras de negócio

### Reserva de ingressos

```text
AVAILABLE
    │
    │ Reserva
    ▼
RESERVED
    │
    ├── Pagamento confirmado ──► SOLD
    │
    └── 10 minutos expirados ─► AVAILABLE
```

### Controle de acesso

```text
CLIENT
 └── Comprar ingressos

ORGANIZER
 ├── Gerenciar eventos
 └── Gerenciar ingressos

ADMIN
 └── Acesso administrativo
```

### Atualização em tempo real

```text
Evento
  │
  ├── Ingresso reservado
  ├── Ingresso liberado
  └── Ingresso vendido
          │
          ▼
     WebSocket
          │
          ▼
Clientes conectados
```

---

## 🎯 Objetivos do projeto

O Palco foi desenvolvido para demonstrar na prática conceitos importantes de desenvolvimento de aplicações web modernas:

* Desenvolvimento de APIs REST
* Autenticação e autorização com JWT
* Arquitetura baseada em serviços
* Persistência com SQLAlchemy
* Controle de concorrência
* Reservas com expiração
* Comunicação em tempo real
* Processamento assíncrono
* Integração com pagamentos
* Geração de QR Codes
* Separação de responsabilidades
* Desenvolvimento de interfaces responsivas

---

## 📸 Interface

A aplicação possui uma interface web responsiva desenvolvida para proporcionar uma experiência simples e intuitiva na descoberta de eventos, seleção de ingressos e acompanhamento dos pedidos.

---

## 📄 Licença

Este projeto está disponível para fins de estudo e demonstração.

---

<div align="center">

### 🎟️ Palco

**Plataforma de eventos, ingressos e experiências em tempo real.**

Desenvolvido com 🐍 Python + ⚡ FastAPI

</div>
