const SENTINEL_USERS_KEY = 'sentinel_users_v1';
const SENTINEL_SESSION_KEY = 'sentinel_session_v1';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(SENTINEL_USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(SENTINEL_USERS_KEY, JSON.stringify(users));
}

function setSession(user) {
  const session = {
    name: user.name,
    email: user.email,
    role: user.role || 'Operador',
    loggedAt: new Date().toISOString()
  };
  localStorage.setItem(SENTINEL_SESSION_KEY, JSON.stringify(session));
  return session;
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SENTINEL_SESSION_KEY));
  } catch {
    return null;
  }
}

function logoutSentinel() {
  localStorage.removeItem(SENTINEL_SESSION_KEY);
  window.location.href = 'login.html';
}

function seedDemoUser() {
  const users = getUsers();
  if (users.some(user => user.email === 'operador@sentinel.com')) return;

  users.push({
    name: 'Operador Sentinel',
    email: 'operador@sentinel.com',
    password: 'Sentinel123',
    role: 'Administrador'
  });
  saveUsers(users);
}

function setFeedback(element, message, type = 'error') {
  if (!element) return;
  element.textContent = message;
  element.className = `form-feedback ${type}`;
  element.hidden = false;
}

function clearFeedback(element) {
  if (!element) return;
  element.hidden = true;
  element.textContent = '';
}

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  button.textContent = showing ? 'Mostrar' : 'Ocultar';
  button.setAttribute('aria-pressed', String(!showing));
}

function handleLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const feedback = document.getElementById('loginFeedback');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
      setFeedback(feedback, 'Preencha seu e-mail e sua senha.');
      return;
    }

    const user = getUsers().find(item => item.email.toLowerCase() === email && item.password === password);

    if (!user) {
      setFeedback(feedback, 'E-mail ou senha inválidos. Confira os dados e tente novamente.');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Autenticando...';
    setSession(user);

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 350);
  });

  document.getElementById('fillDemo')?.addEventListener('click', () => {
    emailInput.value = 'operador@sentinel.com';
    passwordInput.value = 'Sentinel123';
    emailInput.focus();
  });
}

function handleRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const feedback = document.getElementById('registerFeedback');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const strengthBar = document.getElementById('passwordStrength');
  const strengthLabel = document.getElementById('passwordStrengthLabel');

  passwordInput?.addEventListener('input', () => {
    const value = passwordInput.value;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    const labels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
    const widths = ['8%', '25%', '50%', '75%', '100%'];
    if (strengthBar) strengthBar.style.width = widths[score];
    if (strengthBar) strengthBar.dataset.level = String(score);
    if (strengthLabel) strengthLabel.textContent = labels[score];
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    const terms = document.getElementById('terms').checked;

    if (name.length < 3) {
      setFeedback(feedback, 'Digite seu nome completo.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFeedback(feedback, 'Digite um e-mail válido.');
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setFeedback(feedback, 'A senha precisa ter pelo menos 8 caracteres, uma letra maiúscula e um número.');
      return;
    }

    if (password !== confirmPassword) {
      setFeedback(feedback, 'As senhas não coincidem.');
      return;
    }

    if (!terms) {
      setFeedback(feedback, 'Aceite os termos de uso para continuar.');
      return;
    }

    const users = getUsers();
    if (users.some(user => user.email.toLowerCase() === email)) {
      setFeedback(feedback, 'Já existe uma conta cadastrada com este e-mail.');
      return;
    }

    const newUser = { name, email, password, role: 'Operador' };
    users.push(newUser);
    saveUsers(users);
    setSession(newUser);
    setFeedback(feedback, 'Conta criada com sucesso. Redirecionando...', 'success');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  });
}

function protectDashboard() {
  if (!document.body.classList.contains('dashboard-page')) return;

  const session = getSession();
  if (!session) {
    window.location.replace('login.html');
    return;
  }

  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const userAvatar = document.getElementById('userAvatar');

  if (userName) userName.textContent = session.name;
  if (userRole) userRole.textContent = session.role;
  if (userAvatar) {
    const initials = session.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
    userAvatar.textContent = initials || 'OP';
  }
}

seedDemoUser();

document.addEventListener('DOMContentLoaded', () => {
  const session = getSession();
  if ((document.body.classList.contains('auth-page')) && session) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('force') !== '1') window.location.href = 'index.html';
  }

  handleLogin();
  handleRegister();
  protectDashboard();
});
