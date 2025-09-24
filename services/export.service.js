const Estudiante = require('../models/Estudiante');
const XLSX = require('xlsx');

function buildFilters(query) {
  const { archetype, fechaDesde, fechaHasta } = query;
  const filtros = {};
  if (archetype) filtros['resultado.archetypeId'] = parseInt(archetype);
  if (fechaDesde || fechaHasta) {
    filtros.fechaCompletado = {};
    if (fechaDesde) filtros.fechaCompletado.$gte = new Date(fechaDesde);
    if (fechaHasta) filtros.fechaCompletado.$lte = new Date(fechaHasta);
  }
  return filtros;
}

async function exportCsvStream(query, writable) {
  const filtros = buildFilters(query);
  // Cabecera
  writable.write('nombre,email,telefono,archetypeId,programa,compatibilidad,fechaCompletado\n');
  const cursor = Estudiante.find(filtros).cursor();
  for await (const doc of cursor) {
    const row = [
      safe(doc.nombre),
      safe(doc.email),
      safe(doc.telefono),
      doc.resultado?.archetypeId ?? '',
      safe(doc.resultado?.programa),
      doc.resultado?.compatibilidad ?? '',
      doc.fechaCompletado?.toISOString() ?? ''
    ].join(',');
    writable.write(row + '\n');
  }
  writable.end();
}

function safe(v) {
  if (v === undefined || v === null) return '';
  const s = String(v).replace(/"/g,'""');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s + '"';
  return s;
}

async function exportXlsxBuffer(query) {
  const filtros = buildFilters(query);
  const docs = await Estudiante.find(filtros).lean();
  const rows = docs.map(d => ({
    Nombre: d.nombre,
    Email: d.email,
    Teléfono: d.telefono,
    ArchetypeId: d.resultado?.archetypeId,
    Programa: d.resultado?.programa,
    Compatibilidad: d.resultado?.compatibilidad,
    FechaCompletado: d.fechaCompletado
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { exportCsvStream, exportXlsxBuffer };
