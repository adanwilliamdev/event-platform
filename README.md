# 🎟️ Encore — Event Platform

Plataforma completa para gerenciamento de eventos e venda de ingressos, com reserva temporária de assentos, checkout, emissão de pedidos e atualização de disponibilidade em tempo real via WebSocket.

---

## ✨ Funcionalidades

- Cadastro e autenticação de usuários com JWT
- Catálogo de eventos
- Criação e gerenciamento de eventos
- Reserva temporária de ingressos utilizando Redis
- Compra e emissão de pedidos
- Atualização de disponibilidade em tempo real via WebSocket
- Controle de permissões por papéis (CLIENT, ORGANIZER e ADMIN)
- Migrações automáticas do banco com Liquibase

---

# 🛠️ Tecnologias

## Backend

- Java 17
- Spring Boot 3.2.3
- Spring Security + JWT
- Spring Data JPA
- Hibernate
- Liquibase
- Redis
- RabbitMQ
- WebSocket (STOMP)
- PostgreSQL 16

## Frontend

- React 18
- TypeScript
- Vite 5
- Tailwind CSS
- React Router
- Axios
- STOMP.js
- SockJS

## Infraestrutura

- Docker Compose
- PostgreSQL
- Redis
- RabbitMQ

---

# 📋 Pré-requisitos

- Java 17 (JDK)
- Maven
- Node.js 18+
- Docker Desktop

---

# 🚀 Como executar

## 1. Inicie a infraestrutura

```bash
docker-compose up -d
```

Serviços disponíveis:

| Serviço | Porta |
|----------|------:|
| PostgreSQL | 5433 |
| Redis | 6379 |
| RabbitMQ | 5672 |
| RabbitMQ Management | 15672 |

---

## 2. Executar o Backend

```bash
cd backend
mvn spring-boot:run
```

API disponível em:

```
http://localhost:8080
```

As migrations são executadas automaticamente pelo Liquibase na inicialização.

---

## 3. Executar o Frontend

```bash
cd frontend

npm install

npm run dev
```

Aplicação disponível em:

```
http://localhost:5173
```

---

# 👤 Primeiro acesso

Cadastre um usuário através da tela de registro.

Por padrão, todos os novos usuários recebem o papel:

```
CLIENT
```

Os papéis **ADMIN** e **ORGANIZER** podem ser atribuídos diretamente no banco de dados ou por uma futura interface administrativa.

---

# 📂 Estrutura do Projeto

```text
event-platform/
│
├── backend/
│   ├── config/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── exception/
│   ├── repository/
│   ├── security/
│   ├── service/
│   ├── util/
│   ├── websocket/
│   └── resources/
│       ├── application.yml
│       └── db/changelog/
│
├── frontend/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   └── types/
│
└── docker-compose.yml
```

---

# 🔐 Papéis de Usuário

| Papel | Permissões |
|--------|------------|
| CLIENT | Visualizar eventos, reservar ingressos e acompanhar pedidos |
| ORGANIZER | Permissões de CLIENT + gerenciamento de eventos |
| ADMIN | Acesso completo ao sistema |

---

# ⚙️ Configuração

Antes de executar em produção, configure as seguintes propriedades:

- JWT Secret
- Banco de dados PostgreSQL
- SMTP (envio de e-mails)
- Stripe (pagamentos)

Essas configurações podem ser realizadas através do arquivo:

```
backend/src/main/resources/application.yml
```

ou utilizando variáveis de ambiente.

---

# 📡 Arquitetura

- API REST para operações principais
- Autenticação Stateless com JWT
- Comunicação assíncrona via RabbitMQ
- Cache e reservas temporárias utilizando Redis
- Atualizações em tempo real através de WebSocket (STOMP)
- Persistência com PostgreSQL
- Controle de versão do banco utilizando Liquibase

---

# 🚧 Próximas melhorias

- Testes automatizados
- Seed inicial de dados
- Dashboard administrativo
- Integração completa com Stripe
- Notificações por e-mail
- Deploy em ambiente cloud

---

# 📄 Licença

Projeto desenvolvido para fins de estudo e demonstração de arquitetura Full Stack utilizando Java, Spring Boot e React.