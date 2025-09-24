const Estudiante = require('../models/Estudiante');

async function obtenerEstadisticas() {
  const totalEstudiantes = await Estudiante.countDocuments();
  const estadisticasArchetype = await Estudiante.aggregate([
    { $group: { _id: '$resultado.archetypeId', nombre: { $first: '$resultado.nombreArchetype' }, programa: { $first: '$resultado.programa' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 30);
  const estudiantesUltimos30Dias = await Estudiante.countDocuments({ fechaCompletado: { $gte: fechaLimite } });
  return { totalEstudiantes, estudiantesUltimos30Dias, estadisticasArchetype };
}

module.exports = { obtenerEstadisticas };
