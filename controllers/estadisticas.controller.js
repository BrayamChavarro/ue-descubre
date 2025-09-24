const { obtenerEstadisticas } = require('../services/estadisticas.service');

async function estadisticas(req, res, next) {
  try {
    const data = await obtenerEstadisticas();
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

module.exports = { estadisticas };
