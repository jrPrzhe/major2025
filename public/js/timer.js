// Timer configuration
const TIMER_CONFIG = {
  stage1: new Date('2025-11-24T23:59:59').getTime(),
  stage2: new Date('2025-12-01T23:59:59').getTime(), // Пример: через неделю после Stage 1
  stage3: new Date('2025-12-08T23:59:59').getTime()  // Пример: через неделю после Stage 2
};

// Initialize timers
function initTimers() {
  updateAllTimers();
  setInterval(updateAllTimers, 1000);
}

// Update all timers
function updateAllTimers() {
  Object.keys(TIMER_CONFIG).forEach(stageId => {
    updateTimer(stageId);
  });
}

// Update single timer
function updateTimer(stageId) {
  const timerElement = document.getElementById(`timer-value-${stageId}`);
  if (!timerElement) {
    console.warn(`Timer element not found for ${stageId}`);
    return;
  }

  const endTime = TIMER_CONFIG[stageId];
  const now = new Date().getTime();
  const distance = endTime - now;

  if (distance < 0) {
    timerElement.textContent = 'ВРЕМЯ ИСТЕКЛО';
    timerElement.classList.add('expired');
    return false; // Timer expired
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  timerElement.textContent = `${days}д ${hours}ч ${minutes}м ${seconds}с`;
  timerElement.classList.remove('expired');
  return true; // Timer active
}

// Check if timer is expired
function isTimerExpired(stageId) {
  const endTime = TIMER_CONFIG[stageId];
  const now = new Date().getTime();
  return now >= endTime;
}

// Get remaining time in milliseconds
function getRemainingTime(stageId) {
  const endTime = TIMER_CONFIG[stageId];
  const now = new Date().getTime();
  return Math.max(0, endTime - now);
}

