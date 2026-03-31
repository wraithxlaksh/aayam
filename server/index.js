const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});
const JWT_SECRET = process.env.JWT_SECRET || 'aayam_super_secret_key_2026';



console.log("ALL ENV:", process.env);
// Validate required environment variables
if (!process.env.SUPABASE_URL) {
    console.error('❌ SUPABASE_URL not found in .env file.');
    process.exit(1);
}
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('❌ Upstash Redis environment variables not found. Please add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env');
    process.exit(1);
}
if (!process.env.ADMIN_PASSWORD) {
    console.error('❌ ADMIN_PASSWORD not found in .env file.');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());
console.log("Supabase URL present");
console.log("Upstash URL:", process.env.UPSTASH_REDIS_REST_URL);
const PORT = process.env.PORT || 5000;

// Fix SUPABASE_URL if it doesn't have postgres(ql):// prefix
let connString = process.env.SUPABASE_URL;
if (!connString.startsWith('postgres://') && !connString.startsWith('postgresql://')) {
    connString = 'postgresql://postgres:' + connString; 
    console.warn("⚠️ Added postgresql:// prefix to connection string. Make sure format has user correctly set if using session pooler.");
}

// Connect to Postgres
const pool = new Pool({
    connectionString: connString,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(async (client) => {
        console.log('✅ Connected to Postgres (Supabase)');
        await client.query(`
            CREATE TABLE IF NOT EXISTS players (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                "rollNumber" VARCHAR(255) UNIQUE NOT NULL,
                "roomNumber" VARCHAR(255),
                "totalScore" INTEGER DEFAULT 0,
                stats JSONB DEFAULT '{"contexto": {"bestTime": null}, "grouping": {"bestTime": null}, "wordle": {"bestTime": null}}'::jsonb,
                "lastUpdateTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_qualified BOOLEAN DEFAULT false
            );
            ALTER TABLE players ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN DEFAULT false;
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                roll_no VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS rounds (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                dimension_type VARCHAR(50) DEFAULT 'TRIPLE_THREAT',
                start_time BIGINT,
                end_time BIGINT,
                status VARCHAR(20) DEFAULT 'UPCOMING',
                max_players INTEGER DEFAULT 8,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS round_participants (
                id SERIAL PRIMARY KEY,
                roll_no VARCHAR(255) NOT NULL,
                round_id INTEGER NOT NULL REFERENCES rounds(id),
                score INTEGER DEFAULT 0,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (roll_no, round_id)
            );
            CREATE TABLE IF NOT EXISTS game_progress (
                id SERIAL PRIMARY KEY,
                roll_no VARCHAR(255) NOT NULL,
                round_id INTEGER NOT NULL REFERENCES rounds(id),
                game_type VARCHAR(50) NOT NULL,
                attempts INTEGER DEFAULT 0,
                mistakes INTEGER DEFAULT 0,
                score INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT false,
                UNIQUE (roll_no, round_id, game_type)
            );
        `);
        console.log('✅ Postgres tables verified');
        client.release();
    })
    .catch(err => {
        console.error('❌ Could not connect to Postgres. Full Error Details:');
        console.error(err);
    });

// Upstash REST Client Emulator
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstash(command, ...args) {
    if (!UPSTASH_URL || !UPSTASH_TOKEN) {
        console.warn("⚠️ Upstash credentials missing. Skipping Redis operation.");
        return null;
    }
    
    try {
        const response = await fetch(UPSTASH_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${UPSTASH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([command, ...args])
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.result;
    } catch (err) {
        console.error(`❌ Upstash Error (${command}):`, err.message);
        throw err;
    }
}

// Verify Upstash connection on boot
(async () => {
    try {
        await upstash('PING');
        console.log('✅ Connected to Upstash Redis (REST)');
    } catch (e) {
        console.error('❌ Could not ping Upstash. Check your network or tokens.');
    }
})();



// --- REAL-TIME SSE (PER PLAY/ROUND) ---
let clients = [];

async function broadcastRoundLeaderboard(roundId) {
    try {
        const parts = await pool.query(`
            SELECT p.score, u.name, u.roll_no 
            FROM round_participants p 
            JOIN users u ON p.roll_no = u.roll_no 
            WHERE p.round_id = $1 
            ORDER BY p.score DESC
        `, [roundId]);
        
        const results = parts.rows.map(p => ({
            name: p.name,
            rollNumber: p.roll_no,
            score: p.score
        }));
        
        const data = JSON.stringify({ type: 'LEADERBOARD', payload: results });
        clients.filter(c => c.roundId === parseInt(roundId)).forEach(client => {
            if (!client.res.writableEnded) {
                try { client.res.write(`data: ${data}\n\n`); } catch(e) {}
            }
        });
    } catch (err) {
        console.error("Round Broadcast Error:", err.message);
    }
}

app.get('/api/events/:roundId', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    const roundId = parseInt(req.params.roundId);
    const clientObj = { id: Date.now(), res, roundId };
    clients.push(clientObj);
    
    broadcastRoundLeaderboard(roundId);

    try {
        const roundRes = await pool.query('SELECT status, start_time, end_time FROM rounds WHERE id = $1', [roundId]);
        if (roundRes.rowCount > 0 && roundRes.rows[0].status === 'LIVE') {
            const data = JSON.stringify({ type: 'ROUND_START', payload: roundRes.rows[0] });
            clientObj.res.write(`data: ${data}\n\n`);
        }
    } catch (err) {}
    
    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientObj.id);
    });
});

// Start/Stop global state broadcast logic still used by old clients, can keep it generic:
function broadcastGlobalData(payload) {
    const data = JSON.stringify({ type: 'STATE_UPDATE', payload });
    clients.forEach(c => {
        if (!c.res.writableEnded) {
            try { c.res.write(`data: ${data}\n\n`); } catch(e) {}
        }
    });
}

async function broadcastLeaderboard() {
    try {
        const rawRankings = await upstash('ZRANGE', 'leaderboard', '0', '9', 'REV', 'WITHSCORES');
        if (!rawRankings || rawRankings.length === 0) return;
        
        const rankings = [];
        for (let i = 0; i < rawRankings.length; i += 2) {
            rankings.push({ value: rawRankings[i], score: parseInt(rawRankings[i+1]) });
        }
        
        const results = await Promise.all(rankings.map(async (item) => {
            const resDb = await pool.query('SELECT name, is_qualified FROM players WHERE "rollNumber" = $1', [item.value]);
            const player = resDb.rows[0];
            return {
                name: player ? player.name : "Unknown",
                rollNumber: item.value,
                score: item.score,
                is_qualified: player ? player.is_qualified : false
            };
        }));
        
        const data = JSON.stringify({ type: 'LEADERBOARD', payload: results });
        clients.filter(c => !c.roundId).forEach(client => {
            if (!client.res.writableEnded) {
                try { client.res.write(`data: ${data}\n\n`); } catch(e) {}
            }
        });
    } catch (err) {}
}

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    const clientObj = { id: Date.now(), res, roundId: null };
    clients.push(clientObj);
    
    broadcastLeaderboard();
    
    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientObj.id);
    });
});

// ADMIN: Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true, message: "Admin authenticated" });
    } else {
        res.status(401).json({ error: "Unauthorized access" });
    }
});

// ADMIN: Overall Leaderboard (All Players)
app.post('/api/admin/leaderboard', async (req, res) => {
    const { password } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    try {
        const resDb = await pool.query('SELECT * FROM players ORDER BY "totalScore" DESC, "lastUpdateTime" DESC');
        res.json({ success: true, leaderboard: resDb.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database failure" });
    }
});

// ADMIN: Set Game State Live/Not Live
app.post('/api/admin/toggle-live', (req, res) => {
    const { password, isLive } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    
    broadcastGlobalData({ isLive });
    res.json({ success: true, isLive });
});

// ====== ROUNDS API ======

app.get('/api/rounds', async (req, res) => {
    const rollNumber = req.query.rollNumber;
    try {
        const roundsRes = await pool.query('SELECT * FROM rounds ORDER BY created_at DESC');
        const rounds = await Promise.all(roundsRes.rows.map(async r => {
            const parts = await pool.query('SELECT * FROM round_participants WHERE round_id = $1', [r.id]);
            const isEnrolled = rollNumber ? parts.rows.some(p => p.roll_no === rollNumber) : false;
            return { ...r, enrolledCount: parts.rows.length, isEnrolled };
        }));
        res.json({ success: true, rounds });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch rounds" });
    }
});

app.post('/api/rounds/enroll/:id', async (req, res) => {
    const roundId = req.params.id;
    const { rollNumber } = req.body;
    try {
        const roundRes = await pool.query('SELECT * FROM rounds WHERE id = $1', [roundId]);
        if (roundRes.rowCount === 0) return res.status(404).json({error: "Round not found"});
        const round = roundRes.rows[0];

        if (round.dimension_type === 'MIND_SYNC') {
            const playerRes = await pool.query('SELECT is_qualified FROM players WHERE "rollNumber" = $1', [rollNumber]);
            if (!playerRes.rows[0]?.is_qualified) {
                return res.status(403).json({error: "Not qualified for Mind Sync dimension."});
            }
        }

        const parts = await pool.query('SELECT * FROM round_participants WHERE round_id = $1', [roundId]);
        if (parts.rowCount >= round.max_players) {
            return res.status(400).json({error: "Round is full."});
        }
        
        await pool.query('INSERT INTO round_participants (roll_no, round_id) VALUES ($1, $2)', [rollNumber, roundId]);
        res.json({ success: true, roundId });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: "Already enrolled." });
        res.status(500).json({ error: "Enrollment failed" });
    }
});

app.post('/api/admin/rounds/create', async (req, res) => {
    const { password, name, dimension_type, max_players } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

    try {
        const newRound = await pool.query(
            'INSERT INTO rounds (name, dimension_type, max_players) VALUES ($1, $2, $3) RETURNING *',
            [name || 'Protocol Block', dimension_type || 'TRIPLE_THREAT', max_players || 8]
        );
        res.json({ success: true, round: newRound.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Round creation failed" });
    }
});

app.post('/api/admin/rounds/:id/start', async (req, res) => {
    const { password } = req.body;
    const roundId = req.params.id;
    if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

    try {
        const start_time = Date.now();
        const end_time = start_time + (30 * 60 * 1000); // 10 minutes
        await pool.query(
            'UPDATE rounds SET status = $1, start_time = $2, end_time = $3 WHERE id = $4 RETURNING *',
            ['LIVE', start_time, end_time, roundId]
        );

        const data = JSON.stringify({ type: 'ROUND_START', payload: { start_time, end_time } });
        clients.filter(c => c.roundId === parseInt(roundId)).forEach(client => {
            if (!client.res.writableEnded) {
                try { client.res.write(`data: ${data}\n\n`); } catch(e) {}
            }
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Start round failed" });
    }
});

// ADMIN: Qualify Players
app.post('/api/admin/qualify', async (req, res) => {
    const { password, count } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    
    try {
        await pool.query('UPDATE players SET is_qualified = false');
        
        const rawRankings = await upstash('ZRANGE', 'leaderboard', '0', (count - 1).toString(), 'REV');
        if (rawRankings && rawRankings.length > 0) {
            const inClause = rawRankings.map((_, i) => `$${i + 1}`).join(',');
            await pool.query(`UPDATE players SET is_qualified = true WHERE "rollNumber" IN (${inClause})`, rawRankings);
        }
        
        broadcastLeaderboard();
        res.json({ success: true, qualifiedCount: rawRankings ? rawRankings.length : 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Qualify failure" });
    }
});

// ADMIN: Fetch Rounds
app.post('/api/admin/rounds', async (req, res) => {
    const { password } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

    try {
        const roundsRes = await pool.query('SELECT * FROM rounds ORDER BY created_at DESC');
        const rounds = await Promise.all(roundsRes.rows.map(async r => {
            const parts = await pool.query('SELECT p.id, p.score, u.name, u.roll_no FROM round_participants p JOIN users u ON p.roll_no = u.roll_no WHERE p.round_id = $1', [r.id]);
            return {
                roundNumber: r.id,
                name: r.name,
                status: r.status,
                start_time: r.start_time,
                max_players: r.max_players,
                players: parts.rows.map(p => ({ rollNumber: p.roll_no, name: p.name, totalScore: p.score }))
            };
        }));
        
        res.json({ success: true, rounds });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rounds" });
    }
});

// AUTH: Signup User
app.post('/api/auth/signup', async (req, res) => {
    const { name, rollNumber, password } = req.body;
    if (!name || !rollNumber || !password) return res.status(400).json({ error: "Missing required fields." });

    try {
        await pool.query('BEGIN');
        
        // Insert into users table
        await pool.query(
            'INSERT INTO users (name, roll_no, password) VALUES ($1, $2, $3)',
            [name, rollNumber, password]
        );
        
        // Ensure player analytics entry exists
        let resDb = await pool.query('SELECT * FROM players WHERE "rollNumber" = $1', [rollNumber]);
        let player = resDb.rows[0];
        if (!player) {
            resDb = await pool.query(
                'INSERT INTO players (name, "rollNumber") VALUES ($1, $2) RETURNING *',
                [name, rollNumber]
            );
            player = resDb.rows[0];
            console.log(`🆕 New competitor registered: ${name} (${rollNumber})`);
        }
        
        await pool.query('COMMIT');
        
        try {
            await upstash('ZADD', 'leaderboard', player.totalScore.toString(), rollNumber);
            broadcastLeaderboard();
        } catch (e) {
            console.warn(`⚠️ Redis sync skipped for ${rollNumber}`);
        }

        const token = jwt.sign({ rollNumber }, JWT_SECRET, { expiresIn: '12h' });
        
        res.json({ success: true, player, token });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        if (err.code === '23505') return res.status(400).json({ error: "User already exists." });
        res.status(500).json({ error: "Signup failure." });
    }
});

// AUTH: Login User
app.post('/api/auth/login', async (req, res) => {
    const { rollNumber, password } = req.body;
    if (!rollNumber || !password) return res.status(400).json({ error: "Missing login fields." });

    try {
        const userRes = await pool.query('SELECT * FROM users WHERE roll_no = $1', [rollNumber]);
        const user = userRes.rows[0];
        
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        
        const playerRes = await pool.query('SELECT * FROM players WHERE "rollNumber" = $1', [rollNumber]);
        const player = playerRes.rows[0];
        
        try {
            if (player) await upstash('ZADD', 'leaderboard', player.totalScore.toString(), rollNumber);
        } catch (e) {
            console.warn(`⚠️ Redis sync skipped`);
        }

        const token = jwt.sign({ rollNumber }, JWT_SECRET, { expiresIn: '12h' });

        res.json({ success: true, player, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failure." });
    }
});

// AUTH: Verify JWT
app.get('/api/auth/verify', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing token" });
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const playerRes = await pool.query('SELECT * FROM players WHERE "rollNumber" = $1', [decoded.rollNumber]);
        const player = playerRes.rows[0];
        
        if (!player) return res.status(404).json({ error: "Player not found" });
        res.json({ success: true, player });
    } catch (err) {
        res.status(401).json({ error: "Token invalid or expired" });
    }
});

// PROGRESS: Store/Load Game Progress
app.post('/api/progress/save', async (req, res) => {
    const { rollNumber, gameId, progress } = req.body;
    try {
        await upstash('SET', `prog:${rollNumber}:${gameId}`, JSON.stringify(progress), 'EX', '86400');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to save progress" });
    }
});

app.get('/api/progress/load/:rollNumber/:gameId', async (req, res) => {
    try {
        const dataStr = await upstash('GET', `prog:${req.params.rollNumber}:${req.params.gameId}`);
        res.json({ success: true, progress: dataStr ? JSON.parse(dataStr) : null });
    } catch (err) {
        res.json({ success: false, error: "Failed to load progress" });
    }
});

app.delete('/api/progress/:rollNumber/:gameId', async (req, res) => {
    try {
        await upstash('DEL', `prog:${req.params.rollNumber}:${req.params.gameId}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear progress" });
    }
});

// ====== SERVER-SIDE SCORING (STRICT GAME COMPLETION) ======
app.post('/api/game/:roundId/submit', async (req, res) => {
    const { rollNumber, gameType, payload } = req.body;
    const roundId = req.params.roundId;

    let score = 0;
    
    if (gameType === 'contexto') {
        const rank = payload.rank;
        if (rank === 1) score = 100;
        else if (rank === 2) score = 90;
        else if (rank === 3) score = 70;
        else if (rank <= 9) score = 60 - ((rank - 4) * 5); 
        else if (rank <= 20) score = 10;
        else if (rank <= 30) score = 9;
        else score = 5;
    } 
    else if (gameType === 'wordle') {
        const attempts = payload.attempts;
        if (attempts === 1) score = 100;
        else if (attempts === 2) score = 90;
        else if (attempts === 3) score = 70;
        else if (attempts === 4) score = 50;
        else if (attempts === 5) score = 20;
        else if (attempts === 6) score = 10;
        else score = 0;
    }
    else if (gameType === 'grouping') {
        const mistakes = payload.mistakes;
        if (mistakes === 0) score = 100;
        else if (mistakes === 1) score = 80;
        else if (mistakes === 2) score = 60;
        else if (mistakes === 3) score = 40;
        else score = 20;
    }

    try {
        await pool.query('BEGIN');
        
        await pool.query(
            `INSERT INTO game_progress (roll_no, round_id, game_type, attempts, mistakes, score, completed)
             VALUES ($1, $2, $3, $4, $5, $6, true)
             ON CONFLICT (roll_no, round_id, game_type) 
             DO UPDATE SET score = EXCLUDED.score, completed = true, 
                           attempts = EXCLUDED.attempts, mistakes = EXCLUDED.mistakes`,
            [rollNumber, roundId, gameType, payload.attempts || 0, payload.mistakes || 0, score]
        );

        const totalProgress = await pool.query(
            'SELECT SUM(score) as total FROM game_progress WHERE roll_no = $1 AND round_id = $2',
            [rollNumber, roundId]
        );
        const newTotal = parseInt(totalProgress.rows[0].total || 0);

        await pool.query(
            'UPDATE round_participants SET score = $1 WHERE roll_no = $2 AND round_id = $3',
            [newTotal, rollNumber, roundId]
        );

        // Update overall records board
        await pool.query(
            'UPDATE players SET "totalScore" = "totalScore" + $1 WHERE "rollNumber" = $2',
            [score, rollNumber]
        );
        
        await pool.query('COMMIT');
        
        broadcastRoundLeaderboard(roundId);
        // also broadcast global
        await upstash('ZADD', 'leaderboard', newTotal.toString(), rollNumber);
        
        res.json({ success: true, score, newTotal });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Scoring error", err);
        res.status(500).json({ error: "Score submission failed." });
    }
});

// LEADERBOARD: Fetch from Upstash ZSET
app.get('/api/leaderboard', async (req, res) => {
    try {
        // Upstash equivalent of zRangeWithScores REV
        // Format returned: ["RollNum", "1200", "RollNum2", "900", ...]
        const rawRankings = await upstash('ZRANGE', 'leaderboard', '0', '9', 'REV', 'WITHSCORES');
        if (!rawRankings || rawRankings.length === 0) return res.json([]);
        
        // Parse into [{value, score}] format
        const rankings = [];
        for (let i = 0; i < rawRankings.length; i += 2) {
            rankings.push({
                value: rawRankings[i],
                score: parseInt(rawRankings[i+1])
            });
        }
        
        // Fetch names from Postgres for the display
        const results = await Promise.all(rankings.map(async (item) => {
            const resDb = await pool.query('SELECT name, is_qualified FROM players WHERE "rollNumber" = $1', [item.value]);
            const player = resDb.rows[0];
            return {
                name: player ? player.name : "Unknown",
                rollNumber: item.value,
                score: item.score,
                is_qualified: player ? player.is_qualified : false
            };
        }));

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Real-time sync failure." });
    }
});

// SCORE: Sync Score
app.post('/api/score/sync', async (req, res) => {
    const { rollNumber, scoreChange } = req.body;
    try {
        const resDb = await pool.query(
            'UPDATE players SET "totalScore" = "totalScore" + $1, "lastUpdateTime" = CURRENT_TIMESTAMP WHERE "rollNumber" = $2 RETURNING *',
            [scoreChange, rollNumber]
        );
        const player = resDb.rows[0];
        
        if (player) {
            await upstash('ZADD', 'leaderboard', player.totalScore.toString(), rollNumber);
            broadcastLeaderboard();
        }
        res.json({ success: true, player });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Sync failure." });
    }
});

// SESSION: Store/Sync timeLeft to Redis
app.post('/api/session/timer', async (req, res) => {
    const { rollNumber, timeLeft } = req.body;
    try {
        await upstash('SET', `timer:${rollNumber}`, timeLeft.toString(), 'EX', '86400');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Timer sync failure." });
    }
});

app.get('/api/session/timer/:rollNumber', async (req, res) => {
    try {
        const timeLeft = await upstash('GET', `timer:${req.params.rollNumber}`);
        res.json({ timeLeft: timeLeft ? parseInt(timeLeft) : null });
    } catch (err) {
        res.json({ timeLeft: null });
    }
});

app.listen(PORT, () => console.log(`🚀 AAYAM Backend running on port ${PORT}`));
