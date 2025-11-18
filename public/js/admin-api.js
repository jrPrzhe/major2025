// Admin password
const ADMIN_PASSWORD = 'admin123';

console.log('[ADMIN] Script started loading...');

// Verify api object is available
// api.js should be loaded before this script
// If api is not available, we'll use window.api or create a reference
console.log('[ADMIN] Checking for api object...');
console.log('[ADMIN] typeof api:', typeof api);
console.log('[ADMIN] typeof window.api:', typeof window.api);

// Ensure we have access to api (either from api.js or window.api)
// Don't create const api here - use the global one from api.js
if (typeof api === 'undefined' && typeof window.api === 'undefined') {
  console.error('[ADMIN] ERROR: api object is not defined! Make sure js/api.js is loaded before admin-api.js');
  console.error('[ADMIN] Script execution will continue, but API calls will fail.');
} else {
  console.log('[ADMIN] ✓ api object is available');
}

// Immediately export function placeholders to prevent "not defined" errors
// These will be overwritten when functions are actually defined
window.checkAdminPassword = function() {
  console.error('[ADMIN] checkAdminPassword called but not yet defined!');
  alert('Ошибка: функция checkAdminPassword еще не загружена. Обновите страницу.');
};
window.showAdminStage = function() {
  console.error('[ADMIN] showAdminStage called but not yet defined!');
};
window.saveAdminResults = function() {
  console.error('[ADMIN] saveAdminResults called but not yet defined!');
};
window.resetAdminResults = function() {
  console.error('[ADMIN] resetAdminResults called but not yet defined!');
};
window.toggleStageStatus = function() {
  console.error('[ADMIN] toggleStageStatus called but not yet defined!');
};
window.toggleChampionStatus = function() {
  console.error('[ADMIN] toggleChampionStatus called but not yet defined!');
};
// Note: saveChampion and resetChampion are defined later in the file
// They don't need placeholders as they're only called after admin login
console.log('[ADMIN] Function placeholders exported to window');

// Team data (same as in app-api.js)
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

// Check admin password - define directly on window to avoid placeholder issues
window.checkAdminPassword = function() {
  console.log('[ADMIN] checkAdminPassword called');
  try {
    const passwordInput = document.getElementById('admin-password');
    if (!passwordInput) {
      console.error('[ADMIN] Password input not found!');
      alert('❌ Ошибка: поле ввода пароля не найдено!');
      return;
    }
    
    const password = passwordInput.value;
    console.log('[ADMIN] Password entered:', password ? '***' : '(empty)');
    
    if (password === ADMIN_PASSWORD) {
      console.log('[ADMIN] Password correct, logging in...');
      sessionStorage.setItem('admin_logged_in', 'true');
      const passwordSection = document.getElementById('password-section');
      const adminContent = document.getElementById('admin-content');
      if (passwordSection) passwordSection.style.display = 'none';
      if (adminContent) adminContent.classList.add('active');
      // Use window.showAdminStage to ensure we use the exported version
      if (typeof window.showAdminStage === 'function') {
        window.showAdminStage('stage1');
      } else {
        console.error('[ADMIN] showAdminStage is not a function! Type:', typeof window.showAdminStage);
        alert('❌ Ошибка: функция showAdminStage не найдена!');
      }
    } else {
      console.log('[ADMIN] Password incorrect');
      alert('❌ Неверный пароль!');
      passwordInput.value = '';
    }
  } catch (error) {
    console.error('[ADMIN] Error in checkAdminPassword:', error);
    alert('❌ Ошибка при проверке пароля: ' + error.message);
  }
};
console.log('[ADMIN] checkAdminPassword exported to window');

// Show admin stage - define directly on window
window.showAdminStage = async function(stageId) {
  console.log('[ADMIN] showAdminStage called with:', stageId);
  document.querySelectorAll('.stage-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  const activeTab = document.querySelector(`.stage-tab[data-stage="${stageId}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  } else {
    console.error('[ADMIN] Tab not found for stage:', stageId);
  }

  document.querySelectorAll('.admin-stage').forEach(stage => {
    stage.classList.remove('active');
  });
  
  if (stageId === 'champion') {
    const championSection = document.getElementById('admin-champion-section');
    if (championSection) {
      championSection.classList.add('active');
      await renderChampionSelector();
      await loadChampionStatus();
    } else {
      console.error('[ADMIN] Champion section not found!');
    }
  } else {
    const stageElement = document.getElementById(`admin-${stageId}`);
    if (stageElement) {
      stageElement.classList.add('active');
      await renderAdminResults(stageId);
      await loadStageStatus(stageId);
    } else {
      console.error('[ADMIN] Stage element not found:', `admin-${stageId}`);
    }
  }
};
console.log('[ADMIN] showAdminStage exported to window');

// Load champion status
async function loadChampionStatus() {
  try {
    const status = await api.getChampionStatus();
    const isOpen = status ? status.is_open === 1 : true; // Default to open if not set
    const checkbox = document.getElementById('toggle-champion');
    if (checkbox) {
      checkbox.checked = isOpen;
    }
  } catch (error) {
    console.error('Error loading champion status:', error);
  }
}

// Toggle champion status - define directly on window
window.toggleChampionStatus = async function(isOpen) {
  console.log('[ADMIN] toggleChampionStatus called:', isOpen);
  try {
    await api.updateChampionStatus(isOpen);
    console.log('[ADMIN] Champion status updated successfully');
    alert(isOpen ? '✅ Голосование за победителя открыто!' : '🔒 Голосование за победителя закрыто!');
  } catch (error) {
    console.error('[ADMIN] Error updating champion status:', error);
    alert('❌ Ошибка при обновлении статуса голосования победителя: ' + error.message);
    // Revert checkbox
    const checkbox = document.getElementById('toggle-champion');
    if (checkbox) {
      checkbox.checked = !isOpen;
    }
  }
};
console.log('[ADMIN] toggleChampionStatus exported to window');

// Save champion - define directly on window (moved here to ensure early definition)
window.saveChampion = async function() {
  console.log('[ADMIN] saveChampion called');
  const select = document.getElementById('champion-select');
  if (!select) {
    console.error('[ADMIN] Champion select not found!');
    alert('❌ Ошибка: элемент выбора победителя не найден!');
    return;
  }
  if (!select.value) {
    alert('❌ Выберите победителя!');
    return;
  }
  
  try {
    console.log('[ADMIN] Saving champion:', select.value);
    await api.saveChampionResult(select.value);
    console.log('[ADMIN] Champion saved successfully');
    alert('✅ Победитель сохранен! Очки участников будут пересчитаны автоматически.');
    // Отправляем событие для обновления очков
    window.dispatchEvent(new CustomEvent('championSaved'));
  } catch (error) {
    console.error('[ADMIN] Error saving champion:', error);
    alert('❌ Ошибка при сохранении победителя: ' + error.message);
  }
};
// Verify the function was assigned correctly
if (typeof window.saveChampion === 'function' && !window.saveChampion.toString().includes('not yet defined')) {
  console.log('[ADMIN] ✓ saveChampion exported to window successfully');
} else {
  console.error('[ADMIN] ERROR: saveChampion was not exported correctly!');
}

// Reset champion - define directly on window (moved here to ensure early definition)
window.resetChampion = async function() {
  console.log('[ADMIN] resetChampion called');
  if (!confirm('⚠️ Вы уверены, что хотите сбросить победителя?\n\nЭто действие удалит сохраненного победителя и пересчитает очки участников.')) {
    return;
  }
  
  try {
    console.log('[ADMIN] Deleting champion...');
    await api.deleteChampionResult();
    console.log('[ADMIN] Champion deleted successfully');
    alert('✅ Победитель сброшен! Очки участников будут пересчитаны автоматически.');
    // renderChampionSelector will be defined later, but we can call it via window if needed
    if (typeof renderChampionSelector === 'function') {
      await renderChampionSelector();
    }
    // Отправляем событие для обновления очков
    window.dispatchEvent(new CustomEvent('championDeleted'));
  } catch (error) {
    console.error('[ADMIN] Error resetting champion:', error);
    alert('❌ Ошибка при сбросе победителя: ' + error.message);
  }
};
// Verify the function was assigned correctly
if (typeof window.resetChampion === 'function' && !window.resetChampion.toString().includes('not yet defined')) {
  console.log('[ADMIN] ✓ resetChampion exported to window successfully');
} else {
  console.error('[ADMIN] ERROR: resetChampion was not exported correctly!');
}

// Load stage status
async function loadStageStatus(stageId) {
  try {
    const status = await api.getStageStatus(stageId);
    const checkbox = document.getElementById(`toggle-${stageId}`);
    if (checkbox) {
      checkbox.checked = status.is_open === 1;
    }
  } catch (error) {
    console.error('Error loading stage status:', error);
  }
}

// Toggle stage status - define directly on window
window.toggleStageStatus = async function(stageId, isOpen) {
  console.log('[ADMIN] toggleStageStatus called:', stageId, isOpen);
  try {
    await api.updateStageStatus(stageId, isOpen);
    console.log('[ADMIN] Stage status updated successfully');
    alert(isOpen ? '✅ Голосование для стадии открыто!' : '🔒 Голосование для стадии закрыто!');
  } catch (error) {
    console.error('[ADMIN] Error updating stage status:', error);
    alert('❌ Ошибка при обновлении статуса стадии: ' + error.message);
    // Revert checkbox
    const checkbox = document.getElementById(`toggle-${stageId}`);
    if (checkbox) {
      checkbox.checked = !isOpen;
    }
  }
};
console.log('[ADMIN] toggleStageStatus exported to window');

// Render admin results
async function renderAdminResults(stageId) {
  const teams = await getTeamsForAdminStage(stageId);
  const savedResults = await api.getAdminResults(stageId);

  renderResultCategory(`admin-results-30-${stageId}`, teams, savedResults ? savedResults['30'] : [], 2);
  renderResultCategory(`admin-results-03-${stageId}`, teams, savedResults ? savedResults['03'] : [], 2);
  renderResultCategory(`admin-results-31-32-${stageId}`, teams, savedResults ? savedResults['31-32'] : [], 6);
}

// Get teams for admin stage
async function getTeamsForAdminStage(stageId) {
  if (stageId === 'stage1') {
    return TEAMS_STAGE1;
  } else if (stageId === 'stage2') {
    // Stage 2: прошедшие из Stage 1 (3:0, 3:1, 3:2) + все известные команды Stage 2 (8 команд) + QUALIFIER
    const stage1Results = await api.getAdminResults('stage1');
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
    
    // Формируем список: прошедшие из Stage 1 + все известные команды
    // Прошедшие из Stage 1 (8 команд: 2 из 3:0 + 6 из 3:1/3:2) + все известные (8) = 16 команд
    if (advancedFromStage1.length > 0) {
      // Прошедшие из Stage 1 (8) + все известные команды (8) = 16 команд (без QUALIFIER)
      return [...advancedFromStage1, ...knownTeams];
    }
    // Если результатов Stage 1 еще нет, показываем все известные команды + 8 QUALIFIER
    return TEAMS_STAGE2; // 8 известных + 8 QUALIFIER (до получения результатов Stage 1)
  } else if (stageId === 'stage3') {
    const stage2Results = await api.getAdminResults('stage2');
    const advancedTeamNames = stage2Results ? [
      ...(stage2Results['30'] || []),
      ...(stage2Results['31-32'] || [])
    ] : [];
    
    // Получаем команды Stage 2 для поиска логотипов
    const stage2Teams = await getTeamsForAdminStage('stage2');
    
    // Преобразуем названия команд в объекты команд
    const advancedFromStage2 = advancedTeamNames.map(teamName => {
      const team = stage2Teams.find(t => t.name === teamName);
      return team || { name: teamName, logo: "placeholder.png" };
    });
    
    return [...advancedFromStage2, ...TEAMS_STAGE3];
  }
  return [];
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
    
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Выберите команду --';
    select.appendChild(emptyOption);

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

// Save admin results - define directly on window
window.saveAdminResults = async function(stageId) {
  console.log('[ADMIN] saveAdminResults called for:', stageId);
  const results = {
    '30': [],
    '03': [],
    '31-32': []
  };

  const selects30 = document.querySelectorAll(`#admin-results-30-${stageId} select`);
  console.log('[ADMIN] Found', selects30.length, 'selects for 30');
  selects30.forEach(select => {
    if (select.value) {
      results['30'].push(select.value);
    }
  });

  const selects03 = document.querySelectorAll(`#admin-results-03-${stageId} select`);
  console.log('[ADMIN] Found', selects03.length, 'selects for 03');
  selects03.forEach(select => {
    if (select.value) {
      results['03'].push(select.value);
    }
  });

  const selects31_32 = document.querySelectorAll(`#admin-results-31-32-${stageId} select`);
  console.log('[ADMIN] Found', selects31_32.length, 'selects for 31-32');
  selects31_32.forEach(select => {
    if (select.value) {
      results['31-32'].push(select.value);
    }
  });

  console.log('[ADMIN] Results collected:', results);

  if (results['30'].length !== 2) {
    alert('❌ Необходимо выбрать 2 команды для категории 3:0 - ADVANCED');
    return;
  }
  if (results['03'].length !== 2) {
    alert('❌ Необходимо выбрать 2 команды для категории 0:3 - ELIMINATED');
    return;
  }
  if (results['31-32'].length !== 6) {
    alert('❌ Необходимо выбрать 6 команд для категории 3:1 OR 3:2 ADVANCED');
    return;
  }

  const allTeams = [...results['30'], ...results['03'], ...results['31-32']];
  const uniqueTeams = [...new Set(allTeams)];
  if (allTeams.length !== uniqueTeams.length) {
    alert('❌ Одна команда не может быть в нескольких категориях одновременно!');
    return;
  }

  try {
    console.log('[ADMIN] Saving results to API...');
    await api.saveAdminResults(stageId, results);
    console.log('[ADMIN] Results saved successfully');
    
    // Отправляем событие для сохранения всех пиков пользователей на главной странице
    window.dispatchEvent(new CustomEvent('adminResultsSaved', { detail: { stageId } }));
    
    alert('✅ Результаты сохранены! Очки участников будут пересчитаны автоматически.');
    
    // Если сохраняем результаты Stage 1, обновляем команды в Stage 2
    if (stageId === 'stage1') {
      // Обновляем список команд для Stage 2, если он открыт
      const stage2Tab = document.querySelector('.stage-tab[data-stage="stage2"]');
      if (stage2Tab && document.getElementById('admin-stage2').classList.contains('active')) {
        await renderAdminResults('stage2');
      }
    }
    // Если сохраняем результаты Stage 2, обновляем команды в Stage 3
    else if (stageId === 'stage2') {
      const stage3Tab = document.querySelector('.stage-tab[data-stage="stage3"]');
      if (stage3Tab && document.getElementById('admin-stage3').classList.contains('active')) {
        await renderAdminResults('stage3');
      }
    }
  } catch (error) {
    console.error('[ADMIN] Error saving results:', error);
    alert('❌ Ошибка при сохранении результатов: ' + error.message);
  }
};
console.log('[ADMIN] saveAdminResults exported to window');

// Reset admin results for a stage - define directly on window
window.resetAdminResults = async function(stageId) {
  console.log('[ADMIN] resetAdminResults called for:', stageId);
  if (!confirm(`⚠️ Вы уверены, что хотите сбросить результаты для ${stageId.toUpperCase()}?\n\nЭто действие удалит все сохраненные результаты и пересчитает очки участников.`)) {
    return;
  }

  try {
    console.log(`[ADMIN] Deleting results for ${stageId}...`);
    await api.deleteAdminResults(stageId);
    console.log(`[ADMIN] Results deleted for ${stageId}`);
    
    // Обновляем отображение результатов (очищаем селекты)
    await renderAdminResults(stageId);
    
    // Отправляем событие для обновления очков на главной странице
    // Это должно обновить кэш, пересчитать очки и сохранить их в БД
    window.dispatchEvent(new CustomEvent('adminResultsDeleted', { detail: { stageId } }));
    
    // Небольшая задержка для завершения обновления очков
    await new Promise(resolve => setTimeout(resolve, 500));
    
    alert('✅ Результаты успешно сброшены! Очки участников пересчитаны и сохранены.');
    
    // Если сбрасываем результаты Stage 1, обновляем команды в Stage 2
    if (stageId === 'stage1') {
      // Обновляем список команд для Stage 2, если он открыт
      const stage2Tab = document.querySelector('.stage-tab[data-stage="stage2"]');
      if (stage2Tab && document.getElementById('admin-stage2').classList.contains('active')) {
        await renderAdminResults('stage2');
      }
    }
    // Если сбрасываем результаты Stage 2, обновляем команды в Stage 3
    else if (stageId === 'stage2') {
      const stage3Tab = document.querySelector('.stage-tab[data-stage="stage3"]');
      if (stage3Tab && document.getElementById('admin-stage3').classList.contains('active')) {
        await renderAdminResults('stage3');
      }
    }
  } catch (error) {
    console.error('[ADMIN] Error resetting results:', error);
    alert('❌ Ошибка при сбросе результатов: ' + error.message);
  }
};
console.log('[ADMIN] resetAdminResults exported to window');

// Get all teams for champion selection (from all stages)
async function getAllTeamsForChampion() {
  const allTeams = [];
  const teamNames = new Set();
  
  // Add teams from Stage 1
  TEAMS_STAGE1.forEach(team => {
    if (!teamNames.has(team.name)) {
      allTeams.push(team);
      teamNames.add(team.name);
    }
  });
  
  // Add known teams from Stage 2 (no QUALIFIER)
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
  const stage1Results = await api.getAdminResults('stage1');
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
  const stage2Results = await api.getAdminResults('stage2');
  if (stage2Results) {
    const advancedFromStage2 = [
      ...(stage2Results['30'] || []),
      ...(stage2Results['31-32'] || [])
    ];
    
    // Get Stage 2 teams once before the loop
    const stage2Teams = await getTeamsForAdminStage('stage2');
    
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

// Render champion selector
async function renderChampionSelector() {
  const container = document.getElementById('admin-champion');
  if (!container) return;
  
  // Get all teams from all stages
  const allTeams = await getAllTeamsForChampion();
  const savedChampion = await api.getChampionResult();
  
  container.innerHTML = '';
  const select = document.createElement('select');
  select.id = 'champion-select';
  select.style.width = '100%';
  select.style.padding = '10px';
  select.style.background = '#0f0c14';
  select.style.color = 'white';
  select.style.border = '1px solid #4ecdc4';
  select.style.borderRadius = '5px';
  select.style.fontSize = '1rem';
  
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '-- Выберите победителя --';
  select.appendChild(emptyOption);
  
  allTeams.forEach(team => {
    const option = document.createElement('option');
    option.value = team.name;
    option.textContent = team.name;
    if (savedChampion === team.name) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  
  container.appendChild(select);
}

// Note: saveChampion and resetChampion are now defined earlier in the file (after toggleChampionStatus)

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[ADMIN] DOMContentLoaded - initializing admin panel');
  console.log('[ADMIN] Current window.checkAdminPassword:', typeof window.checkAdminPassword);
  console.log('[ADMIN] Current window.checkAdminPassword source:', window.checkAdminPassword.toString().substring(0, 100));
  
  // Verify all functions are exported
  const requiredFunctions = [
    'checkAdminPassword',
    'showAdminStage',
    'saveAdminResults',
    'resetAdminResults',
    'toggleStageStatus',
    'toggleChampionStatus',
    'saveChampion',
    'resetChampion'
  ];
  
  console.log('[ADMIN] Checking required functions...');
  requiredFunctions.forEach(fn => {
    const type = typeof window[fn];
    const isPlaceholder = type === 'function' && window[fn].toString().includes('not yet defined');
    console.log(`[ADMIN] ${fn}: ${type}${isPlaceholder ? ' (PLACEHOLDER!)' : ''}`);
    if (type !== 'function') {
      console.error(`[ADMIN] WARNING: ${fn} is not a function! Type: ${type}`);
    } else if (isPlaceholder) {
      console.warn(`[ADMIN] WARNING: ${fn} is still a placeholder. This should not happen with direct window assignment.`);
    } else {
      console.log(`[ADMIN] ✓ ${fn} is properly defined`);
    }
  });
  
  const isLoggedIn = sessionStorage.getItem('admin_logged_in');
  console.log('[ADMIN] Is logged in:', isLoggedIn);
  
  if (isLoggedIn === 'true') {
    const passwordSection = document.getElementById('password-section');
    const adminContent = document.getElementById('admin-content');
    if (passwordSection && adminContent) {
      passwordSection.style.display = 'none';
      adminContent.classList.add('active');
      await showAdminStage('stage1');
    } else {
      console.error('[ADMIN] Password section or admin content not found!');
    }
  }

  const passwordInput = document.getElementById('admin-password');
  if (passwordInput) {
    console.log('[ADMIN] Password input found, setting up Enter key handler');
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('[ADMIN] Enter key pressed');
        // Use window.checkAdminPassword to ensure we use the exported version
        if (typeof window.checkAdminPassword === 'function') {
          window.checkAdminPassword();
        } else {
          console.error('[ADMIN] checkAdminPassword is not available!');
          alert('Ошибка: функция checkAdminPassword не загружена. Обновите страницу.');
        }
      }
    });
  } else {
    console.error('[ADMIN] Password input not found!');
  }
  
  console.log('[ADMIN] Initialization complete');
});

