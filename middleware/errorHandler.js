module.exports = (err, req, res, _next) => {
  console.error('🔥 Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
};
