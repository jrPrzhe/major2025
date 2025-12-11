const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup
// Use persistent storage path if available (for Render Disk), otherwise use local path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
console.log(`Database path: ${dbPath}`);

// Ensure directory exists for database file
const dbDir = path.dirname(dbPath);
if (dbDir !== '.' && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
    initDatabase();
  }
});

// Helper function to get current database connection
function getDb() {
  return global.db || db;
}

// Initialize database tables
function initDatabase() {
  const currentDb = getDb();
  // Players table
  currentDb.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    score INTEGER DEFAULT 10000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating players table:', err);
  });

  // Picks table
  currentDb.run(`CREATE TABLE IF NOT EXISTS picks (
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
  currentDb.run(`CREATE TABLE IF NOT EXISTS admin_results (
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
  currentDb.run(`CREATE TABLE IF NOT EXISTS stage_status (
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
  currentDb.run(`CREATE TABLE IF NOT EXISTS champion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    champion TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating champion table:', err);
  });

  // Champion status table
  currentDb.run(`CREATE TABLE IF NOT EXISTS champion_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_open INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating champion_status table:', err);
  });
}

// Initialize default players
function initDefaultPlayers() {
  const currentDb = getDb();
  const defaultPlayers = [
    { id: 'dima', name: 'Дима' },
    { id: 'evgeniy', name: 'Евгений' },
    { id: 'zakhar', name: 'Захар' }
  ];

  defaultPlayers.forEach(player => {
    currentDb.run(`INSERT OR IGNORE INTO players (id, name, score) VALUES (?, ?, 10000)`,
      [player.id, player.name], (err) => {
        if (err) console.error('Error inserting default player:', err);
      });
  });
}

// Initialize stage status
function initStageStatus() {
  const currentDb = getDb();
  ['stage1', 'stage2', 'stage3', 'stage4'].forEach(stageId => {
    currentDb.run(`INSERT OR IGNORE INTO stage_status (stage_id, is_open) VALUES (?, 1)`,
      [stageId], (err) => {
        if (err) console.error('Error inserting stage status:', err);
      });
  });
}

// API Routes

// Get all players
app.get('/api/players', (req, res) => {
  const currentDb = getDb();
  currentDb.all('SELECT * FROM players ORDER BY score DESC', (err, rows) => {
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
  const currentDb = getDb();
  currentDb.get('SELECT * FROM players WHERE id = ?', [playerId], (err, row) => {
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
  const currentDb = getDb();
  
  currentDb.run(`UPDATE players SET name = ?, score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
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
  const currentDb = getDb();
  currentDb.all('SELECT * FROM picks WHERE player_id = ?', [playerId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Format picks as object
    const picks = {
      stage1: {},
      stage2: {},
      stage3: {},
      stage4: {},
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
  const currentDb = getDb();
  
  currentDb.run(`INSERT OR REPLACE INTO picks (player_id, stage_id, slot_key, team_name, updated_at) 
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
  const currentDb = getDb();
  
  currentDb.run('DELETE FROM picks WHERE player_id = ? AND stage_id = ? AND slot_key = ?',
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
  const currentDb = getDb();
  currentDb.all('SELECT * FROM admin_results WHERE stage_id = ? ORDER BY category, slot_index',
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
  const currentDb = getDb();
  currentDb.get('SELECT * FROM stage_status WHERE stage_id = ?', [stageId], (err, row) => {
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
  const currentDb = getDb();
  currentDb.all('SELECT * FROM stage_status', (err, rows) => {
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
  const currentDb = getDb();
  
  currentDb.run(`INSERT OR REPLACE INTO stage_status (stage_id, is_open, updated_at) 
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
  const currentDb = getDb();
  
  // Start transaction
  currentDb.serialize(() => {
    currentDb.run('BEGIN TRANSACTION');
    
    // Delete existing results for this stage
    currentDb.run('DELETE FROM admin_results WHERE stage_id = ?', [stageId], (err) => {
      if (err) {
        currentDb.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Insert new results
      const stmt = currentDb.prepare(`INSERT INTO admin_results (stage_id, category, slot_index, team_name) 
                               VALUES (?, ?, ?, ?)`);
      
      let hasError = false;
      
      Object.keys(results).forEach(category => {
        if (results[category] && Array.isArray(results[category])) {
          results[category].forEach((teamName, index) => {
            if (teamName) {
              stmt.run([stageId, category, index, teamName], (err) => {
                if (err && !hasError) {
                  hasError = true;
                  currentDb.run('ROLLBACK');
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
          currentDb.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (!hasError) {
          currentDb.run('COMMIT', (err) => {
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
  const currentDb = getDb();
  
  currentDb.run('DELETE FROM admin_results WHERE stage_id = ?', [stageId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Results deleted', changes: this.changes });
  });
});

// Get champion result
app.get('/api/admin/champion', (req, res) => {
  const currentDb = getDb();
  currentDb.get('SELECT champion FROM champion ORDER BY updated_at DESC LIMIT 1', (err, row) => {
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
  const currentDb = getDb();
  
  if (!champion) {
    res.status(400).json({ error: 'Champion name is required' });
    return;
  }
  
  // Delete existing champion and insert new one
  currentDb.run('DELETE FROM champion', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    currentDb.run('INSERT INTO champion (champion, updated_at) VALUES (?, CURRENT_TIMESTAMP)',
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
  const currentDb = getDb();
  currentDb.run('DELETE FROM champion', function(err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Champion deleted', changes: this.changes });
  });
});

// Get champion status
app.get('/api/admin/champion-status', (req, res) => {
  const currentDb = getDb();
  currentDb.get('SELECT * FROM champion_status WHERE id = 1', (err, row) => {
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
  const currentDb = getDb();
  
  currentDb.run(`INSERT OR REPLACE INTO champion_status (id, is_open, updated_at) 
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
// Database backup/restore endpoints
app.get('/api/admin/backup', (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found' });
    }
    
    // Send database file as download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="database-backup-${Date.now()}.db"`);
    res.sendFile(dbPath);
    console.log('[BACKUP] Database backup downloaded');
  } catch (error) {
    console.error('[BACKUP] Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Configure multer for file uploads
const upload = multer({ 
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Only accept .db and .db_ files
    if (file.originalname.endsWith('.db') || file.originalname.endsWith('.db_')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .db and .db_ files are allowed.'));
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Restore database from backup
app.post('/api/admin/restore', upload.single('backup'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadedFilePath = req.file.path;
  const backupFileName = req.file.originalname;

  try {
    // 1. Create backup of current database before restoring
    let backupFile = null;
    if (fs.existsSync(dbPath)) {
      const backupPath = path.join(__dirname, `database-backup-before-restore-${Date.now()}.db`);
      fs.copyFileSync(dbPath, backupPath);
      backupFile = path.basename(backupPath);
      console.log(`[RESTORE] Created backup of current database: ${backupFile}`);
    }

    // 2. Close current database connection
    db.close((err) => {
      if (err) {
        console.error('[RESTORE] Error closing database:', err);
        // Continue anyway
      } else {
        console.log('[RESTORE] Database connection closed');
      }

      try {
        // 3. Replace database file
        fs.copyFileSync(uploadedFilePath, dbPath);
        console.log(`[RESTORE] Database file replaced with: ${backupFileName}`);

        // 4. Reopen database connection
        const newDb = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            console.error('[RESTORE] Error reopening database:', err);
            return res.status(500).json({ 
              error: 'Failed to reopen database after restore',
              details: err.message 
            });
          }
          
          console.log('[RESTORE] Database connection reopened successfully');
          
          // Update global and local db references
          global.db = newDb;
          db = newDb;
          
          // Reinitialize database (create tables if needed)
          initDatabase();
          
          // Clean up uploaded file
          fs.unlinkSync(uploadedFilePath);
          
          res.json({ 
            message: 'Database restored successfully',
            backupFile: backupFile,
            restoredFrom: backupFileName
          });
        });
      } catch (error) {
        console.error('[RESTORE] Error during restore:', error);
        
        // Try to reopen database even if restore failed
        const newDb = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            console.error('[RESTORE] Failed to reopen database after error:', err);
          } else {
            global.db = newDb;
            db = newDb;
            initDatabase();
          }
        });
        
        // Clean up uploaded file
        if (fs.existsSync(uploadedFilePath)) {
          fs.unlinkSync(uploadedFilePath);
        }
        
        res.status(500).json({ 
          error: 'Failed to restore database',
          details: error.message 
        });
      }
    });
  } catch (error) {
    console.error('[RESTORE] Error:', error);
    
    // Clean up uploaded file
    if (fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
    
    res.status(500).json({ 
      error: 'Failed to restore database',
      details: error.message 
    });
  }
});

// Note: Database restore should be done manually by:
// 1. Downloading backup via /api/admin/backup
// 2. Stopping server
// 3. Replacing database.db file
// 4. Restarting server
// This is safer and avoids database connection issues

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  const currentDb = getDb();
  if (currentDb) {
    currentDb.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

