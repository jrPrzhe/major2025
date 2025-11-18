// Скрипт для авторизации админа и выбора победителя
// Выполните этот скрипт в консоли браузера на странице admin.html

(async function() {
  console.log('🚀 Начинаю авторизацию админа...');
  
  // 1. Авторизация
  const ADMIN_PASSWORD = 'admin123';
  const passwordInput = document.getElementById('admin-password');
  
  if (!passwordInput) {
    console.log('✅ Админ уже авторизован или страница не загружена');
  } else {
    passwordInput.value = ADMIN_PASSWORD;
    checkAdminPassword();
    console.log('✅ Авторизация выполнена');
    
    // Ждем загрузки админ-панели
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 2. Переход на вкладку "Победитель"
  console.log('🏆 Переход на вкладку "Победитель"...');
  await showAdminStage('champion');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 3. Выбор победителя (замените "Vitality" на нужную команду)
  const championName = prompt('Введите название команды-победителя (например: Vitality, Spirit, G2, etc.):');
  
  if (!championName) {
    console.log('❌ Название команды не введено');
    return;
  }
  
  console.log(`🎯 Выбираю победителя: ${championName}`);
  
  // Находим select с командами
  const championSelect = document.getElementById('champion-select');
  
  if (!championSelect) {
    console.log('❌ Select для выбора победителя не найден. Ждем загрузки...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const championSelectRetry = document.getElementById('champion-select');
    if (!championSelectRetry) {
      console.log('❌ Select все еще не найден. Попробуйте обновить страницу.');
      return;
    }
  }
  
  const select = document.getElementById('champion-select');
  
  // Ищем нужную команду в списке
  let found = false;
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].text === championName || select.options[i].value === championName) {
      select.value = select.options[i].value;
      found = true;
      console.log(`✅ Команда "${championName}" найдена и выбрана`);
      break;
    }
  }
  
  if (!found) {
    console.log(`❌ Команда "${championName}" не найдена в списке. Доступные команды:`);
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value) {
        console.log(`  - ${select.options[i].text}`);
      }
    }
    return;
  }
  
  // 4. Сохранение победителя
  console.log('💾 Сохраняю победителя...');
  try {
    await saveChampion();
    console.log('✅ Победитель успешно сохранен!');
  } catch (error) {
    console.error('❌ Ошибка при сохранении:', error);
  }
  
  console.log('✨ Скрипт завершен!');
})();

