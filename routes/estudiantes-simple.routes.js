// Rutas de estudiantes simplificadas para debug
const router = require('express').Router();

console.log('🔄 Cargando rutas de estudiantes...');

// Middleware de autenticación simple
function requireAuth(req, res, next) {
    if (req.session && req.session.adminId) return next();
    return res.status(401).json({ success: false, message: 'Acceso no autorizado' });
}

// Middleware de validación simple para registro
function validateRegistro(req, res, next) {
    const { nombre, email, telefono, resultado } = req.body;
    if (!nombre || !email || !telefono || !resultado) {
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan datos requeridos: nombre, email, telefono, resultado' 
        });
    }
    if (!resultado.archetypeId || !resultado.programa || !resultado.compatibilidad) {
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan datos del resultado: archetypeId, programa, compatibilidad' 
        });
    }
    next();
}

// Registro de estudiante (público)
router.post('/registro', validateRegistro, async (req, res, next) => {
    try {
        console.log('📥 Registro de estudiante recibido:', req.body.nombre);
        
        // Verificar conexión a MongoDB
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Base de datos no disponible temporalmente',
                error: 'MongoDB not connected'
            });
        }

        // Usar el servicio
        const service = require('../services/estudiantes.service');
        const data = await service.registrar(req.body, { 
            ip: req.ip, 
            userAgent: req.get('User-Agent') 
        });
        
        console.log('✅ Estudiante registrado:', data._id);
        res.status(201).json({ 
            success: true, 
            message: 'Estudiante registrado exitosamente', 
            data 
        });
    } catch (err) {
        console.error('❌ Error registrando estudiante:', err.message);
        next(err);
    }
});

// Listar estudiantes (protegido)
router.get('/', requireAuth, async (req, res, next) => {
    try {
        console.log('📥 Listado de estudiantes solicitado');
        
        // Verificar conexión a MongoDB
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Base de datos no disponible temporalmente',
                error: 'MongoDB not connected'
            });
        }

        const service = require('../services/estudiantes.service');
        const data = await service.listar(req.query);
        
        console.log('✅ Estudiantes listados:', data.items.length);
        res.json({ 
            success: true, 
            data: data.items, 
            pagination: data.pagination 
        });
    } catch (err) {
        console.error('❌ Error listando estudiantes:', err.message);
        next(err);
    }
});

// Obtener estudiante específico (protegido)
router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Base de datos no disponible temporalmente'
            });
        }

        const service = require('../services/estudiantes.service');
        const estudiante = await service.obtener(req.params.id);
        
        res.json({ success: true, data: estudiante });
    } catch (err) {
        console.error('❌ Error obteniendo estudiante:', err.message);
        next(err);
    }
});

// Eliminar estudiante (protegido)
router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Base de datos no disponible temporalmente'
            });
        }

        const service = require('../services/estudiantes.service');
        const info = await service.eliminar(req.params.id);
        
        res.json({ 
            success: true, 
            message: 'Estudiante eliminado exitosamente', 
            data: info 
        });
    } catch (err) {
        console.error('❌ Error eliminando estudiante:', err.message);
        next(err);
    }
});

console.log('✅ Rutas de estudiantes cargadas');
module.exports = router;