require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const productosRoutes = require('./routes/productosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const detalleClienteRoutes = require('./routes/detalleClienteRoutes');
const vehiculosRoutes = require('./routes/vehiculosRoutes');
const ubicacionesRoutes = require('./routes/ubicacionesRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
const promocionesRoutes = require('./routes/promocionesRoutes');
const bitacorasRoutes = require('./routes/bitacorasRoutes');
const ubicacionActualRoutes = require('./routes/ubicacionActualRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/clientes', detalleClienteRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/ubicaciones', ubicacionesRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/promociones', promocionesRoutes);
app.use('/api/bitacoras', bitacorasRoutes);
app.use('/api/ubicacion-actual', ubicacionActualRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
