const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Import routes
const urlRoutes = require('./routes/urlRoutes');
const messageRoutes = require('./routes/messageRoutes');

const dbPath = path.join(__dirname, 'data', 'phishing.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS domains (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    domain TEXT NOT NULL UNIQUE,
                    lastScan TEXT NOT NULL,
                    attempts INTEGER NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'Protégé'
                )
            `, (err) => {
                if (err) return reject(err);

                db.get(`SELECT COUNT(*) AS total FROM domains`, (countErr, row) => {
                    if (countErr) return reject(countErr);

                    if (row.total === 0) {
                        const seed = [
                            ['unikin.ac.cd', "Aujourd'hui, 08:30", 0, 'Protégé'],
                            ['paypal.com', 'Hier, 22:15', 42, 'Alerte Élevée']
                        ];

                        const stmt = db.prepare(`INSERT INTO domains (domain, lastScan, attempts, status) VALUES (?, ?, ?, ?)`);
                        seed.forEach(([domain, lastScan, attempts, status]) => stmt.run(domain, lastScan, attempts, status));
                        stmt.finalize((finalizeErr) => finalizeErr ? reject(finalizeErr) : resolve());
                    } else {
                        resolve();
                    }
                });
            });
        });
    });
}

function readDomains() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT id, domain, lastScan, attempts, status FROM domains ORDER BY id DESC`, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function addDomain(domain) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO domains (domain, lastScan, attempts, status) VALUES (?, ?, 0, 'Protégé')`,
            [domain, "À l'instant"],
            function (err) {
                if (err) return reject(err);
                resolve({
                    id: this.lastID,
                    domain,
                    lastScan: "À l'instant",
                    attempts: 0,
                    status: 'Protégé'
                });
            }
        );
    });
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

// API Routes
app.use('/api/analyze', urlRoutes);
app.use('/api/analyze', messageRoutes);

app.get('/api/domains', async (req, res) => {
    try {
        const domains = await readDomains();
        res.json(domains);
    } catch (error) {
        res.status(500).json({ error: 'Impossible de lire les domaines.' });
    }
});

app.post('/api/domains', async (req, res) => {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string' || !domain.trim()) {
        return res.status(400).json({ error: 'Le domaine est requis.' });
    }

    const cleanDomain = domain.trim();
    try {
        const existing = await readDomains();
        const alreadyExists = existing.some(item => item.domain.toLowerCase() === cleanDomain.toLowerCase());
        if (alreadyExists) {
            return res.status(409).json({ error: 'Ce domaine existe déjà.' });
        }

        const newDomain = await addDomain(cleanDomain);
        res.status(201).json(newDomain);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de l\'ajout du domaine.' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ 
        error: 'Une erreur est survenue sur le serveur',
        message: err.message 
    });
});

// Start server
initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            logger.info(`Serveur démarré sur le port ${PORT}`);
            console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Database initialization failed:', error);
        process.exit(1);
    });
