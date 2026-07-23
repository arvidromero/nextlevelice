const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');

(async () => {
  const hash = await bcrypt.hash('Pecos1404', 10);
  await prisma.usuario.update({
    where: { email: 'arvidromero@gmail.com' },
    data: { passwordHash: hash },
  });
  console.log('Password asignado');
  process.exit();
})();