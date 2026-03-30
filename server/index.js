const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

console.log("ALL ENV:", process.env);
// Validate required environment variables
if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not found in .env file. Please create a .env file in the project root with MONGO_URI=<your_mongo_connection_string>');
    process.exit(1);
}
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('❌ Upstash Redis environment variables not found. Please add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env');
    process.exit(1);
}

const Player = require('./models/Player');

const app = express();
app.use(cors());
app.use(express.json());
console.log(process.env.UPSTASH_REDIS_REST_URL)
console.log("mongo url",process.env.MONGO_URI)
console.log(process.env.UPSTASH_REDIS_REST_URL)
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI,
)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ Could not connect to MongoDB. Full Error Details:');
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

// AUTH: Login or Signup with Name and Roll Number
app.post('/api/auth/login', async (req, res) => {
    const { name, rollNumber } = req.body;
    if (!name || !rollNumber) return res.status(400).json({ error: "Missing identity fields." });

    try {
        let player = await Player.findOne({ rollNumber });
        if (!player) {
            player = await Player.create({ name, rollNumber });
            console.log(`🆕 New competitor: ${name} (${rollNumber})`);
        }
        
        try {
            await upstash('ZADD', 'leaderboard', player.totalScore.toString(), rollNumber);
        } catch (e) {
            console.warn(`⚠️ Redis sync skipped for ${rollNumber}`);
        }

        res.json({ success: true, player });
    } catch (err) {
        res.status(500).json({ error: "Storage failure." });
    }
});

// GAME: Start Tracking Session in Redis
app.post('/api/game/start', async (req, res) => {
    const { rollNumber, gameType, instance } = req.body;
    try {
        const key = `active:${rollNumber}:${gameType}:${instance}`;
        await upstash('SET', key, Date.now().toString(), 'EX', '3600'); // 1 hour safety
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Game start failed." });
    }
});

// GAME: End Tracking and Submit Time
app.post('/api/game/end', async (req, res) => {
    const { rollNumber, gameType, instance, baseScore } = req.body;
    try {
        const key = `active:${rollNumber}:${gameType}:${instance}`;
        const startTimeStr = await upstash('GET', key);
        if (!startTimeStr) return res.status(400).json({ error: "Protocol mismatch: Start session not found." });

        const solveTime = Math.floor((Date.now() - parseInt(startTimeStr)) / 1000); // in seconds
        
        // Update MongoDB Best Time and Total Score
        const player = await Player.findOne({ rollNumber });
        if (player) {
            const currentBest = player.stats[gameType]?.bestTime;
            if (!currentBest || solveTime < currentBest) {
                player.stats[gameType].bestTime = solveTime;
            }
            player.totalScore += baseScore;
            // Time bonus calculation: Solve < 60s gives 50 bonus
            if (solveTime < 60) player.totalScore += 50;
            
            await player.save();

            // Update Upstash Leaderboard
            await upstash('ZADD', 'leaderboard', player.totalScore.toString(), rollNumber);
            await upstash('DEL', key); // Clear active session
            
            res.json({ success: true, solveTime, totalScore: player.totalScore });
        } else {
            res.status(404).json({ error: "Competitor not found." });
        }
    } catch (err) {
        res.status(500).json({ error: "Game end failed." });
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
        
        // Fetch names from MongoDB for the display
        const results = await Promise.all(rankings.map(async (item) => {
            const player = await Player.findOne({ rollNumber: item.value });
            return {
                name: player ? player.name : "Unknown",
                rollNumber: item.value,
                score: item.score
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
        const player = await Player.findOneAndUpdate(
            { rollNumber },
            { $inc: { totalScore: scoreChange }, lastUpdateTime: Date.now() },
            { new: true }
        );
        
        if (player) {
            await upstash('ZADD', 'leaderboard', player.totalScore.toString(), rollNumber);
        }
        res.json({ success: true, player });
    } catch (err) {
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
