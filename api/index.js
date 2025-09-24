// Punto de entrada para Vercel (API Only)
const app = require('../app');
module.exports = (req, res) => {
    console.log(`🚀 Vercel Handler: ${req.method} ${req.url}`);
    return app(req, res);
};
