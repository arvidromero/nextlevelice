const prisma = require('./src/config/db');

(async () => {
  await prisma.usuario.update({
    where: { email: 'samm091002@gmail.com' },
    data: { pin: '1234' },
  });
  console.log('PIN asignado');
  process.exit();
})();