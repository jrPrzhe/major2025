// Admin password (можно изменить)
const ADMIN_PASSWORD = 'admin123';

// Team data (same as in app.js)
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

// Check admin password
function checkAdminPassword() {
  const password = document.getElementById('admin-password').value;
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_logged_in', 'true');
    document.getElementById('password-section').style.display = 'none';
    document.getElementById('admin-content').classList.add('active');
    showAdminStage('stage1');
  } else {
    alert('❌ Неверный пароль!');
    document.getElementById('admin-password').value = '';
  }
}

// Show admin stage
function showAdminStage(stageId) {
  // Update tabs
  document.querySelectorAll('.stage-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`.stage-tab[data-stage="${stageId}"]`).classList.add('active');

  // Update content
  document.querySelectorAll('.admin-stage').forEach(stage => {
    stage.classList.remove('active');
  });
  document.getElementById(`admin-${stageId}`).classList.add('active');

  // Render results
  renderAdminResults(stageId);
}

// Render admin results
function renderAdminResults(stageId) {
  const teams = getTeamsForAdminStage(stageId);
  const savedResults = getSavedResults(stageId);

  // Render 3:0 ADVANCED
  renderResultCategory(`admin-results-30-${stageId}`, teams, savedResults ? savedResults['30'] : [], 2);

  // Render 0:3 ELIMINATED
  renderResultCategory(`admin-results-03-${stageId}`, teams, savedResults ? savedResults['03'] : [], 2);

  // Render 3:1 OR 3:2 ADVANCED
  renderResultCategory(`admin-results-31-32-${stageId}`, teams, savedResults ? savedResults['31-32'] : [], 5);
}

// Get teams for admin stage
function getTeamsForAdminStage(stageId) {
  if (stageId === 'stage1') {
    return TEAMS_STAGE1;
  } else if (stageId === 'stage2') {
    // Stage 2: прошедшие из Stage 1 + известные команды Stage 2
    const stage1Results = getSavedResults('stage1');
    const advancedFromStage1 = stage1Results ? [
      ...(stage1Results['30'] || []),
      ...(stage1Results['31-32'] || [])
    ] : [];
    return [...advancedFromStage1, ...TEAMS_STAGE2];
  } else if (stageId === 'stage3') {
    // Stage 3: прошедшие из Stage 2 + известные команды Stage 3
    const stage2Results = getSavedResults('stage2');
    const advancedFromStage2 = stage2Results ? [
      ...(stage2Results['30'] || []),
      ...(stage2Results['31-32'] || [])
    ] : [];
    return [...advancedFromStage2, ...TEAMS_STAGE3];
  }
  return [];
}

// Get saved results
function getSavedResults(stageId) {
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

// Render result category
function renderResultCategory(containerId, teams, savedValues, count) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const slot = document.createElement('div');
    slot.className = 'result-slot';
    
    const select = document.createElement('select');
    select.dataset.index = i;
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Выберите команду --';
    select.appendChild(emptyOption);

    // Add team options
    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team.name;
      option.textContent = team.name;
      if (savedValues && savedValues[i] === team.name) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    slot.appendChild(select);
    container.appendChild(slot);
  }
}

// Save admin results
function saveAdminResults(stageId) {
  const results = {
    '30': [],
    '03': [],
    '31-32': []
  };

  // Get 3:0 ADVANCED
  const selects30 = document.querySelectorAll(`#admin-results-30-${stageId} select`);
  selects30.forEach(select => {
    if (select.value) {
      results['30'].push(select.value);
    }
  });

  // Get 0:3 ELIMINATED
  const selects03 = document.querySelectorAll(`#admin-results-03-${stageId} select`);
  selects03.forEach(select => {
    if (select.value) {
      results['03'].push(select.value);
    }
  });

  // Get 3:1 OR 3:2 ADVANCED
  const selects31_32 = document.querySelectorAll(`#admin-results-31-32-${stageId} select`);
  selects31_32.forEach(select => {
    if (select.value) {
      results['31-32'].push(select.value);
    }
  });

  // Validate
  if (results['30'].length !== 2) {
    alert('❌ Необходимо выбрать 2 команды для категории 3:0 - ADVANCED');
    return;
  }
  if (results['03'].length !== 2) {
    alert('❌ Необходимо выбрать 2 команды для категории 0:3 - ELIMINATED');
    return;
  }
  if (results['31-32'].length !== 5) {
    alert('❌ Необходимо выбрать 5 команд для категории 3:1 OR 3:2 ADVANCED');
    return;
  }

  // Check for duplicates
  const allTeams = [...results['30'], ...results['03'], ...results['31-32']];
  const uniqueTeams = [...new Set(allTeams)];
  if (allTeams.length !== uniqueTeams.length) {
    alert('❌ Одна команда не может быть в нескольких категориях одновременно!');
    return;
  }

  // Save to localStorage
  localStorage.setItem(`admin_results_${stageId}`, JSON.stringify(results));
  
  // Also update JSON file (need to load current data first, then update)
  updateJSONFileWithAdminResults(stageId, results);
  
  // Trigger custom event for score update
  const event = new Event('adminResultsSaved');
  event.stageId = stageId;
  window.dispatchEvent(event);
  
  // Also trigger storage event (works across tabs/windows)
  const storageEvent = new StorageEvent('storage', {
    key: `admin_results_${stageId}`,
    newValue: JSON.stringify(results),
    oldValue: localStorage.getItem(`admin_results_${stageId}`)
  });
  window.dispatchEvent(storageEvent);
  
  alert('✅ Результаты сохранены! Очки участников будут пересчитаны автоматически.');
  
  // Force update if main page is open in another tab/window
  if (window.opener && typeof window.opener.updateScores === 'function') {
    window.opener.updateScores();
  }
}

// Update JSON file with admin results
async function updateJSONFileWithAdminResults(stageId, results) {
  // Try to use File System Access API if available
  if (window.showSaveFilePicker) {
    try {
      // Try to get file handle from main window
      if (window.opener && window.opener.jsonFileHandle) {
        const data = await fetch('data.json').then(r => r.json()).catch(() => ({ players: {}, adminResults: {} }));
        if (!data.adminResults) data.adminResults = {};
        data.adminResults[stageId] = results;
        
        const writable = await window.opener.jsonFileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        console.log('JSON file updated with admin results via File System Access API');
        return;
      }
    } catch (e) {
      console.error('Error writing to file:', e);
    }
  }
  
  // Fallback: data is already in localStorage, JSON can be exported manually
  console.log('Admin results saved to localStorage. Use export to update JSON file.');
}

// Update scores from results
function updateScoresFromResults() {
  // This will be called from main page, but we can also trigger it here
  if (window.opener) {
    window.opener.updateScores();
  }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  const isLoggedIn = sessionStorage.getItem('admin_logged_in');
  if (isLoggedIn === 'true') {
    document.getElementById('password-section').style.display = 'none';
    document.getElementById('admin-content').classList.add('active');
    showAdminStage('stage1');
  }

  // Enter key for password
  const passwordInput = document.getElementById('admin-password');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        checkAdminPassword();
      }
    });
  }
});

