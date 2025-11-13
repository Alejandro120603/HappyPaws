const express = require('express');
const cors = require('cors');
const apiRouter = require('./api');
const { connection } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ mensaje: 'Servidor HappyPaws en funcionamiento.' });
});

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

app.use((err, _req, res, _next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor HappyPaws escuchando en http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  connection.close();
  process.exit(0);
});
