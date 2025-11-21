// Скрипт для установки победителя через API
// Запуск: node set-champion.js [название_команды]

const http = require('http');

const API_BASE_URL = 'http://localhost:3000';
const CHAMPION_NAME = process.argv[2] || 'Vitality'; // По умолчанию Vitality

console.log('🚀 Скрипт установки победителя');
console.log(`📋 Команда-победитель: ${CHAMPION_NAME}`);
console.log('');

// Функция для выполнения HTTP запроса
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || body}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Основная функция
async function setChampion() {
  try {
    console.log('💾 Сохраняю победителя через API...');
    
    const result = await makeRequest('POST', '/api/admin/champion', {
      champion: CHAMPION_NAME
    });
    
    console.log('✅ Победитель успешно сохранен!');
    console.log(`🏆 Победитель: ${CHAMPION_NAME}`);
    console.log('');
    console.log('📊 Результат:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Ошибка при сохранении победителя:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('💡 Убедитесь, что сервер запущен:');
      console.error('   node server.js');
    }
    
    process.exit(1);
  }
}

// Запуск
setChampion();



