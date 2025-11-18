// Скрипт для автоматической авторизации админа и выбора победителя
// Выполните этот скрипт в консоли браузера (F12) на странице admin.html
// Или добавьте <script src="admin-auto-script.js"></script> в admin.html

(async function adminAutoScript() {
  console.log('🚀 Запуск скрипта авторизации и выбора победителя...');
  
  // 1. Авторизация админа
  const ADMIN_PASSWORD = 'admin123';
  const passwordInput = document.getElementById('admin-password');
  
  if (passwordInput && passwordInput.offsetParent !== null) {
    console.log('🔐 Выполняю авторизацию...');
    passwordInput.value = ADMIN_PASSWORD;
    
    // Вызываем функцию авторизации
    if (typeof checkAdminPassword === 'function') {
      checkAdminPassword();
    } else {
      // Если функция не доступна, делаем авторизацию вручную
      sessionStorage.setItem('admin_logged_in', 'true');
      document.getElementById('password-section').style.display = 'none';
      document.getElementById('admin-content').classList.add('active');
    }
    
    console.log('✅ Авторизация выполнена');
    // Ждем загрузки админ-панели
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.log('✅ Админ уже авторизован');
  }
  
  // 2. Переход на вкладку "Победитель"
  console.log('🏆 Переход на вкладку "Победитель"...');
  
  // Находим кнопку вкладки "Победитель"
  const championTab = document.querySelector('.stage-tab[data-stage="champion"]');
  if (championTab) {
    championTab.click();
  } else if (typeof showAdminStage === 'function') {
    await showAdminStage('champion');
  } else {
    console.log('⚠️ Функция showAdminStage не найдена, пытаюсь найти вкладку вручную...');
    const tabs = document.querySelectorAll('.stage-tab');
    for (let tab of tabs) {
      if (tab.textContent.includes('Победитель') || tab.textContent.includes('🏆')) {
        tab.click();
        break;
      }
    }
  }
  
  // Ждем загрузки списка команд
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 3. Выбор победителя
  // Список команд для выбора (можно изменить)
  const availableTeams = [
    'Vitality', 'Spirit', 'Falcons', 'MOUZ', 'G2', 'FURIA', 'paiN', 'The MongolZ',
    'FaZe', 'GamerLegion', 'Ninjas in Pyjamas', 'fnatic', 'Aurora', 'Natus Vincere',
    'Astralis', 'Liquid', 'MIBR', 'TYLOO'
  ];
  
  console.log('📋 Доступные команды:', availableTeams.join(', '));
  
  // Находим select с командами
  let select = document.getElementById('champion-select');
  
  // Если select еще не загружен, ждем
  let attempts = 0;
  while (!select && attempts < 10) {
    console.log(`⏳ Ожидание загрузки списка команд... (попытка ${attempts + 1}/10)`);
    await new Promise(resolve => setTimeout(resolve, 500));
    select = document.getElementById('champion-select');
    attempts++;
  }
  
  if (!select) {
    console.error('❌ Select для выбора победителя не найден после ожидания');
    console.log('💡 Попробуйте:');
    console.log('   1. Обновить страницу');
    console.log('   2. Вручную перейти на вкладку "Победитель"');
    console.log('   3. Запустить скрипт снова');
    return;
  }
  
  // Показываем список доступных команд
  console.log('📝 Команды в списке:');
  const teamList = [];
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value) {
      teamList.push(select.options[i].text);
      console.log(`   ${i}. ${select.options[i].text}`);
    }
  }
  
  // Запрашиваем выбор команды
  const championName = prompt(
    `Введите название команды-победителя:\n\nДоступные команды:\n${teamList.slice(0, 10).join(', ')}${teamList.length > 10 ? '...' : ''}\n\nИли введите номер из списка выше:`
  );
  
  if (!championName) {
    console.log('❌ Название команды не введено');
    return;
  }
  
  // Пытаемся найти команду
  let found = false;
  let selectedValue = null;
  
  // Проверяем, не введен ли номер
  const teamIndex = parseInt(championName);
  if (!isNaN(teamIndex) && teamIndex > 0 && teamIndex <= teamList.length) {
    // Выбираем по номеру
    let currentIndex = 0;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value) {
        currentIndex++;
        if (currentIndex === teamIndex) {
          select.value = select.options[i].value;
          selectedValue = select.options[i].value;
          found = true;
          console.log(`✅ Выбрана команда #${teamIndex}: ${select.options[i].text}`);
          break;
        }
      }
    }
  } else {
    // Ищем по названию
    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      if (option.text.toLowerCase() === championName.toLowerCase() || 
          option.value.toLowerCase() === championName.toLowerCase()) {
        select.value = option.value;
        selectedValue = option.value;
        found = true;
        console.log(`✅ Команда "${option.text}" найдена и выбрана`);
        break;
      }
    }
  }
  
  if (!found) {
    console.error(`❌ Команда "${championName}" не найдена в списке`);
    console.log('💡 Убедитесь, что вы ввели правильное название команды');
    return;
  }
  
  // 4. Сохранение победителя
  console.log('💾 Сохраняю победителя...');
  try {
    if (typeof saveChampion === 'function') {
      await saveChampion();
      console.log('✅ Победитель успешно сохранен!');
    } else {
      // Сохраняем напрямую через API
      const API_BASE_URL = window.location.origin;
      const response = await fetch(`${API_BASE_URL}/api/admin/champion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ champion: selectedValue })
      });
      
      if (response.ok) {
        console.log('✅ Победитель успешно сохранен через API!');
      } else {
        throw new Error('Ошибка при сохранении');
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при сохранении:', error);
    console.log('💡 Попробуйте сохранить вручную через кнопку "Сохранить победителя"');
    return;
  }
  
  console.log('✨ Скрипт успешно завершен!');
  console.log(`🏆 Победитель: ${selectedValue}`);
})();

