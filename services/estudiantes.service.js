const Estudiante = require('../models/Estudiante');

async function registrar(data, meta) {
  const { nombre, email, telefono, respuestas, puntuaciones, resultado } = data;
  if (!nombre || !email || !telefono || !resultado) {
    const err = new Error('Faltan datos requeridos');
    err.status = 400;
    throw err;
  }
  const nuevo = new Estudiante({
    nombre,
    email,
    telefono,
    respuestas: respuestas || [],
    puntuaciones: puntuaciones || [],
    resultado,
    ip: meta.ip,
    userAgent: meta.userAgent
  });
  const guardado = await nuevo.save();
  return { id: guardado._id, nombre: guardado.nombre, resultado: guardado.resultado };
}

async function listar(query) {
  const { page = 1, limit = 20, archetype, fechaDesde, fechaHasta } = query;
  const filtros = {};
  if (archetype) filtros['resultado.archetypeId'] = parseInt(archetype);
  if (fechaDesde || fechaHasta) {
    filtros.fechaCompletado = {};
    if (fechaDesde) filtros.fechaCompletado.$gte = new Date(fechaDesde);
    if (fechaHasta) filtros.fechaCompletado.$lte = new Date(fechaHasta);
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Estudiante.find(filtros).sort({ fechaCompletado: -1 }).skip(skip).limit(limit).select('-__v'),
    Estudiante.countDocuments(filtros)
  ]);
  return {
    items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

async function obtener(id) {
  const est = await Estudiante.findById(id);
  if (!est) {
    const err = new Error('Estudiante no encontrado');
    err.status = 404;
    throw err;
  }
  return est;
}

async function eliminar(id) {
  const est = await Estudiante.findById(id);
  if (!est) {
    const err = new Error('Estudiante no encontrado');
    err.status = 404;
    throw err;
  }
  await Estudiante.findByIdAndDelete(id);
  return { id, nombre: est.nombre };
}

module.exports = { registrar, listar, obtener, eliminar };
