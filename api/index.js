// Punto de entrada para Vercel (API Only)
let app;
let appError;

// Inicializar la app de forma segura
try {
    // Usar versión completa con manejo robusto de errores
    app = require('../app-complete');
    console.log('✅ App completa inicializada correctamente');
} catch (error) {
    console.error('❌ Error inicializando app completa:', error.message);
    console.error('Stack trace:', error.stack);
    appError = error;
}

module.exports = (req, res) => {
    console.log(`🚀 Vercel Handler: ${req.method} ${req.url}`);
    
    // Si hay error en la inicialización, devolver error 500
    if (appError) {
        console.error('❌ App no pudo inicializarse:', appError.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server initialization failed',
            error: process.env.NODE_ENV === 'development' ? appError.message : 'Internal server error'
        });
        return;
    }
    
    // Si la app no existe, devolver error
    if (!app) {
        console.error('❌ App is undefined');
        res.status(500).json({ 
            success: false, 
            message: 'Server not available' 
        });
        return;
    }
    
    try {
        return app(req, res);
    } catch (error) {
        console.error('❌ Error ejecutando app:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Request processing failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
