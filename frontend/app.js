const API_BASE = 'http://localhost:8000';

const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginMessage = document.getElementById('login-message');
const signupMessage = document.getElementById('signup-message');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard');
const logoutButton = document.getElementById('logout-button');
const refreshButton = document.getElementById('refresh-button');
const dashboardUser = document.getElementById('dashboard-user');
const alertsContainer = document.getElementById('alerts-container');
const alertsList = document.getElementById('alerts-list');
const latestTemperature = document.getElementById('latest-temperature');
const latestHumidity = document.getElementById('latest-humidity');
const latestElectricity = document.getElementById('latest-electricity');
const latestAge = document.getElementById('latest-age');
const historyTableBody = document.getElementById('history-table-body');
const historyChartCanvas = document.getElementById('history-chart');

let historyChart = null;

function setActiveTab(tab) {
  const loginVisible = tab === 'login';
  loginTab.classList.toggle('active', loginVisible);
  signupTab.classList.toggle('active', !loginVisible);
  loginForm.classList.toggle('hidden', !loginVisible);
  signupForm.classList.toggle('hidden', loginVisible);
  loginMessage.textContent = '';
  signupMessage.textContent = '';
}

function showDashboard() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
}

function showAuth() {
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
}

function getToken() {
  return localStorage.getItem('farmguard_token');
}

function setToken(token) {
  localStorage.setItem('farmguard_token', token);
}

function clearToken() {
  localStorage.removeItem('farmguard_token');
}

function createAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data: json };
}

async function handleSignup(event) {
  event.preventDefault();
  signupMessage.textContent = '';

  const name = document.getElementById('signup-name').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!name || !phone || !password) {
    signupMessage.textContent = 'يرجى تعبئة جميع الحقول';
    return;
  }

  const { ok, data } = await request('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, password }),
  });

  if (!ok) {
    signupMessage.textContent = data.error || 'حدث خطأ أثناء إنشاء الحساب';
    return;
  }

  if (data.error) {
    signupMessage.textContent = data.error;
    return;
  }

  signupMessage.style.color = '#166534';
  signupMessage.textContent = 'تم إنشاء الحساب. الآن يمكنك تسجيل الدخول.';
}

async function handleLogin(event) {
  event.preventDefault();
  loginMessage.textContent = '';

  const phone = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-password').value;

  if (!phone || !password) {
    loginMessage.textContent = 'يرجى تعبئة الهاتف وكلمة المرور';
    return;
  }

  const { ok, data } = await request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });

  if (!ok || data.error) {
    loginMessage.textContent = data.error || 'فشل تسجيل الدخول';
    return;
  }

  setToken(data.access_token);
  loginMessage.textContent = '';
  dashboardUser.textContent = `مرحباً بك`; 
  await loadDashboard();
  showDashboard();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadDashboard() {
  const token = getToken();
  if (!token) {
    showAuth();
    return;
  }

  const { ok, data } = await request('/my-readings', {
    headers: createAuthHeaders(),
  });

  if (!ok) {
    clearToken();
    showAuth();
    return;
  }

  const readings = Array.isArray(data) ? data : [];
  if (readings.length === 0) {
    latestTemperature.textContent = '--';
    latestHumidity.textContent = '--';
    latestElectricity.textContent = '--';
    latestAge.textContent = '--';
    alertsContainer.classList.add('hidden');
    historyTableBody.innerHTML = '<tr><td colspan="5">لا توجد قراءات حتى الآن</td></tr>';
    renderChart([], []);
    return;
  }

  const sorted = readings.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latest = sorted[0];

  latestTemperature.textContent = `${latest.temperature} °C`;
  latestHumidity.textContent = `${latest.humidity} %`;
  latestElectricity.textContent = latest.electricity_on ? 'تشغيل' : 'متوقف';
  latestAge.textContent = `${latest.chicken_age_days} يوم`;

  const alerts = calculateAlerts(latest);
  if (alerts.length > 0) {
    alertsList.innerHTML = alerts.map((alert) => `<li>${alert}</li>`).join('');
    alertsContainer.classList.remove('hidden');
  } else {
    alertsContainer.classList.add('hidden');
  }

  historyTableBody.innerHTML = sorted
    .map((item) => {
      return `<tr>
        <td>${formatDate(item.created_at)}</td>
        <td>${item.temperature} °C</td>
        <td>${item.humidity} %</td>
        <td>${item.electricity_on ? 'تشغيل' : 'متوقف'}</td>
        <td>${item.chicken_age_days} يوم</td>
      </tr>`;
    })
    .join('');

  const labels = sorted.map((item) => formatDate(item.created_at)).reverse();
  const temps = sorted.map((item) => item.temperature).reverse();
  const hums = sorted.map((item) => item.humidity).reverse();
  renderChart(labels, temps, hums);
}

function calculateAlerts(item) {
  const alerts = [];
  if (!item) return alerts;
  const age = item.chicken_age_days;
  let minTemp = 18;
  let maxTemp = 21;

  if (age <= 7) {
    minTemp = 32;
    maxTemp = 35;
  } else if (age <= 14) {
    minTemp = 29;
    maxTemp = 32;
  } else if (age <= 21) {
    minTemp = 26;
    maxTemp = 29;
  } else if (age <= 28) {
    minTemp = 23;
    maxTemp = 26;
  } else if (age <= 35) {
    minTemp = 20;
    maxTemp = 23;
  }

  const buffer = age <= 7 ? 2 : 5;
  if (item.temperature > maxTemp + buffer) {
    alerts.push('⚠️ تنبيه: الحرارة مرتفعة جداً');
  } else if (item.temperature < minTemp - buffer) {
    alerts.push('⚠️ تنبيه: الحرارة منخفضة جداً');
  }

  if (item.humidity > 70) {
    alerts.push('⚠️ تنبيه: الرطوبة مرتفعة، خطر على الفرشة والأمراض');
  }

  if (!item.electricity_on) {
    alerts.push('⚠️ تحذير: انقطاع الكهرباء! المروحة متوقفة');
  }

  return alerts;
}

function renderChart(labels, temps, hums) {
  if (!historyChart || !(historyChart instanceof Chart)) {
    const ctx = historyChartCanvas.getContext('2d');
    historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'الحرارة',
            data: temps,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            fill: true,
            tension: 0.3,
          },
          {
            label: 'الرطوبة',
            data: hums,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#374151', textAlign: 'right' },
          },
        },
        scales: {
          x: {
            ticks: { color: '#4b5563' },
            grid: { color: '#e5e7eb' },
          },
          y: {
            ticks: { color: '#4b5563' },
            grid: { color: '#e5e7eb' },
          },
        },
      },
    });
    return;
  }

  historyChart.data.labels = labels;
  historyChart.data.datasets[0].data = temps;
  historyChart.data.datasets[1].data = hums;
  historyChart.update();
}

let chartReadyPromise = null;

function injectChartLibrary() {
  if (chartReadyPromise) {
    return chartReadyPromise;
  }

  chartReadyPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('فشل تحميل مكتبة الرسم البياني'));
    document.body.appendChild(script);
  });

  return chartReadyPromise;
}

async function loadDashboard() {
  await injectChartLibrary();

  const token = getToken();
  if (!token) {
    showAuth();
    return;
  }

  const { ok, data } = await request('/my-readings', {
    headers: createAuthHeaders(),
  });

  if (!ok) {
    clearToken();
    showAuth();
    return;
  }

  const readings = Array.isArray(data) ? data : [];
  if (readings.length === 0) {
    latestTemperature.textContent = '--';
    latestHumidity.textContent = '--';
    latestElectricity.textContent = '--';
    latestAge.textContent = '--';
    alertsContainer.classList.add('hidden');
    historyTableBody.innerHTML = '<tr><td colspan="5">لا توجد قراءات حتى الآن</td></tr>';
    renderChart([], []);
    return;
  }

  const sorted = readings.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latest = sorted[0];

  latestTemperature.textContent = `${latest.temperature} °C`;
  latestHumidity.textContent = `${latest.humidity} %`;
  latestElectricity.textContent = latest.electricity_on ? 'تشغيل' : 'متوقف';
  latestAge.textContent = `${latest.chicken_age_days} يوم`;

  const alerts = calculateAlerts(latest);
  if (alerts.length > 0) {
    alertsList.innerHTML = alerts.map((alert) => `<li>${alert}</li>`).join('');
    alertsContainer.classList.remove('hidden');
  } else {
    alertsContainer.classList.add('hidden');
  }

  historyTableBody.innerHTML = sorted
    .map((item) => {
      return `<tr>
        <td>${formatDate(item.created_at)}</td>
        <td>${item.temperature} °C</td>
        <td>${item.humidity} %</td>
        <td>${item.electricity_on ? 'تشغيل' : 'متوقف'}</td>
        <td>${item.chicken_age_days} يوم</td>
      </tr>`;
    })
    .join('');

  const labels = sorted.map((item) => formatDate(item.created_at)).reverse();
  const temps = sorted.map((item) => item.temperature).reverse();
  const hums = sorted.map((item) => item.humidity).reverse();
  renderChart(labels, temps, hums);
}

function init() {
  setActiveTab('login');

  loginTab.addEventListener('click', () => setActiveTab('login'));
  signupTab.addEventListener('click', () => setActiveTab('signup'));
  loginForm.addEventListener('submit', handleLogin);
  signupForm.addEventListener('submit', handleSignup);
  logoutButton.addEventListener('click', () => {
    clearToken();
    showAuth();
  });
  refreshButton.addEventListener('click', loadDashboard);

  if (getToken()) {
    showDashboard();
  }

  injectChartLibrary().catch((error) => {
    console.error(error);
  });
}

init();
