// Endpoint para debug de variables de entorno
const express = require('express');
const router = express.Router();

router.get('/debug/env', (req, res) => {
    const envInfo = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'NOT_SET',
        dbName: process.env.DB_NAME || 'NOT_SET',
        hasSessionSecret: !!process.env.SESSION_SECRET,
        hasAdminUsername: !!process.env.ADMIN_USERNAME,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        mongoRetries: process.env.MONGO_CONNECT_RETRIES || 'NOT_SET',
        mongoDelay: process.env.MONGO_CONNECT_DELAY_MS || 'NOT_SET'
    };
    
    res.json({
        success: true,
        message: 'Environment variables debug info',
        data: envInfo
    });
});

module.exports = router;