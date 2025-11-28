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
  { name: "TYLOO", logo: "placeholder.png" },
  { name: "QUALIFIER", logo: "QUALIFIER.png" },
  { name: "QUALIFIER", logo: "QUALIFIER.png" },
  { name: "QUALIFIER", logo: "QUALIFIER.png" },
  { name: "QUALIFIER", logo: "QUALIFIER.png" },
  { name: "QUALIFIER", logo: "QUALIFIER.png" },
  { name: "QUALIFIER", logo: "QUALIFIER.png" },
  { name: "QUALIFIER", logo: "QUALIFIER.png" },
  { name: "QUALIFIER", logo: "QUALIFIER.png" }
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

// Players data (loaded from API)
let players = {
  dima: { name: "Дима", score: 10000, picks: { stage1: {}, stage2: {}, stage3: {} } },
  evgeniy: { name: "Евгений", score: 10000, picks: { stage1: {}, stage2: {}, stage3: {} } },
  zakhar: { name: "Захар", score: 10000, picks: { stage1: {}, stage2: {}, stage3: {} } }
};

let activePlayer = null;
let currentSlot = null;
let currentStage = 'stage1';
let stageStatusCache = {}; // Cache for stage open/close status

// Get all teams from all stages (for champion selection)
async function getAllTeams() {
  const allTeams = [];
  const teamNames = new Set();
  
  // Add teams from Stage 1
  TEAMS_STAGE1.forEach(team => {
    if (!teamNames.has(team.name)) {
      allTeams.push(team);
      teamNames.add(team.name);
    }
  });
  
  // Add teams from Stage 2 (known teams only, no QUALIFIER)
  TEAMS_STAGE2.forEach(team => {
    if (team.name !== 'QUALIFIER' && !teamNames.has(team.name)) {
      allTeams.push(team);
      teamNames.add(team.name);
    }
  });
  
  // Add teams from Stage 3
  TEAMS_STAGE3.forEach(team => {
    if (!teamNames.has(team.name)) {
      allTeams.push(team);
      teamNames.add(team.name);
    }
  });
  
  // Add teams that advanced from Stage 1 to Stage 2
  const stage1Results = await getStageResults('stage1');
  if (stage1Results) {
    const advancedFromStage1 = [
      ...(stage1Results['30'] || []),
      ...(stage1Results['31-32'] || [])
    ];
    advancedFromStage1.forEach(teamName => {
      if (!teamNames.has(teamName)) {
        const team = TEAMS_STAGE1.find(t => t.name === teamName);
        if (team) {
          allTeams.push(team);
          teamNames.add(teamName);
        }
      }
    });
  }
  
  // Add teams that advanced from Stage 2 to Stage 3
  const stage2Results = await getStageResults('stage2');
  if (stage2Results) {
    const advancedFromStage2 = [
      ...(stage2Results['30'] || []),
      ...(stage2Results['31-32'] || [])
    ];
    
    // Get Stage 2 teams once before the loop
    const stage2Teams = await getTeamsForStage('stage2');
    
    // Now we can use forEach since we already have stage2Teams
    advancedFromStage2.forEach(teamName => {
      if (!teamNames.has(teamName)) {
        // Try to find in Stage 2 teams
        const team = stage2Teams.find(t => t.name === teamName);
        if (team) {
          allTeams.push(team);
          teamNames.add(teamName);
        }
      }
    });
  }
  
  return allTeams.sort((a, b) => a.name.localeCompare(b.name));
}

// Initialize app
async function init() {
  console.log('[APP] Initializing app...');
  try {
    console.log('[APP] Loading players from API...');
    await loadPlayersFromAPI();
    console.log('[APP] Players loaded:', players);
    
    console.log('[APP] Updating results cache...');
    await updateResultsCache(); // Load admin results into cache
    
    console.log('[APP] Updating stage status cache...');
    await updateStageStatusCache(); // Load stage statuses
    
    console.log('[APP] Updating champion status cache...');
    await updateChampionStatusCache(); // Load champion status
    
    console.log('[APP] Getting champion result...');
    await getChampionResult(); // Load champion result
    
    
    console.log('[APP] Updating scores...');
    await updateScores(); // Update scores based on admin results
    
    console.log('[APP] Rendering players...');
    renderPlayers();
    
    console.log('[APP] Setting up player selection...');
    setupPlayerSelection();
    
    console.log('[APP] Setting up stage navigation...');
    setupStageNavigation();
    
    console.log('[APP] Setting up champion selection...');
    setupChampionSelection(); // Setup champion pick
    
    console.log('[APP] Rendering champion pick...');
    renderChampionPick(); // Render champion pick
    
    console.log('[APP] Rendering stage 1...');
    await renderStage('stage1');
    
    console.log('[APP] Setting up slot clicks...');
    // Setup slot clicks after everything is rendered
    setupSlotClicks();
    
    console.log('[APP] Initialization complete!');
  } catch (error) {
    console.error('[APP] Error initializing app:', error);
    alert('Ошибка загрузки данных. Проверьте подключение к серверу. Детали в консоли.');
  }
}

// Update stage status cache
async function updateStageStatusCache() {
  try {
    const statuses = await api.getAllStageStatuses();
    statuses.forEach(status => {
      stageStatusCache[status.stage_id] = status.is_open === 1;
    });
    // Set default for stages not in DB
    ['stage1', 'stage2', 'stage3'].forEach(stageId => {
      if (stageStatusCache[stageId] === undefined) {
        stageStatusCache[stageId] = true; // Default: open
      }
    });
    // Update visual status badges
    updateVotingStatusBadges();
  } catch (error) {
    console.error('Error loading stage statuses:', error);
    // Default: all stages open
    ['stage1', 'stage2', 'stage3'].forEach(stageId => {
      stageStatusCache[stageId] = true;
    });
    updateVotingStatusBadges();
  }
}

// Update voting status badges
function updateVotingStatusBadges() {
  ['stage1', 'stage2', 'stage3'].forEach(stageId => {
    const statusEl = document.getElementById(`voting-status-${stageId}`);
    if (statusEl) {
      const isOpen = isStageOpen(stageId);
      statusEl.innerHTML = isOpen 
        ? '<span class="status-badge open">✅ Голосование открыто</span>'
        : '<span class="status-badge closed">🔒 Голосование закрыто</span>';
    }
  });
}

// Check if stage is open for voting
function isStageOpen(stageId) {
  return stageStatusCache[stageId] !== false; // Default to true if not set
}

// Check if champion voting is open
let championStatusCache = true; // Default to open

async function updateChampionStatusCache() {
  try {
    const status = await api.getChampionStatus();
    championStatusCache = status ? status.is_open === 1 : true;
    renderChampionPick(); // Update display when status changes
  } catch (error) {
    console.error('Error loading champion status:', error);
    championStatusCache = true; // Default to open on error
  }
}

function isChampionOpen() {
  return championStatusCache !== false; // Default to true if not set
}

// Load players from API
async function loadPlayersFromAPI() {
  try {
    const playersData = await api.getPlayers();
    
    // Load each player's data
    for (const playerData of playersData) {
      if (players[playerData.id]) {
        players[playerData.id].name = playerData.name;
        players[playerData.id].score = playerData.score;
        
        // Load picks
        try {
          const picks = await api.getPicks(playerData.id);
          players[playerData.id].picks = picks || { stage1: {}, stage2: {}, stage3: {} };
          
          // Load champion pick (stored as pick with stageId='champion')
          const championPick = picks?.champion?.['champion-0'] || null;
          players[playerData.id].championPick = championPick;
        } catch (e) {
          console.error(`Error loading picks for ${playerData.id}:`, e);
          players[playerData.id].picks = { stage1: {}, stage2: {}, stage3: {} };
          players[playerData.id].championPick = null;
        }
      }
    }
    
    console.log('Players loaded from API:', players);
  } catch (error) {
    console.error('Error loading players:', error);
    throw error;
  }
}

// Save player to API
async function savePlayerToAPI(playerId) {
  try {
    await api.updatePlayer(playerId, {
      name: players[playerId].name,
      score: players[playerId].score
    });
  } catch (error) {
    console.error('Error saving player:', error);
    throw error;
  }
}

// Save pick to API
async function savePickToAPI(playerId, stageId, slotKey, teamName) {
  try {
    await api.savePick(playerId, stageId, slotKey, teamName);
  } catch (error) {
    console.error('Error saving pick:', error);
    throw error;
  }
}

// Delete pick from API
async function deletePickFromAPI(playerId, stageId, slotKey) {
  try {
    await api.deletePick(playerId, stageId, slotKey);
  } catch (error) {
    console.error('Error deleting pick:', error);
    throw error;
  }
}

// Get stage results from API
async function getStageResults(stageId) {
  try {
    return await api.getAdminResults(stageId);
  } catch (error) {
    console.error('Error loading admin results:', error);
    return null;
  }
}

// Render players
function renderPlayers() {
  document.querySelectorAll('.player-card').forEach(card => {
    const playerKey = card.dataset.player;
    const playerNameEl = card.querySelector('.player-name');
    const scoreEl = card.querySelector('.score-value');

    playerNameEl.textContent = players[playerKey].name;
    scoreEl.textContent = players[playerKey].score.toLocaleString();

    // Render results if available
    const resultsContainer = card.querySelector('.player-results');
    if (resultsContainer) {
      resultsContainer.remove();
    }

    const results = players[playerKey].results;
    if (results) {
      // Collect all correct and wrong teams across all stages
      const allCorrect = [];
      const allWrong = [];
      
      ['stage1', 'stage2', 'stage3'].forEach(stageId => {
        if (results[stageId]) {
          allCorrect.push(...results[stageId].correct);
          allWrong.push(...results[stageId].wrong);
        }
      });
      
      // Add champion result
      if (results.champion) {
        if (results.champion.correct.length > 0) {
          allCorrect.push(...results.champion.correct);
        }
        if (results.champion.wrong.length > 0) {
          allWrong.push(...results.champion.wrong);
        }
      }

      // Only show results if there are any
      if (allCorrect.length > 0 || allWrong.length > 0) {
        const resultsDiv = document.createElement('div');
        resultsDiv.className = 'player-results';
        
        if (allCorrect.length > 0) {
          const correctDiv = document.createElement('div');
          correctDiv.className = 'result-correct';
          correctDiv.innerHTML = `
            <span class="result-icon">✅</span>
            <span class="result-label">Зашло:</span>
            <span class="result-teams">${allCorrect.join(', ')}</span>
          `;
          resultsDiv.appendChild(correctDiv);
        }
        
        if (allWrong.length > 0) {
          const wrongDiv = document.createElement('div');
          wrongDiv.className = 'result-wrong';
          wrongDiv.innerHTML = `
            <span class="result-icon">❌</span>
            <span class="result-label">Не зашло:</span>
            <span class="result-teams">${allWrong.join(', ')}</span>
          `;
          resultsDiv.appendChild(wrongDiv);
        }
        
        card.appendChild(resultsDiv);
      }
    }

    // Edit nickname
    card.querySelector('.edit-nickname').onclick = async (e) => {
      e.stopPropagation();
      const newName = prompt('Введите новый ник (1-20 символов):', players[playerKey].name);
      if (newName !== null) {
        const trimmed = newName.trim();
        if (trimmed.length === 0) return;
        if (trimmed.length > 0 && trimmed.length <= 20) {
          players[playerKey].name = trimmed;
          try {
            await savePlayerToAPI(playerKey);
            renderPlayers();
            if (activePlayer === playerKey) {
              updateLoginStatus();
            }
            alert('✅ Никнейм изменён!');
          } catch (error) {
            alert('❌ Ошибка при сохранении никнейма');
          }
        } else {
          alert('❌ Никнейм должен содержать от 1 до 20 символов!');
        }
      }
    };
  });
}

// Setup player selection
function setupPlayerSelection() {
  console.log('[APP] Setting up player selection...');
  const playerCards = document.querySelectorAll('.player-card');
  console.log('[APP] Found', playerCards.length, 'player cards');
  
  playerCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-nickname')) return;
      const playerKey = card.dataset.player;
      console.log('[APP] Player card clicked:', playerKey);
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
  renderChampionPick(); // Update champion pick display
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
  console.log('[APP] Setting up stage navigation...');
  const stageTabs = document.querySelectorAll('.stage-tab');
  console.log('[APP] Found', stageTabs.length, 'stage tabs');
  
  stageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const stageId = tab.dataset.stage;
      console.log('[APP] Stage tab clicked:', stageId);
      switchStage(stageId);
    });
  });
}

// Switch stage
async function switchStage(stageId) {
  currentStage = stageId;
  document.querySelectorAll('.stage-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`.stage-tab[data-stage="${stageId}"]`).classList.add('active');

  document.querySelectorAll('.stage').forEach(stage => {
    stage.classList.remove('active');
  });
  document.getElementById(`${stageId}-content`).classList.add('active');

  // Обновляем кэш результатов перед рендерингом, чтобы команды были актуальными
  await updateResultsCache();
  await renderStage(stageId);
}

// Render stage
async function renderStage(stageId) {
  const teams = await getTeamsForStage(stageId);
  if (!teams || teams.length === 0) {
    console.error(`No teams returned for ${stageId}`);
  }
  renderTeams(stageId, teams);
  renderPicks(stageId);
  updateSaveButton(stageId);
}

// Get teams for stage
async function getTeamsForStage(stageId) {
  if (stageId === 'stage1') {
    return TEAMS_STAGE1;
  } else if (stageId === 'stage2') {
    // Stage 2: прошедшие из Stage 1 (3:0, 3:1, 3:2) + все известные команды Stage 2 (8 команд) + 8 QUALIFIER
    const stage1Results = await getStageResults('stage1');
    const advancedTeamNames = stage1Results ? [
      ...(stage1Results['30'] || []),
      ...(stage1Results['31-32'] || [])
    ] : [];
    
    // Преобразуем названия команд в объекты команд из TEAMS_STAGE1
    const advancedFromStage1 = advancedTeamNames.map(teamName => {
      const team = TEAMS_STAGE1.find(t => t.name === teamName);
      return team || { name: teamName, logo: "placeholder.png" };
    });
    
    // Все известные команды Stage 2: Aurora, Natus Vincere, Astralis, 3DMAX, Liquid, MIBR, Passion UA, TYLOO
    const knownTeams = TEAMS_STAGE2.filter(t => t.name !== 'QUALIFIER');
    const qualifiers = TEAMS_STAGE2.filter(t => t.name === 'QUALIFIER');
    
    // Формируем список: прошедшие из Stage 1 + все известные команды + QUALIFIER
    // Всего должно быть 16 команд
    // Прошедшие из Stage 1 (8 команд: 2 из 3:0 + 6 из 3:1/3:2) + все известные (8) = 16
    if (advancedFromStage1.length > 0) {
      // Прошедшие из Stage 1 (8) + все известные команды (8) = 16 команд (без QUALIFIER)
      return [...advancedFromStage1, ...knownTeams];
    }
    // Если результатов Stage 1 еще нет, показываем все известные команды + 8 QUALIFIER
    return TEAMS_STAGE2; // 8 известных + 8 QUALIFIER (до получения результатов Stage 1)
  } else if (stageId === 'stage3') {
    const stage2Results = await getStageResults('stage2');
    const advancedTeamNames = stage2Results ? [
      ...(stage2Results['30'] || []),
      ...(stage2Results['31-32'] || [])
    ] : [];
    
    // Получаем команды Stage 2 для поиска логотипов
    const stage2Teams = await getTeamsForStage('stage2');
    
    // Преобразуем названия команд в объекты команд
    const advancedFromStage2 = advancedTeamNames.map(teamName => {
      const team = stage2Teams.find(t => t.name === teamName);
      return team || { name: teamName, logo: "placeholder.png" };
    });
    
    return [...advancedFromStage2, ...TEAMS_STAGE3];
  }
  return [];
}

// Get stage results synchronously (from cache)
let stageResultsCache = {};
let championResultCache = null;

function getStageResultsSync(stageId) {
  return stageResultsCache[stageId] || null;
}

// Get champion result
async function getChampionResult() {
  if (championResultCache !== null) {
    return championResultCache;
  }
  try {
    const result = await api.getChampionResult();
    championResultCache = result;
    return result;
  } catch (error) {
    console.error('Error loading champion result:', error);
    return null;
  }
}

// Update cache when results are loaded
async function updateResultsCache() {
  for (const stageId of ['stage1', 'stage2', 'stage3']) {
    const results = await getStageResults(stageId);
    if (results && (results['30']?.length > 0 || results['03']?.length > 0 || results['31-32']?.length > 0)) {
      stageResultsCache[stageId] = results;
    } else {
      // Clear cache if results are empty or null
      delete stageResultsCache[stageId];
    }
  }
}

// Render teams
function renderTeams(stageId, teams) {
  const container = document.getElementById(`teams-${stageId}`);
  if (!container) {
    console.error(`Container teams-${stageId} not found`);
    return;
  }

  container.innerHTML = '';
  if (!teams || teams.length === 0) {
    console.warn(`No teams to render for ${stageId}`);
    return;
  }
  
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
    document.querySelectorAll(`#${stageId}-content .slot`).forEach(slot => {
      slot.classList.add('locked');
      slot.classList.remove('filled');
      slot.innerHTML = '';
    });
    return;
  }

  const picks = players[activePlayer].picks[stageId] || {};
  const isClosed = !isStageOpen(stageId);
  const isLocked = isClosed;

  ['30', '03', '31-32'].forEach(category => {
    const slots = document.querySelectorAll(`#slots-${category}-${stageId} .slot`);
    slots.forEach((slot, index) => {
      const slotKey = `${category}-${index}`;
      const teamName = picks[slotKey];

      slot.classList.remove('locked', 'filled');
      slot.innerHTML = '';

      if (isLocked) {
        slot.classList.add('locked');
      }

      if (teamName) {
        slot.classList.add('filled');
        const canEdit = !isLocked;
        slot.innerHTML = `
          <div class="team-name">${teamName}</div>
          ${canEdit ? `<button class="remove-team" onclick="removeTeamFromSlot('${stageId}', '${slotKey}')">×</button>` : ''}
        `;
      }
    });
  });
}

// Select team for current slot
async function selectTeamForSlot(teamName) {
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
  
  if (!isStageOpen(stageId)) {
    alert('⚠️ Голосование для этой стадии закрыто администратором!');
    closeModal();
    return;
  }

  const slotKey = `${category}-${slotIndex}`;

  if (!players[activePlayer].picks[stageId]) {
    players[activePlayer].picks[stageId] = {};
  }

  const existingPicks = players[activePlayer].picks[stageId];
  
  // Для категории champion разрешаем только один выбор
  if (category === 'champion') {
    // Удаляем предыдущий выбор champion, если был
    Object.keys(existingPicks).forEach(key => {
      if (key.startsWith('champion-')) {
        delete existingPicks[key];
        // Удаляем из API тоже
        deletePickFromAPI(activePlayer, stageId, key).catch(() => {});
      }
    });
  } else {
    // Для остальных категорий проверяем дубликаты
    const categorySlots = Object.keys(existingPicks).filter(key => key.startsWith(category));
    const isAlreadySelected = categorySlots.some(key => existingPicks[key] === teamName);
    
    if (isAlreadySelected && existingPicks[slotKey] !== teamName) {
      alert('⚠️ Эта команда уже выбрана в другом слоте этой категории!');
      closeModal();
      return;
    }
  }

  players[activePlayer].picks[stageId][slotKey] = teamName;
  
  try {
    await savePickToAPI(activePlayer, stageId, slotKey, teamName);
    renderPicks(stageId);
    updateSaveButton(stageId);
    currentSlot = null;
    closeModal();
  } catch (error) {
    alert('❌ Ошибка при сохранении прогноза');
    delete players[activePlayer].picks[stageId][slotKey];
  }
}

// Setup slot clicks using event delegation
let slotClicksSetup = false;
function setupSlotClicks() {
  if (slotClicksSetup) {
    console.log('[APP] Slot clicks already set up, skipping...');
    return; // Already set up
  }
  
  console.log('[APP] Setting up slot clicks...');
  // Use event delegation on the stage content container
  const stageContent = document.getElementById('stage-content');
  if (!stageContent) {
    console.error('[APP] Stage content container not found!');
    return;
  }
  
  console.log('[APP] Stage content found, adding event listener...');
  stageContent.addEventListener('click', function(e) {
    console.log('[APP] Click detected on:', e.target);
    
    // Don't handle clicks on remove buttons
    if (e.target.classList.contains('remove-team')) {
      console.log('[APP] Click on remove button, ignoring...');
      return;
    }
    
    const slot = e.target.closest('.slot');
    if (!slot) {
      console.log('[APP] Click not on a slot');
      return;
    }
    
    console.log('[APP] Slot clicked:', slot);
    
    if (slot.classList.contains('locked')) {
      console.log('[APP] Slot is locked');
      return;
    }
    
    if (!activePlayer) {
      console.log('[APP] No active player');
      alert('⚠️ Сначала выберите игрока!');
      return;
    }

    const stage = slot.closest('.stage');
    if (!stage) {
      console.error('[APP] Stage not found for slot');
      return;
    }
    
    const stageId = stage.id.replace('-content', '');
    const category = slot.dataset.category;
    const slotIndex = slot.dataset.slot;
    
    console.log('[APP] Slot details:', { stageId, category, slotIndex });

    if (!isStageOpen(stageId)) {
      console.log('[APP] Stage is closed:', stageId);
      alert('⚠️ Голосование для этой стадии закрыто администратором!');
      return;
    }

    currentSlot = { stageId, category, slotIndex };
    console.log('[APP] Opening team modal for stage:', stageId);
    openTeamModal(stageId);
  });
  
  slotClicksSetup = true;
  console.log('[APP] Slot clicks setup complete');
}

// Open team modal
async function openTeamModal(stageId) {
  const modal = document.getElementById('team-modal');
  const modalTeams = document.getElementById('modal-teams');
  
  // Для champion показываем все команды Stage 3, для остальных - команды текущей стадии
  let teams;
  if (currentSlot && currentSlot.category === 'champion') {
    teams = await getTeamsForStage('stage3');
  } else {
    teams = await getTeamsForStage(stageId);
  }

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
async function removeTeamFromSlot(stageId, slotKey) {
  console.log('[APP] removeTeamFromSlot called:', stageId, slotKey);
  if (!activePlayer) {
    console.log('[APP] No active player');
    return;
  }
  if (!isStageOpen(stageId)) {
    alert('⚠️ Голосование для этой стадии закрыто администратором!');
    return;
  }

  if (players[activePlayer].picks[stageId]) {
    try {
      await deletePickFromAPI(activePlayer, stageId, slotKey);
      delete players[activePlayer].picks[stageId][slotKey];
      renderPicks(stageId);
      updateSaveButton(stageId);
    } catch (error) {
      console.error('[APP] Error removing team from slot:', error);
      alert('❌ Ошибка при удалении прогноза');
    }
  }
}

// Export immediately
window.removeTeamFromSlot = removeTeamFromSlot;
console.log('[APP] removeTeamFromSlot exported to window');

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
  const isClosed = !isStageOpen(stageId);
  btn.disabled = !hasPicks || isClosed;
}

// Save picks
async function savePicks(stageId) {
  if (!activePlayer) {
    alert('⚠️ Сначала выберите игрока!');
    return;
  }

  if (!isStageOpen(stageId)) {
    alert('⚠️ Голосование для этой стадии закрыто администратором!');
    return;
  }

  // Сохраняем все пики для текущего игрока в базу данных
  const picks = players[activePlayer].picks[stageId] || {};
  try {
    for (const [slotKey, teamName] of Object.entries(picks)) {
      if (teamName) {
        await savePickToAPI(activePlayer, stageId, slotKey, teamName);
      }
    }
    alert('✅ Прогнозы сохранены!');
  } catch (error) {
    alert('❌ Ошибка при сохранении прогнозов');
    console.error('Error saving picks:', error);
  }
}

// Update scores based on admin results
async function updateScores() {
  console.log('Updating scores...');
  
  // Update cache first to ensure we have latest results
  await updateResultsCache();
  console.log('Current cache:', stageResultsCache);
  
  // Reset all scores to base
  Object.keys(players).forEach(playerKey => {
    players[playerKey].score = 10000;
    // Initialize results structure
    if (!players[playerKey].results) {
      players[playerKey].results = {};
    }
  });
  console.log('All scores reset to 10000');

  ['stage1', 'stage2', 'stage3'].forEach(stageId => {
    const results = stageResultsCache[stageId];
    if (!results) {
      console.log(`No results for ${stageId}, skipping...`);
      return;
    }
    console.log(`Processing results for ${stageId}:`, results);

    Object.keys(players).forEach(playerKey => {
      const picks = players[playerKey].picks[stageId] || {};
      let correct = 0;
      let wrong = 0;
      const correctTeams = [];
      const wrongTeams = [];

      // Check 3:0 ADVANCED
      const correct30 = results['30'] || [];
      const picks30 = [];
      for (let i = 0; i < 2; i++) {
        const pick = picks[`30-${i}`];
        if (pick) picks30.push(pick);
      }
      correct30.forEach(team => {
        if (picks30.includes(team)) {
          correct++;
          correctTeams.push(team);
        }
      });
      picks30.forEach(team => {
        if (!correct30.includes(team)) {
          wrong++;
          wrongTeams.push(team);
        }
      });

      // Check 0:3 ELIMINATED
      const correct03 = results['03'] || [];
      const picks03 = [];
      for (let i = 0; i < 2; i++) {
        const pick = picks[`03-${i}`];
        if (pick) picks03.push(pick);
      }
      correct03.forEach(team => {
        if (picks03.includes(team)) {
          correct++;
          correctTeams.push(team);
        }
      });
      picks03.forEach(team => {
        if (!correct03.includes(team)) {
          wrong++;
          wrongTeams.push(team);
        }
      });

      // Check 3:1 OR 3:2 ADVANCED
      const correct31_32 = results['31-32'] || [];
      const picks31_32 = [];
      for (let i = 0; i < 6; i++) {
        const pick = picks[`31-32-${i}`];
        if (pick) picks31_32.push(pick);
      }
      correct31_32.forEach(team => {
        if (picks31_32.includes(team)) {
          correct++;
          correctTeams.push(team);
        }
      });
      picks31_32.forEach(team => {
        if (!correct31_32.includes(team)) {
          wrong++;
          wrongTeams.push(team);
        }
      });

      // Store results for this stage
      players[playerKey].results[stageId] = {
        correct: correctTeams,
        wrong: wrongTeams
      };

      const points = (correct * 1000) - (wrong * 500);
      players[playerKey].score += points;
      
      console.log(`${playerKey}: +${correct} correct, -${wrong} wrong, points: ${points}, total: ${players[playerKey].score}`);
    });
  });

  // Check champion pick (separate from stages)
  const championResult = await getChampionResult();
  if (championResult) {
    Object.keys(players).forEach(playerKey => {
      const championPick = players[playerKey].championPick;
      if (!players[playerKey].results.champion) {
        players[playerKey].results.champion = { correct: [], wrong: [] };
      }
      if (championPick && championPick === championResult) {
        players[playerKey].score += 3000;
        players[playerKey].results.champion.correct = [championPick];
        players[playerKey].results.champion.wrong = [];
        console.log(`${playerKey}: Champion correct! +3000 points, total: ${players[playerKey].score}`);
      } else if (championPick) {
        players[playerKey].results.champion.correct = [];
        players[playerKey].results.champion.wrong = [championPick];
      } else {
        players[playerKey].results.champion.correct = [];
        players[playerKey].results.champion.wrong = [];
      }
    });
  }

  // Save updated scores to API
  for (const playerKey of Object.keys(players)) {
    try {
      await savePlayerToAPI(playerKey);
    } catch (error) {
      console.error(`Error saving score for ${playerKey}:`, error);
    }
  }
  
  renderPlayers();
  console.log('Scores updated and saved');
}

// Setup modal close
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[APP] DOMContentLoaded event fired');
  
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  } else {
    console.warn('[APP] Close modal button not found');
  }
  
  const teamModal = document.getElementById('team-modal');
  if (teamModal) {
    teamModal.addEventListener('click', (e) => {
      if (e.target.id === 'team-modal') closeModal();
    });
  } else {
    console.warn('[APP] Team modal not found');
  }

  const saveStage1 = document.getElementById('save-stage1');
  const saveStage2 = document.getElementById('save-stage2');
  const saveStage3 = document.getElementById('save-stage3');
  
  if (saveStage1) {
    saveStage1.addEventListener('click', () => savePicks('stage1'));
  }
  if (saveStage2) {
    saveStage2.addEventListener('click', () => savePicks('stage2'));
  }
  if (saveStage3) {
    saveStage3.addEventListener('click', () => savePicks('stage3'));
  }

  console.log('[APP] Calling init()...');
  try {
    await init();
    console.log('[APP] init() completed successfully');
  } catch (error) {
    console.error('[APP] Error in init():', error);
  }
});

// Setup champion selection
function setupChampionSelection() {
  const championSlot = document.getElementById('champion-slot');
  if (!championSlot) return;
  
  championSlot.addEventListener('click', async function() {
    if (!activePlayer) {
      alert('⚠️ Сначала выберите игрока!');
      return;
    }
    
    if (!isChampionOpen()) {
      alert('⚠️ Голосование за победителя закрыто администратором!');
      return;
    }
    
    // Open modal with all teams
    const modal = document.getElementById('team-modal');
    const modalTeams = document.getElementById('modal-teams');
    const teams = await getAllTeams();
    
    modalTeams.innerHTML = '';
    teams.forEach(team => {
      const teamEl = document.createElement('div');
      teamEl.className = 'modal-team';
      teamEl.innerHTML = `
        <img src="${team.logo}" alt="${team.name}" 
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'60\\'%3E%3Crect fill=\\'%23333\\' width=\\'60\\' height=\\'60\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'10\\'%3E${team.name.substring(0, 3)}%3C/text%3E%3C/svg%3E'">
        <div class="team-name">${team.name}</div>
      `;
      teamEl.addEventListener('click', () => selectChampion(team.name));
      modalTeams.appendChild(teamEl);
    });
    
    modal.classList.add('active');
  });
}

// Select champion
async function selectChampion(teamName) {
  if (!activePlayer) {
    alert('⚠️ Сначала выберите игрока!');
    closeModal();
    return;
  }
  
  try {
    // Save champion pick to API (using a special stageId 'champion')
    await savePickToAPI(activePlayer, 'champion', 'champion-0', teamName);
    players[activePlayer].championPick = teamName;
    renderChampionPick();
    closeModal();
  } catch (error) {
    alert('❌ Ошибка при сохранении выбора победителя');
    console.error(error);
  }
}

// Render champion pick
function renderChampionPick() {
  const championSlot = document.getElementById('champion-slot');
  if (!championSlot) return;
  
  if (!activePlayer) {
    championSlot.innerHTML = '<div class="slot-placeholder">Выберите игрока</div>';
    championSlot.classList.remove('filled', 'locked');
    return;
  }
  
  const isClosed = !isChampionOpen();
  const championPick = players[activePlayer].championPick;
  
  if (isClosed) {
    championSlot.classList.add('locked');
    championSlot.classList.remove('filled');
  } else {
    championSlot.classList.remove('locked');
  }
  
  if (championPick) {
    championSlot.classList.add('filled');
    if (isClosed) {
      championSlot.innerHTML = `
        <div class="team-name">${championPick}</div>
      `;
    } else {
      championSlot.innerHTML = `
        <div class="team-name">${championPick}</div>
        <button class="remove-team" onclick="removeChampion()">×</button>
      `;
    }
  } else {
    championSlot.classList.remove('filled');
    if (isClosed) {
      championSlot.innerHTML = '<div class="slot-placeholder">Голосование закрыто</div>';
    } else {
      championSlot.innerHTML = '<div class="slot-placeholder">Выберите победителя</div>';
    }
  }
}

// Remove champion pick
async function removeChampion() {
  console.log('[APP] removeChampion called');
  if (!activePlayer) {
    console.log('[APP] No active player');
    return;
  }
  
  try {
    await deletePickFromAPI(activePlayer, 'champion', 'champion-0');
    delete players[activePlayer].championPick;
    renderChampionPick();
  } catch (error) {
    console.error('[APP] Error removing champion:', error);
    alert('❌ Ошибка при удалении выбора победителя');
  }
}

// Export immediately
window.removeChampion = removeChampion;
console.log('[APP] removeChampion exported to window');

// Listen for admin results saved event - сохраняем все пики пользователей
window.addEventListener('adminResultsSaved', async (e) => {
  const { stageId } = e.detail;
  console.log('Admin results saved event:', stageId);
  
  // Сохраняем все пики всех пользователей для завершенной стадии
  try {
    for (const playerKey of Object.keys(players)) {
      const picks = players[playerKey].picks[stageId] || {};
      for (const [slotKey, teamName] of Object.entries(picks)) {
        if (teamName) {
          try {
            await savePickToAPI(playerKey, stageId, slotKey, teamName);
          } catch (error) {
            console.error(`Error saving pick for ${playerKey}:`, error);
          }
        }
      }
    }
    console.log(`All picks for ${stageId} saved to database`);
  } catch (error) {
    console.error('Error saving picks after admin results saved:', error);
  }
});

// Listen for admin results deleted event
window.addEventListener('adminResultsDeleted', async (e) => {
  const { stageId } = e.detail;
  console.log('Admin results deleted event:', stageId);
  
  try {
    // Clear cache for deleted stage immediately
    delete stageResultsCache[stageId];
    console.log(`Cache cleared for ${stageId}`);
    
    // Update results cache (will reload all stages and clear empty ones)
    await updateResultsCache();
    console.log('Results cache updated');
    
    // Update scores (will recalculate based on remaining results only)
    // This will reset all scores to 10000 and recalculate based on remaining results
    await updateScores();
    console.log('Scores updated and saved to database');
    
    // Update teams for next stages if needed
    if (stageId === 'stage1' && currentStage === 'stage2') {
      await renderStage('stage2');
    } else if (stageId === 'stage2' && currentStage === 'stage3') {
      await renderStage('stage3');
    }
    
    // Update current stage if it's the deleted one
    if (currentStage === stageId) {
      await renderStage(stageId);
    }
  } catch (error) {
    console.error('Error handling adminResultsDeleted event:', error);
  }
});

// Listen for champion saved/deleted events
window.addEventListener('championSaved', async () => {
  console.log('Champion saved event');
  championResultCache = null; // Clear cache
  await getChampionResult(); // Reload
  await updateScores(); // Recalculate scores
});

window.addEventListener('championDeleted', async () => {
  console.log('Champion deleted event');
  championResultCache = null; // Clear cache
  await updateScores(); // Recalculate scores
});

// Auto-update scores and stage statuses
setInterval(async () => {
  await updateStageStatusCache();
  await updateChampionStatusCache();
  await updateScores();
}, 10000); // Check every 10 seconds

