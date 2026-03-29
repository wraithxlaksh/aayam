const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    roomNumber: { type: String },
    totalScore: { type: Number, default: 0 },
    stats: {
        contexto: { bestTime: { type: Number, default: null } },
        grouping: { bestTime: { type: Number, default: null } },
        wordle: { bestTime: { type: Number, default: null } }
    },
    lastUpdateTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Player', PlayerSchema);
