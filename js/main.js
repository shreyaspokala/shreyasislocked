// ===== Mobile Sidebar Toggle =====
const hamburger = document.querySelector('.hamburger');
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.overlay');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
}

if (overlay) {
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}

// ===== Tab Switching =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    const container = btn.closest('.tabs-container') || btn.parentElement.parentElement;

    container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    const tabEl = container.querySelector(`#tab-${target}`);
    if (tabEl) tabEl.classList.add('active');
  });
});

// ===== Tab Cloaking =====
function applyCloak() {
  const cloak = localStorage.getItem('tabCloak');
  if (!cloak) return;

  const cloaks = {
    'google-docs': { title: 'Google Docs', icon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico' },
    'google-drive': { title: 'My Drive - Google Drive', icon: 'https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png' },
    'clever': { title: 'Clever | Portal', icon: 'https://assets.clever.com/resource-icons/apps/clever.png' },
    'canvas': { title: 'Dashboard', icon: 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico' },
    'gmail': { title: 'Gmail', icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
  };

  const c = cloaks[cloak];
  if (c) {
    document.title = c.title;
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = c.icon;
    document.head.appendChild(link);
  }
}

applyCloak();

// ===== Panic Button =====
const panicUrl = localStorage.getItem('panicUrl') || 'https://www.google.com';

document.addEventListener('keydown', (e) => {
  if (e.key === '`' || (e.key === 'Escape' && e.shiftKey)) {
    window.location.href = panicUrl;
  }
});

// ===== About:Blank Popup =====
function openInBlank() {
  const win = window.open('about:blank', '_blank');
  if (!win) return alert('Pop-ups are blocked. Please allow pop-ups for this site.');
  const iframe = win.document.createElement('iframe');
  iframe.style.cssText = 'width:100%;height:100%;border:none;position:fixed;top:0;left:0;';
  iframe.src = window.location.href;
  win.document.body.style.margin = '0';
  win.document.body.appendChild(iframe);
  // Close original tab
  window.close();
  // If close didn't work, redirect
  setTimeout(() => { window.location.href = panicUrl; }, 100);
}

// ===== Settings =====
function saveSettings() {
  const cloakSelect = document.getElementById('cloak-select');
  const panicInput = document.getElementById('panic-url');
  const backendInput = document.getElementById('backend-url');

  if (cloakSelect) localStorage.setItem('tabCloak', cloakSelect.value);
  if (panicInput) localStorage.setItem('panicUrl', panicInput.value);
  if (backendInput) localStorage.setItem('proxyBackend', backendInput.value);

  applyCloak();
  alert('Settings saved!');
}

function loadSettings() {
  const cloakSelect = document.getElementById('cloak-select');
  const panicInput = document.getElementById('panic-url');
  const backendInput = document.getElementById('backend-url');

  if (cloakSelect) cloakSelect.value = localStorage.getItem('tabCloak') || '';
  if (panicInput) panicInput.value = localStorage.getItem('panicUrl') || 'https://www.google.com';
  if (backendInput) backendInput.value = localStorage.getItem('proxyBackend') || '';
}

// Load settings on pages that have the settings form
if (document.getElementById('cloak-select')) {
  loadSettings();
}

// ===== Active Nav Link Highlighting =====
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-links a').forEach(link => {
  if (link.getAttribute('href') && currentPath.endsWith(link.getAttribute('href').replace('./', ''))) {
    link.classList.add('active');
  }
});
