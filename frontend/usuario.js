let userCameraStream = null;

function carregarUsuario() {
  const session = typeof getSession === 'function' ? getSession() : null;
  if (!session) return;
  const firstName = session.name?.split(' ')[0] || 'usuário';
  document.getElementById('userName').textContent = session.name || 'Usuário';
  document.getElementById('welcomeName').textContent = firstName;
  const initials = (session.name || 'Usuário').split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
  document.getElementById('userAvatar').textContent = initials || 'US';
}

function atualizarRelogio() {
  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  document.querySelectorAll('.js-clock').forEach(el => el.textContent = hora);
}

async function abrirCameraUsuario(nome) {
  const modal = document.getElementById('userCameraModal');
  const video = document.getElementById('userWebcam');
  const fallback = document.getElementById('cameraFallback');
  document.getElementById('cameraModalTitle').textContent = nome;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  registrarEvento('camera', 'Câmera visualizada', nome);

  try {
    if (userCameraStream) userCameraStream.getTracks().forEach(track => track.stop());
    userCameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = userCameraStream;
    fallback.style.display = 'none';
  } catch (error) {
    fallback.style.display = 'flex';
  }
}

function fecharCameraUsuario() {
  const modal = document.getElementById('userCameraModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if (userCameraStream) {
    userCameraStream.getTracks().forEach(track => track.stop());
    userCameraStream = null;
  }
  document.getElementById('userWebcam').srcObject = null;
}

function registrarEvento(tipo, titulo, local) {
  const list = document.getElementById('historyList');
  const item = document.createElement('div');
  item.className = 'history-item';
  item.dataset.type = tipo;
  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  item.innerHTML = `<span class="history-icon">◉</span><div><strong>${titulo}</strong><small>${local}</small></div><time>Hoje, ${hora}</time>`;
  list.prepend(item);
  filtrarHistorico();
}

function filtrarHistorico() {
  const filtro = document.getElementById('historyFilter').value;
  document.querySelectorAll('#historyList .history-item').forEach(item => {
    item.style.display = filtro === 'all' || item.dataset.type === filtro ? 'grid' : 'none';
  });
}

function perguntaRapida(texto) {
  document.getElementById('chatInput').value = texto;
  enviarMensagemUsuario(new Event('submit'));
}

function enviarMensagemUsuario(event) {
  event.preventDefault();
  const input = document.getElementById('chatInput');
  const texto = input.value.trim();
  if (!texto) return;
  adicionarMensagem(texto, 'user-message');
  input.value = '';
  const t = texto.toLowerCase();
  let resposta = 'Posso ajudar com as câmeras, o mapa 2D e o histórico de eventos.';
  if (t.includes('online') || t.includes('câmera') || t.includes('camera')) resposta = 'As 3 câmeras estão online: Entrada principal, Sala de estar e Quintal. Você pode abrir qualquer uma na seção “Suas câmeras” ou pelo mapa 2D.';
  else if (t.includes('último') || t.includes('ultimo') || t.includes('histórico') || t.includes('historico') || t.includes('evento')) resposta = 'O evento mais recente registrado foi movimento detectado na Entrada principal. O histórico completo fica logo acima deste assistente.';
  else if (t.includes('mapa') || t.includes('usar')) resposta = 'No mapa 2D, os pontos escuros com indicador verde representam câmeras. Clique em Entrada, Sala ou Quintal para abrir a visualização.';
  else if (t.includes('oi') || t.includes('olá') || t.includes('ola')) resposta = 'Olá! Está tudo normal por aqui. As 3 câmeras estão conectadas e não há alertas ativos.';
  setTimeout(() => adicionarMensagem(resposta, 'bot-message'), 300);
}

function adicionarMensagem(texto, classe) {
  const chat = document.getElementById('chatHistory');
  const msg = document.createElement('div');
  msg.className = classe;
  msg.textContent = texto;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
  carregarUsuario();
  atualizarRelogio();
  setInterval(atualizarRelogio, 30000);
  document.getElementById('userCameraModal').addEventListener('click', e => { if (e.target.id === 'userCameraModal') fecharCameraUsuario(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharCameraUsuario(); });
});
