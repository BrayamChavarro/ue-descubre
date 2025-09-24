const service = require('../services/estudiantes.service');
const { exportCsvStream, exportXlsxBuffer } = require('../services/export.service');

async function registrar(req, res, next) {
  try {
    const data = await service.registrar(req.body, { ip: req.ip, userAgent: req.get('User-Agent') });
    res.status(201).json({ success: true, message: 'Estudiante registrado exitosamente', data });
  } catch (err) { next(err); }
}

async function listar(req, res, next) {
  try {
    const data = await service.listar(req.query);
    res.json({ success: true, data: data.items, pagination: data.pagination });
  } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try {
    const est = await service.obtener(req.params.id);
    res.json({ success: true, data: est });
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    const info = await service.eliminar(req.params.id);
    res.json({ success: true, message: 'Estudiante eliminado exitosamente', data: info });
  } catch (err) { next(err); }
}

async function exportCsv(req, res, next) {
  try {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="estudiantes.csv"');
    await exportCsvStream(req.query, res);
  } catch (err) { next(err); }
}

async function exportXlsx(req, res, next) {
  try {
    const buffer = await exportXlsxBuffer(req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="estudiantes.xlsx"');
    res.send(buffer);
  } catch (err) { next(err); }
}

module.exports = { registrar, listar, obtener, eliminar, exportCsv, exportXlsx };
