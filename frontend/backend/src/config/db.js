const { PrismaClient } = require('@prisma/client');

// Un solo cliente de Prisma para toda la app (evita abrir demasiadas conexiones)
const prisma = new PrismaClient();

module.exports = prisma;
