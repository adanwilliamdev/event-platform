'use strict';
const UserModel = require('../models/User');
const EventModel = require('../models/Event');
const TicketModel = require('../models/Ticket');
const { Role, TicketStatus } = require('../models/enums');
const { hashPassword } = require('./security');

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function seedDemoData() {
  if (UserModel.count() > 0) {
    return;
  }

  const admin = UserModel.create({
    name: 'Admin da Plataforma',
    email: 'admin@eventos.com',
    passwordHash: hashPassword('admin123'),
    role: Role.ADMIN,
  });

  const organizer = UserModel.create({
    name: 'Ana Organizadora',
    email: 'organizador@eventos.com',
    passwordHash: hashPassword('organiza123'),
    role: Role.ORGANIZER,
  });

  const now = new Date();

  const demoEvents = [
    {
      title: 'Festival de Música Eletrônica',
      description:
        'Uma noite inesquecível com os melhores DJs da cena eletrônica nacional e internacional, luzes, som de alta potência e muita energia.',
      date: addDays(now, 21),
      location: 'Arena Central, São Paulo - SP',
      totalCapacity: 60,
      price: 180.0,
    },
    {
      title: 'Conferência de Tecnologia & Inovação',
      description:
        'Palestras, workshops e networking com os principais nomes da tecnologia, startups e inteligência artificial.',
      date: addDays(now, 10),
      location: 'Centro de Convenções, Belo Horizonte - MG',
      totalCapacity: 40,
      price: 350.0,
    },
    {
      title: 'Stand-up Comedy Night',
      description: 'Uma noite de muitas risadas com comediantes renomados do circuito nacional.',
      date: addDays(now, 5),
      location: 'Teatro Municipal, Rio de Janeiro - RJ',
      totalCapacity: 25,
      price: 90.0,
    },
    {
      title: 'Feira Gastronômica Internacional',
      description:
        'Experimente pratos de mais de 20 países em um só lugar, com chefs renomados e atrações culturais.',
      date: addDays(now, 35),
      location: 'Parque das Nações, Curitiba - PR',
      totalCapacity: 80,
      price: 60.0,
    },
  ];

  for (const spec of demoEvents) {
    const event = EventModel.create({
      title: spec.title,
      description: spec.description,
      date: spec.date.toISOString(),
      location: spec.location,
      organizerId: organizer.id,
      totalCapacity: spec.totalCapacity,
      availableTickets: spec.totalCapacity,
    });

    const rows = [];
    for (let i = 1; i <= spec.totalCapacity; i++) {
      rows.push({
        eventId: event.id,
        seatNumber: `SEAT-${i}`,
        price: spec.price,
        status: TicketStatus.AVAILABLE,
      });
    }
    TicketModel.createMany(rows);
  }

  console.log('Dados de demonstração criados com sucesso.');
}

module.exports = { seedDemoData };
