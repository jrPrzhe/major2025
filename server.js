const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  // Players table
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    score INTEGER DEFAULT 10000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating players table:', err);
  });

  // Picks table
  db.run(`CREATE TABLE IF NOT EXISTS picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    stage_id TEXT NOT NULL,
    slot_key TEXT NOT NULL,
    team_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, stage_id, slot_key),
    FOREIGN KEY (player_id) REFERENCES players(id)
  )`, (err) => {
    if (err) console.error('Error creating picks table:', err);
  });

  // Admin results table
  db.run(`CREATE TABLE IF NOT EXISTS admin_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_id TEXT NOT NULL,
    category TEXT NOT NULL,
    slot_index INTEGER NOT NULL,
    team_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stage_id, category, slot_index)
  )`, (err) => {
    if (err) console.error('Error creating admin_results table:', err);
  });

  // Stage status table (for admin control)
  db.run(`CREATE TABLE IF NOT EXISTS stage_status (
    stage_id TEXT PRIMARY KEY,
    is_open INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating stage_status table:', err);
    } else {
      // Initialize default players if they don't exist
      initDefaultPlayers();
      // Initialize stage status (all open by default)
      initStageStatus();
    }
  });

  // Champion table
  db.run(`CREATE TABLE IF NOT EXISTS champion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    champion TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating champion table:', err);
  });

  // Champion status table
  db.run(`CREATE TABLE IF NOT EXISTS champion_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_open INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating champion_status table:', err);
  });
}

// Initialize default players
function initDefaultPlayers() {
  const defaultPlayers = [
    { id: 'dima', name: 'Дима' },
    { id: 'evgeniy', name: 'Евгений' },
    { id: 'zakhar', name: 'Захар' }
  ];

  defaultPlayers.forEach(player => {
    db.run(`INSERT OR IGNORE INTO players (id, name, score) VALUES (?, ?, 10000)`,
      [player.id, player.name], (err) => {
        if (err) console.error('Error inserting default player:', err);
      });
  });
}

// Initialize stage status
function initStageStatus() {
  ['stage1', 'stage2', 'stage3'].forEach(stageId => {
    db.run(`INSERT OR IGNORE INTO stage_status (stage_id, is_open) VALUES (?, 1)`,
      [stageId], (err) => {
        if (err) console.error('Error inserting stage status:', err);
      });
  });
}

// API Routes

// Get all players
app.get('/api/players', (req, res) => {
  db.all('SELECT * FROM players ORDER BY score DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get player by ID
app.get('/api/players/:id', (req, res) => {
  const playerId = req.params.id;
  db.get('SELECT * FROM players WHERE id = ?', [playerId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(row);
  });
});

// Update player
app.put('/api/players/:id', (req, res) => {
  const playerId = req.params.id;
  const { name, score } = req.body;
  
  db.run(`UPDATE players SET name = ?, score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, score, playerId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Player updated', changes: this.changes });
    });
});

// Get all picks for a player
app.get('/api/players/:id/picks', (req, res) => {
  const playerId = req.params.id;
  db.all('SELECT * FROM picks WHERE player_id = ?', [playerId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Format picks as object
    const picks = {
      stage1: {},
      stage2: {},
      stage3: {},
      champion: {}
    };
    
    rows.forEach(row => {
      if (!picks[row.stage_id]) {
        picks[row.stage_id] = {};
      }
      picks[row.stage_id][row.slot_key] = row.team_name;
    });
    
    res.json(picks);
  });
});

// Save pick
app.post('/api/players/:id/picks', (req, res) => {
  const playerId = req.params.id;
  const { stageId, slotKey, teamName } = req.body;
  
  db.run(`INSERT OR REPLACE INTO picks (player_id, stage_id, slot_key, team_name, updated_at) 
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [playerId, stageId, slotKey, teamName], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Pick saved', id: this.lastID });
    });
});

// Delete pick
app.delete('/api/players/:id/picks', (req, res) => {
  const playerId = req.params.id;
  const { stageId, slotKey } = req.body;
  
  db.run('DELETE FROM picks WHERE player_id = ? AND stage_id = ? AND slot_key = ?',
    [playerId, stageId, slotKey], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Pick deleted', changes: this.changes });
    });
});

// Get admin results for a stage
app.get('/api/admin/results/:stageId', (req, res) => {
  const stageId = req.params.stageId;
  db.all('SELECT * FROM admin_results WHERE stage_id = ? ORDER BY category, slot_index',
    [stageId], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Format results
      const results = {
        '30': [],
        '03': [],
        '31-32': []
      };
      
      rows.forEach(row => {
        if (results[row.category]) {
          results[row.category][row.slot_index] = row.team_name;
        }
      });
      
      // Remove undefined values
      Object.keys(results).forEach(key => {
        results[key] = results[key].filter(v => v !== undefined);
      });
      
      res.json(results);
    });
});

// Get stage status
app.get('/api/admin/stage-status/:stageId', (req, res) => {
  const stageId = req.params.stageId;
  db.get('SELECT * FROM stage_status WHERE stage_id = ?', [stageId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      // Default: stage is open
      res.json({ stage_id: stageId, is_open: 1 });
      return;
    }
    res.json({ stage_id: row.stage_id, is_open: row.is_open });
  });
});

// Get all stage statuses
app.get('/api/admin/stage-status', (req, res) => {
  db.all('SELECT * FROM stage_status', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Update stage status (open/close voting)
app.put('/api/admin/stage-status/:stageId', (req, res) => {
  const stageId = req.params.stageId;
  const { is_open } = req.body;
  
  db.run(`INSERT OR REPLACE INTO stage_status (stage_id, is_open, updated_at) 
          VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [stageId, is_open ? 1 : 0], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Stage status updated', changes: this.changes });
    });
});

// Save admin results
app.post('/api/admin/results/:stageId', (req, res) => {
  const stageId = req.params.stageId;
  const results = req.body;
  
  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Delete existing results for this stage
    db.run('DELETE FROM admin_results WHERE stage_id = ?', [stageId], (err) => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Insert new results
      const stmt = db.prepare(`INSERT INTO admin_results (stage_id, category, slot_index, team_name) 
                               VALUES (?, ?, ?, ?)`);
      
      let hasError = false;
      
      Object.keys(results).forEach(category => {
        if (results[category] && Array.isArray(results[category])) {
          results[category].forEach((teamName, index) => {
            if (teamName) {
              stmt.run([stageId, category, index, teamName], (err) => {
                if (err && !hasError) {
                  hasError = true;
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                }
              });
            }
          });
        }
      });
      
      stmt.finalize((err) => {
        if (err && !hasError) {
          hasError = true;
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (!hasError) {
          db.run('COMMIT', (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ message: 'Results saved successfully' });
          });
        }
      });
    });
  });
});

// Delete admin results for a stage
app.delete('/api/admin/results/:stageId', (req, res) => {
  const stageId = req.params.stageId;
  
  db.run('DELETE FROM admin_results WHERE stage_id = ?', [stageId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Results deleted', changes: this.changes });
  });
});

// Get champion result
app.get('/api/admin/champion', (req, res) => {
  db.get('SELECT champion FROM champion ORDER BY updated_at DESC LIMIT 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.json({ champion: null });
      return;
    }
    res.json({ champion: row.champion });
  });
});

// Save champion result
app.post('/api/admin/champion', (req, res) => {
  const { champion } = req.body;
  
  if (!champion) {
    res.status(400).json({ error: 'Champion name is required' });
    return;
  }
  
  // Delete existing champion and insert new one
  db.run('DELETE FROM champion', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    db.run('INSERT INTO champion (champion, updated_at) VALUES (?, CURRENT_TIMESTAMP)',
      [champion], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Champion saved', id: this.lastID });
      });
  });
});

// Delete champion result
app.delete('/api/admin/champion', (req, res) => {
  db.run('DELETE FROM champion', function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Champion deleted', changes: this.changes });
  });
});

// Get champion status
app.get('/api/admin/champion-status', (req, res) => {
  db.get('SELECT * FROM champion_status WHERE id = 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      // Default to open if not set
      res.json({ id: 1, is_open: 1 });
      return;
    }
    res.json(row);
  });
});

// Update champion status
app.put('/api/admin/champion-status', (req, res) => {
  const { is_open } = req.body;
  
  db.run(`INSERT OR REPLACE INTO champion_status (id, is_open, updated_at) 
          VALUES (1, ?, CURRENT_TIMESTAMP)`,
    [is_open ? 1 : 0], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Champion status updated', id: 1, is_open: is_open ? 1 : 0 });
    });
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

