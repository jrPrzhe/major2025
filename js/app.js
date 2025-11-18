// Team data
const TEAMS_STAGE1 = [
  { name: "FaZe", logo: "placeholder.png" },
  { name: "GamerLegion", logo: "placeholder.png" },
  { name: "Ninjas in Pyjamas", logo: "placeholder.png" },
  { name: "B8", logo: "placeholder.png" },
  { name: "PARIVISION", logo: "placeholder.png" },
  { name: "fnatic", logo: "placeholder.png" },
  { name: "Legacy", logo: "placeholder.png" },
  { name: "Imperial", logo: "placeholder.png" },
  { name: "NRG", logo: "placeholder.png" },
  { name: "M80", logo: "placeholder.png" },
  { name: "Fluxo", logo: "placeholder.png" },
  { name: "RED Canids", logo: "placeholder.png" },
  { name: "Lynn Vision", logo: "placeholder.png" },
  { name: "The Huns", logo: "placeholder.png" },
  { name: "FlyQuest", logo: "placeholder.png" },
  { name: "Rare Atom", logo: "placeholder.png" }
];

const TEAMS_STAGE2 = [
  { name: "Aurora", logo: "placeholder.png" },
  { name: "Natus Vincere", logo: "placeholder.png" },
  { name: "Astralis", logo: "placeholder.png" },
  { name: "3DMAX", logo: "placeholder.png" },
  { name: "Liquid", logo: "placeholder.png" },
  { name: "MIBR", logo: "placeholder.png" },
  { name: "Passion UA", logo: "placeholder.png" },
  { name: "TYLOO", logo: "placeholder.png" }
];

const TEAMS_STAGE3 = [
  { name: "Vitality", logo: "placeholder.png" },
  { name: "Spirit", logo: "placeholder.png" },
  { name: "Falcons", logo: "placeholder.png" },
  { name: "MOUZ", logo: "placeholder.png" },
  { name: "G2", logo: "placeholder.png" },
  { name: "FURIA", logo: "placeholder.png" },
  { name: "paiN", logo: "placeholder.png" },
  { name: "The MongolZ", logo: "placeholder.png" }
];

// Players data
let players = {
  dima: { name: "Дима", score: 10000, picks: { stage1: {}, stage2: {}, stage3: {} } },
  evgeniy: { name: "Евгений", score: 10000, picks: { stage1: {}, stage2: {}, stage3: {} } },
  zakhar: { name: "Захар", score: 10000, picks: { stage1: {}, stage2: {}, stage3: {} } }
};

let activePlayer = null;
let currentSlot = null;
let currentStage = 'stage1';
let jsonFileHandle = null; // File System Access API file handle

// Initialize app
function init() {
  // Always load from JSON file first (JSON is the source of truth)
  loadFromJSON().then(() => {
    // After loading from JSON, sync to localStorage for faster access
    saveToStorage();
    initTimers();
    updateScores(); // Update scores based on admin results
    renderPlayers();
    setupPlayerSelection();
    setupStageNavigation();
    renderStage('stage1');
  }).catch(() => {
    // If JSON file doesn't exist, try localStorage as fallback
    loadFromStorage();
    // If localStorage also empty, use default data
    initTimers();
    updateScores();
    renderPlayers();
    setupPlayerSelection();
    setupStageNavigation();
    renderStage('stage1');
  });
}

// Request file handle for JSON file (File System Access API)
async function requestJSONFileHandle() {
  if (!window.showOpenFilePicker) {
    console.log('File System Access API not supported');
    return null;
  }
  
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSON files',
        accept: { 'application/json': ['.json'] }
      }],
      suggestedName: 'data.json',
      multiple: false
    });
    
    jsonFileHandle = fileHandle;
    console.log('JSON file handle obtained');
    return fileHandle;
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('Error getting file handle:', e);
    }
    return null;
  }
}

// Load from localStorage
function loadFromStorage() {
  const saved = localStorage.getItem('pickem_players');
  if (saved) {
    try {
      const loaded = JSON.parse(saved);
      Object.keys(players).forEach(key => {
        if (loaded[key]) {
          // Always use loaded picks (they are the source of truth)
          const loadedPicks = loaded[key].picks || { stage1: {}, stage2: {}, stage3: {} };
          
          // Ensure structure exists
          if (!loadedPicks.stage1) loadedPicks.stage1 = {};
          if (!loadedPicks.stage2) loadedPicks.stage2 = {};
          if (!loadedPicks.stage3) loadedPicks.stage3 = {};
          
          players[key] = {
            name: loaded[key].name || players[key].name,
            score: loaded[key].score !== undefined ? loaded[key].score : players[key].score,
            picks: loadedPicks
          };
        }
      });
      console.log('Data loaded from storage:', players);
    } catch (e) {
      console.error('Ошибка загрузки данных:', e);
    }
  }
}

// Save to localStorage (for caching)
function saveToStorage() {
  // Ensure picks structure is preserved
  Object.keys(players).forEach(key => {
    if (!players[key].picks) {
      players[key].picks = { stage1: {}, stage2: {}, stage3: {} };
    } else {
      // Ensure all stages exist
      if (!players[key].picks.stage1) players[key].picks.stage1 = {};
      if (!players[key].picks.stage2) players[key].picks.stage2 = {};
      if (!players[key].picks.stage3) players[key].picks.stage3 = {};
    }
  });
  localStorage.setItem('pickem_players', JSON.stringify(players));
}

// Save to JSON file (main storage)
async function saveToJSONFile() {
  // Ensure picks structure is preserved
  Object.keys(players).forEach(key => {
    if (!players[key].picks) {
      players[key].picks = { stage1: {}, stage2: {}, stage3: {} };
    } else {
      if (!players[key].picks.stage1) players[key].picks.stage1 = {};
      if (!players[key].picks.stage2) players[key].picks.stage2 = {};
      if (!players[key].picks.stage3) players[key].picks.stage3 = {};
    }
  });
  
  // Collect all data
  const data = {
    players: players,
    adminResults: {
      stage1: getStageResults('stage1'),
      stage2: getStageResults('stage2'),
      stage3: getStageResults('stage3')
    }
  };
  
  const jsonString = JSON.stringify(data, null, 2);
  
  // Try to use File System Access API if available
  if (window.showSaveFilePicker && jsonFileHandle) {
    try {
      const writable = await jsonFileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      console.log('Data saved to JSON file via File System Access API');
      return;
    } catch (e) {
      console.error('Error writing to file:', e);
      // Fallback to download
    }
  }
  
  // Fallback: save to localStorage (JSON file will be updated via export)
  // In browser environment, we can't directly write to files without user permission
  // So we use localStorage as the main storage and JSON as export/import
  console.log('Data saved to localStorage (JSON export available)');
}

// Load from JSON file
async function loadFromJSON() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error('JSON file not found');
    }
    const data = await response.json();
    
    if (data.players) {
      Object.keys(players).forEach(key => {
        if (data.players[key]) {
          const loadedPicks = data.players[key].picks || { stage1: {}, stage2: {}, stage3: {} };
          
          // Ensure structure exists
          if (!loadedPicks.stage1) loadedPicks.stage1 = {};
          if (!loadedPicks.stage2) loadedPicks.stage2 = {};
          if (!loadedPicks.stage3) loadedPicks.stage3 = {};
          
          // Use JSON data (JSON is the source of truth)
          players[key] = {
            name: data.players[key].name || players[key].name,
            score: data.players[key].score !== undefined ? data.players[key].score : players[key].score,
            picks: loadedPicks
          };
        }
      });
    }
    
    // Load admin results
    if (data.adminResults) {
      Object.keys(data.adminResults).forEach(stageId => {
        if (data.adminResults[stageId] && !localStorage.getItem(`admin_results_${stageId}`)) {
          localStorage.setItem(`admin_results_${stageId}`, JSON.stringify(data.adminResults[stageId]));
        }
      });
    }
    
    console.log('Data loaded from JSON file');
  } catch (e) {
    console.log('JSON file not available, using localStorage only');
    throw e;
  }
}

// Export to JSON (manual trigger)
async function exportToJSON() {
  // Try to get file handle if not already obtained
  if (!jsonFileHandle) {
    const handle = await requestJSONFileHandle();
    if (handle) {
      // File handle obtained, save directly
      await saveToJSONFile();
      alert('✅ Данные сохранены в JSON файл!');
      return;
    }
  } else {
    // File handle exists, save directly
    await saveToJSONFile();
    alert('✅ Данные сохранены в JSON файл!');
    return;
  }
  
  // Fallback: download file
  const data = {
    players: players,
    adminResults: {
      stage1: getStageResults('stage1'),
      stage2: getStageResults('stage2'),
      stage3: getStageResults('stage3')
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  alert('✅ Данные экспортированы в файл data.json\n\n💡 Совет: Выберите файл data.json при следующем экспорте для автоматического обновления.');
}

// Import from JSON file
function importFromJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (data.players) {
        Object.keys(players).forEach(key => {
          if (data.players[key]) {
            const loadedPicks = data.players[key].picks || { stage1: {}, stage2: {}, stage3: {} };
            
            // Ensure structure exists
            if (!loadedPicks.stage1) loadedPicks.stage1 = {};
            if (!loadedPicks.stage2) loadedPicks.stage2 = {};
            if (!loadedPicks.stage3) loadedPicks.stage3 = {};
            
            players[key] = {
              name: data.players[key].name || players[key].name,
              score: data.players[key].score !== undefined ? data.players[key].score : players[key].score,
              picks: loadedPicks
            };
          }
        });
      }
      
      // Import admin results
      if (data.adminResults) {
        Object.keys(data.adminResults).forEach(stageId => {
          if (data.adminResults[stageId]) {
            localStorage.setItem(`admin_results_${stageId}`, JSON.stringify(data.adminResults[stageId]));
          }
        });
      }
      
      // Save to localStorage (main storage)
      saveToStorage();
      
      // Update UI
      updateScores();
      renderPlayers();
      if (activePlayer) {
        renderStage(currentStage);
      }
      
      alert('✅ Данные импортированы из JSON файла и сохранены в localStorage!');
    } catch (error) {
      console.error('Ошибка импорта:', error);
      alert('❌ Ошибка при импорте JSON файла. Проверьте формат файла.');
    }
  };
  reader.readAsText(file);
  
  // Reset input
  event.target.value = '';
}

// Render players
function renderPlayers() {
  document.querySelectorAll('.player-card').forEach(card => {
    const playerKey = card.dataset.player;
    const playerNameEl = card.querySelector('.player-name');
    const scoreEl = card.querySelector('.score-value');

    playerNameEl.textContent = players[playerKey].name;
    scoreEl.textContent = players[playerKey].score.toLocaleString();

    // Edit nickname
    card.querySelector('.edit-nickname').onclick = (e) => {
      e.stopPropagation();
      const newName = prompt('Введите новый ник (1-20 символов):', players[playerKey].name);
      if (newName !== null) {
        const trimmed = newName.trim();
        if (trimmed.length === 0) return;
        if (trimmed.length > 0 && trimmed.length <= 20) {
            players[playerKey].name = trimmed;
            renderPlayers();
            saveToStorage(); // Save to localStorage
            saveToJSONFile(); // Auto-save to JSON if file handle exists
            if (activePlayer === playerKey) {
              updateLoginStatus();
            }
            alert('✅ Никнейм изменён!');
        } else {
          alert('❌ Никнейм должен содержать от 1 до 20 символов!');
        }
      }
    };
  });
}

// Setup player selection
function setupPlayerSelection() {
  document.querySelectorAll('.player-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-nickname')) return;
      const playerKey = card.dataset.player;
      setActivePlayer(playerKey);
    });
  });
}

// Set active player
function setActivePlayer(playerKey) {
  activePlayer = playerKey;
  document.querySelectorAll('.player-card').forEach(card => {
    card.classList.remove('active');
  });
  document.querySelector(`.player-card[data-player="${playerKey}"]`).classList.add('active');
  updateLoginStatus();
  renderStage(currentStage);
}

// Update login status
function updateLoginStatus() {
  const statusEl = document.getElementById('login-status');
  if (activePlayer) {
    statusEl.textContent = `Вы вошли как: ${players[activePlayer].name}`;
  } else {
    statusEl.textContent = 'Выберите игрока для прогнозов';
  }
}

// Setup stage navigation
function setupStageNavigation() {
  document.querySelectorAll('.stage-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const stageId = tab.dataset.stage;
      switchStage(stageId);
    });
  });
}

// Switch stage
function switchStage(stageId) {
  currentStage = stageId;
  document.querySelectorAll('.stage-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`.stage-tab[data-stage="${stageId}"]`).classList.add('active');

  document.querySelectorAll('.stage').forEach(stage => {
    stage.classList.remove('active');
  });
  document.getElementById(`${stageId}-content`).classList.add('active');

  renderStage(stageId);
}

// Render stage
function renderStage(stageId) {
  const teams = getTeamsForStage(stageId);
  renderTeams(stageId, teams);
  renderPicks(stageId);
  updateSaveButton(stageId);
}

// Get teams for stage
function getTeamsForStage(stageId) {
  if (stageId === 'stage1') {
    return TEAMS_STAGE1;
  } else if (stageId === 'stage2') {
    // Stage 2: прошедшие из Stage 1 + известные команды Stage 2
    const stage1Results = getStageResults('stage1');
    const advancedFromStage1 = stage1Results ? [
      ...(stage1Results['30'] || []),
      ...(stage1Results['31-32'] || [])
    ] : [];
    return [...advancedFromStage1, ...TEAMS_STAGE2];
  } else if (stageId === 'stage3') {
    // Stage 3: прошедшие из Stage 2 + известные команды Stage 3
    const stage2Results = getStageResults('stage2');
    const advancedFromStage2 = stage2Results ? [
      ...(stage2Results['30'] || []),
      ...(stage2Results['31-32'] || [])
    ] : [];
    return [...advancedFromStage2, ...TEAMS_STAGE3];
  }
  return [];
}

// Get stage results from admin
function getStageResults(stageId) {
  const results = localStorage.getItem(`admin_results_${stageId}`);
  if (results) {
    try {
      return JSON.parse(results);
    } catch (e) {
      console.error('Ошибка загрузки результатов:', e);
    }
  }
  return null;
}

// Render teams
function renderTeams(stageId, teams) {
  const container = document.getElementById(`teams-${stageId}`);
  if (!container) return;

  container.innerHTML = '';
  teams.forEach(team => {
    const teamLogo = document.createElement('div');
    teamLogo.className = 'team-logo';
    teamLogo.dataset.team = team.name;
    teamLogo.innerHTML = `
      <img src="${team.logo}" alt="${team.name}" 
           onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'70\\' height=\\'70\\'%3E%3Crect fill=\\'%23333\\' width=\\'70\\' height=\\'70\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'12\\'%3E${team.name.substring(0, 3)}%3C/text%3E%3C/svg%3E'">
    `;
    teamLogo.addEventListener('click', () => selectTeamForSlot(team.name));
    container.appendChild(teamLogo);
  });
}

// Render picks
function renderPicks(stageId) {
  if (!activePlayer) {
    // Lock all slots if no active player
    document.querySelectorAll(`#${stageId}-content .slot`).forEach(slot => {
      slot.classList.add('locked');
      slot.classList.remove('filled');
      slot.innerHTML = '';
    });
    return;
  }

  const picks = players[activePlayer].picks[stageId] || {};
  const isExpired = isTimerExpired(stageId);

  ['30', '03', '31-32'].forEach(category => {
    const slots = document.querySelectorAll(`#slots-${category}-${stageId} .slot`);
    slots.forEach((slot, index) => {
      const slotKey = `${category}-${index}`;
      const teamName = picks[slotKey];

      slot.classList.remove('locked', 'filled');
      slot.innerHTML = '';

      if (isExpired) {
        slot.classList.add('locked');
      } else {
        if (teamName) {
          slot.classList.add('filled');
          slot.innerHTML = `
            <div class="team-name">${teamName}</div>
            <button class="remove-team" onclick="removeTeamFromSlot('${stageId}', '${slotKey}')">×</button>
          `;
        }
      }
    });
  });
}

// Select team for current slot
function selectTeamForSlot(teamName) {
  if (!activePlayer) {
    alert('⚠️ Сначала выберите игрока!');
    closeModal();
    return;
  }

  if (!currentSlot) {
    alert('⚠️ Сначала выберите слот для заполнения!');
    closeModal();
    return;
  }

  const { stageId, category, slotIndex } = currentSlot;
  
  if (isTimerExpired(stageId)) {
    alert('⚠️ Время приёма ставок истекло!');
    closeModal();
    return;
  }

  const slotKey = `${category}-${slotIndex}`;

  if (!players[activePlayer].picks[stageId]) {
    players[activePlayer].picks[stageId] = {};
  }

  // Check if team is already selected in another slot of same category
  const existingPicks = players[activePlayer].picks[stageId];
  const categorySlots = Object.keys(existingPicks).filter(key => key.startsWith(category));
  const isAlreadySelected = categorySlots.some(key => existingPicks[key] === teamName);
  
  if (isAlreadySelected && existingPicks[slotKey] !== teamName) {
    alert('⚠️ Эта команда уже выбрана в другом слоте этой категории!');
    closeModal();
    return;
  }

  players[activePlayer].picks[stageId][slotKey] = teamName;
  saveToStorage(); // Save to localStorage
  saveToJSONFile(); // Auto-save to JSON if file handle exists
  renderPicks(stageId);
  updateSaveButton(stageId);
  currentSlot = null;
  closeModal();
}

// Setup slot clicks
function setupSlotClicks() {
  document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', function() {
      if (this.classList.contains('locked')) return;
      if (!activePlayer) {
        alert('⚠️ Сначала выберите игрока!');
        return;
      }

      const stageId = this.closest('.stage').id.replace('-content', '');
      const category = this.dataset.category;
      const slotIndex = this.dataset.slot;

      if (isTimerExpired(stageId)) {
        alert('⚠️ Время приёма ставок истекло!');
        return;
      }

      currentSlot = { stageId, category, slotIndex };
      openTeamModal(stageId);
    });
  });
}

// Open team modal
function openTeamModal(stageId) {
  const modal = document.getElementById('team-modal');
  const modalTeams = document.getElementById('modal-teams');
  const teams = getTeamsForStage(stageId);

  modalTeams.innerHTML = '';
  teams.forEach(team => {
    const teamEl = document.createElement('div');
    teamEl.className = 'modal-team';
    teamEl.innerHTML = `
      <img src="${team.logo}" alt="${team.name}" 
           onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'60\\'%3E%3Crect fill=\\'%23333\\' width=\\'60\\' height=\\'60\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'10\\'%3E${team.name.substring(0, 3)}%3C/text%3E%3C/svg%3E'">
      <div class="team-name">${team.name}</div>
    `;
    teamEl.addEventListener('click', () => selectTeamForSlot(team.name));
    modalTeams.appendChild(teamEl);
  });

  modal.classList.add('active');
}

// Close modal
function closeModal() {
  document.getElementById('team-modal').classList.remove('active');
  currentSlot = null;
}

// Remove team from slot
function removeTeamFromSlot(stageId, slotKey) {
  if (!activePlayer) return;
  if (isTimerExpired(stageId)) {
    alert('⚠️ Время приёма ставок истекло!');
    return;
  }

  if (players[activePlayer].picks[stageId]) {
    delete players[activePlayer].picks[stageId][slotKey];
    saveToStorage(); // Save to localStorage
    saveToJSONFile(); // Auto-save to JSON if file handle exists
    renderPicks(stageId);
    updateSaveButton(stageId);
  }
}

// Update save button
function updateSaveButton(stageId) {
  const btn = document.getElementById(`save-${stageId}`);
  if (!btn) return;

  if (!activePlayer) {
    btn.disabled = true;
    return;
  }

  const picks = players[activePlayer].picks[stageId] || {};
  const hasPicks = Object.keys(picks).length > 0;
  btn.disabled = !hasPicks || isTimerExpired(stageId);
}

// Save picks
function savePicks(stageId) {
  if (!activePlayer) {
    alert('⚠️ Сначала выберите игрока!');
    return;
  }

  if (isTimerExpired(stageId)) {
    alert('⚠️ Время приёма ставок истекло!');
    return;
  }

  saveToStorage(); // Save to localStorage
  saveToJSONFile(); // Auto-save to JSON if file handle exists
  alert('✅ Прогнозы сохранены!');
}

// Update scores based on admin results
function updateScores() {
  console.log('Updating scores...');
  
  // Reset all scores to base
  Object.keys(players).forEach(playerKey => {
    players[playerKey].score = 10000;
  });

  ['stage1', 'stage2', 'stage3'].forEach(stageId => {
    const results = getStageResults(stageId);
    if (!results) {
      console.log(`No results for ${stageId}`);
      return;
    }

    console.log(`Processing results for ${stageId}:`, results);

    Object.keys(players).forEach(playerKey => {
      const picks = players[playerKey].picks[stageId] || {};
      let correct = 0;
      let wrong = 0;

      // Check 3:0 ADVANCED
      const correct30 = results['30'] || [];
      const picks30 = [];
      for (let i = 0; i < 2; i++) {
        const pick = picks[`30-${i}`];
        if (pick) picks30.push(pick);
      }
      correct30.forEach(team => {
        if (picks30.includes(team)) correct++;
      });
      picks30.forEach(team => {
        if (!correct30.includes(team)) wrong++;
      });

      // Check 0:3 ELIMINATED
      const correct03 = results['03'] || [];
      const picks03 = [];
      for (let i = 0; i < 2; i++) {
        const pick = picks[`03-${i}`];
        if (pick) picks03.push(pick);
      }
      correct03.forEach(team => {
        if (picks03.includes(team)) correct++;
      });
      picks03.forEach(team => {
        if (!correct03.includes(team)) wrong++;
      });

      // Check 3:1 OR 3:2 ADVANCED
      const correct31_32 = results['31-32'] || [];
      const picks31_32 = [];
      for (let i = 0; i < 5; i++) {
        const pick = picks[`31-32-${i}`];
        if (pick) picks31_32.push(pick);
      }
      correct31_32.forEach(team => {
        if (picks31_32.includes(team)) correct++;
      });
      picks31_32.forEach(team => {
        if (!correct31_32.includes(team)) wrong++;
      });

      // Add to score (accumulate across stages)
      const points = (correct * 1000) - (wrong * 500);
      players[playerKey].score += points;
      
      console.log(`${playerKey}: +${correct} correct, -${wrong} wrong, points: ${points}, total: ${players[playerKey].score}`);
    });
  });

  // Save scores (picks are not modified in this function, so they're preserved)
  saveToStorage(); // Save to localStorage
  saveToJSONFile(); // Auto-save to JSON if file handle exists
  renderPlayers();
  console.log('Scores updated and saved');
}

// Setup modal close
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.close-modal').addEventListener('click', closeModal);
  document.getElementById('team-modal').addEventListener('click', (e) => {
    if (e.target.id === 'team-modal') closeModal();
  });

  // Setup save buttons
  document.getElementById('save-stage1').addEventListener('click', () => savePicks('stage1'));
  document.getElementById('save-stage2').addEventListener('click', () => savePicks('stage2'));
  document.getElementById('save-stage3').addEventListener('click', () => savePicks('stage3'));

  // Setup slot clicks after DOM is ready
  setTimeout(() => {
    setupSlotClicks();
  }, 100);

  init();
});

// Auto-update scores when results change
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith('admin_results_')) {
    console.log('Storage event detected:', e.key);
    // Update scores without reloading (to preserve current state)
    updateScores();
    // Re-render current stage to show updated teams
    if (activePlayer) {
      renderStage(currentStage);
    }
  }
});

// Listen for custom event from admin panel
window.addEventListener('adminResultsSaved', (e) => {
  console.log('Admin results saved event:', e.stageId);
  // Update scores without reloading (to preserve current state)
  updateScores();
  if (activePlayer) {
    renderStage(currentStage);
  }
});

// Also check for results periodically
setInterval(() => {
  updateScores();
}, 5000); // Check every 5 seconds

