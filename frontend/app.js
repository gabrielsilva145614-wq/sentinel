// ==========================================
// ESTADO GLOBAL DO SISTEMA
// ==========================================
let estadoSistema = {
  portaPrincipal: false,
  janelaSala: false,
  incendioDetectado: false,
  gasDetectado: false,
  alertaPolicial: false,
  streamWebcam: null,
  timerEmergencia: null
};

// BANCO DE DADOS SIMULADO DA POLÍCIA CIVIL / MILITAR
const bancoDadosPolicia = [
  { id: 'PROC-8832', nome: 'Carlos "Sombra" Mendes', mandado: 'Ativo - Art. 157', periculosidade: 'ALTA' }
];

// ==========================================
// 🛡️ 1. MOTOR PREDITIVO DE RISCO
// ==========================================
function recalcularRisco() {
  let scoreRisco = 10;

  if (estadoSistema.portaPrincipal) scoreRisco += 25;
  if (estadoSistema.janelaSala) scoreRisco += 20;
  if (estadoSistema.gasDetectado) scoreRisco += 50;
  if (estadoSistema.incendioDetectado) scoreRisco += 70;
  if (estadoSistema.alertaPolicial) scoreRisco += 90;

  if (scoreRisco > 100) scoreRisco = 100;

  atualizarUI(scoreRisco);
}

function atualizarUI(score) {
  const riskValue = document.getElementById('riskValue');
  const riskLevel = document.getElementById('riskLevel');
  const gaugeCircle = document.getElementById('gaugeCircle');

  riskValue.innerText = `${score}%`;

  if (score < 30) {
    riskLevel.innerText = 'RISCO BAIXO';
    gaugeCircle.style.borderColor = '#10b981';
    gaugeCircle.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
  } else if (score < 70) {
    riskLevel.innerText = 'ATENÇÃO / RISCO MÉDIO';
    gaugeCircle.style.borderColor = '#f59e0b';
    gaugeCircle.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.4)';
  } else {
    riskLevel.innerText = 'ALERTA MÁXIMO / EMERGÊNCIA';
    gaugeCircle.style.borderColor = '#ef4444';
    gaugeCircle.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.7)';
  }
}

// ==========================================
// 🤖 2. IA DE RECONHECIMENTO FACIAL (face-api.js)
// ==========================================
let iaCarregada = false;
let rostoMemorizado = null; 
let intervaloReconhecimento = null;

async function carregarModelosIA() {
  const statusEl = document.getElementById('scanStatus');
  if (statusEl) statusEl.innerText = "CARREGANDO REDE NEURAL...";
  
  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
  
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    iaCarregada = true;
    if (statusEl) statusEl.innerText = "IA PRONTA. AGUARDANDO BIOMETRIA.";
    adicionarLog("Sistema Sentinel: IA de Visão Computacional Carregada.");
  } catch (erro) {
    adicionarLog("Erro ao carregar IA. Verifique sua conexão.");
    console.error(erro);
  }
}

async function cadastrarBiometria() {
  if (!iaCarregada) return alert("Aguarde a IA carregar os modelos!");
  const video = document.getElementById('webcam');
  document.getElementById('scanStatus').innerText = "ESCANEMENTO... OLHE PARA A CÂMERA.";

  const detecao = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
  
  if (detecao) {
    rostoMemorizado = detecao.descriptor;
    document.getElementById('scanStatus').innerText = "✅ ROSTO MEMORIZADO COM SUCESSO!";
    document.getElementById('scanStatus').style.color = "#10b981";
    adicionarLog("Biometria cadastrada temporariamente na memória RAM.");
  } else {
    document.getElementById('scanStatus').innerText = "❌ ROSTO NÃO ENCONTRADO. TENTE NOVAMENTE.";
    document.getElementById('scanStatus').style.color = "#ef4444";
  }
}

async function iniciarReconhecimento() {
  if (!rostoMemorizado) return alert("Você precisa memorizar seu rosto primeiro!");
  const video = document.getElementById('webcam');
  document.getElementById('scanStatus').innerText = "MONITORAMENTO IA ATIVADO 🟢";
  
  const comparador = new faceapi.FaceMatcher(rostoMemorizado, 0.5);

  intervaloReconhecimento = setInterval(async () => {
    const rostoNaCamera = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

    if (rostoNaCamera) {
      const resultado = comparador.findBestMatch(rostoNaCamera.descriptor);
      if (resultado.label === "unknown") {
        simularDesconhecido();
      } else {
        simularMorador();
      }
    }
  }, 1000);
}

// Funções acionadas pela IA e Simulação
function simularMorador() {
  if (estadoSistema.alertaPolicial) return; // Não libera se houver polícia
  document.getElementById('scanStatus').innerText = "VERIFIED: MORADOR — ACESSO PERMITIDO";
  document.getElementById('scanStatus').style.color = "#10b981";
  document.getElementById('lastAccess').innerText = "Morador Autorizado";
  
  if (estadoSistema.portaPrincipal) {
      togglePorta(); // Destranca a porta se estiver trancada
  }
  recalcularRisco();
  enviarEventoBackend('Reconhecimento Facial', 'MORADOR AUTORIZADO');
}

function simularDesconhecido() {
  if (estadoSistema.alertaPolicial) return;
  document.getElementById('scanStatus').innerText = "DESCONHECIDO — ACESSO NEGADO";
  document.getElementById('scanStatus').style.color = "#f59e0b";
  document.getElementById('lastAccess').innerText = "Pessoa Não Cadastrada";
  recalcularRisco();
  enviarEventoBackend('Reconhecimento Facial', 'ACESSO NEGADO - DESCONHECIDO');
}

function simularProcuradoPolicia() {
  estadoSistema.alertaPolicial = true;
  const procurado = bancoDadosPolicia[0];
  
  document.getElementById('scanStatus').innerText = `🚨 CRÍTICO: PROCURADO (${procurado.nome})`;
  document.getElementById('scanStatus').style.color = "#ef4444";
  document.getElementById('lastAccess').innerText = `ALERTA POLICIAL (${procurado.id})`;
  
  adicionarLog(`🚨 ALERTA POLICIAL: Indivíduo com mandado de prisão detectado.`);
  recalcularRisco();
  discarEmergencia('190 (POLÍCIA MILITAR)', `FORAGIDO DETECTADO: ${procurado.nome}`);
  enviarEventoBackend('Alerta Policial', `PROCURADO DETECTADO - ${procurado.id}`);
}

// ==========================================
// ⚠️ 3. SENSORES FÍSICOS DA PLANTA
// ==========================================
function togglePorta() {
  estadoSistema.portaPrincipal = !estadoSistema.portaPrincipal;
  const btn = document.getElementById('btnPortaPrincipal');
  const status = document.getElementById('statusPortaPrincipal');

  btn.classList.toggle('open', estadoSistema.portaPrincipal);
  btn.innerHTML = estadoSistema.portaPrincipal ? '<span>ACC</span> Porta (ABERTA)' : '<span>ACC</span> Porta (TRANCADA)';
  status.innerText = estadoSistema.portaPrincipal ? 'ABERTA' : 'TRANCADA';
  status.className = estadoSistema.portaPrincipal ? 'status-pill text-red' : 'status-pill text-green';

  enviarEventoBackend('Porta Principal', estadoSistema.portaPrincipal ? 'ABERTA' : 'TRANCADA');

  recalcularRisco();
}

function toggleJanela() {
  estadoSistema.janelaSala = !estadoSistema.janelaSala;
  const btn = document.getElementById('btnJanelaSala');
  const status = document.getElementById('statusJanelaSala');

  btn.classList.toggle('open', estadoSistema.janelaSala);
  btn.innerHTML = estadoSistema.janelaSala ? '<span>ACC</span> Janela (ABERTA)' : '<span>ACC</span> Janela (FECHADA)';
  status.innerText = estadoSistema.janelaSala ? 'ABERTA' : 'FECHADA';
  status.className = estadoSistema.janelaSala ? 'status-pill text-red' : 'status-pill text-green';

  enviarEventoBackend('Janela da Sala', estadoSistema.janelaSala ? 'ABERTA' : 'FECHADA');

  recalcularRisco();
}

function toggleIncendio() {
  estadoSistema.incendioDetectado = !estadoSistema.incendioDetectado;
  const btn = document.getElementById('btnFireSensor');
  const room = document.getElementById('roomKitchen');
  const txtStatus = document.getElementById('statusFumaca');

  if (estadoSistema.incendioDetectado) {
    btn.classList.add('active');
    btn.innerHTML = '<span>ENV</span> INCÊNDIO DETECTADO';
    room.classList.add('hazard');
    txtStatus.innerText = 'FUMAÇA/FOGO';
    txtStatus.className = 'status-pill text-red';
    adicionarLog('🔥 EMERGÊNCIA: Sensor de fumaça disparado na Cozinha!');
    discarEmergencia('193 (BOMBEIROS)', 'Detecção de Incêndio na Cozinha');
    enviarEventoBackend("Sensor de Fumaça", "INCÊNDIO DETECTADO");
  } else {
    btn.classList.remove('active');
    btn.innerHTML = '<span>ENV</span> Sensor Fumaça';
    room.classList.remove('hazard');
    txtStatus.innerText = 'NORMAL';
    txtStatus.className = 'status-pill text-green';
    enviarEventoBackend('Sensor de Fumaça', 'NORMALIZADO');
  }
  recalcularRisco();
}

function toggleGas() {
  estadoSistema.gasDetectado = !estadoSistema.gasDetectado;
  const btn = document.getElementById('btnGasSensor');
  const txtStatus = document.getElementById('statusGas');

  if (estadoSistema.gasDetectado) {
    btn.classList.add('active');
    btn.innerHTML = '<span>ENV</span> VAZAMENTO DETECTADO';
    txtStatus.innerText = 'VAZAMENTO DETECTADO';
    txtStatus.className = 'status-pill text-red';
    adicionarLog('⚠️ ALERTA: Vazamento de Gás GLP! Válvula bloqueada.');
    enviarEventoBackend('Sensor de Gás GLP', 'VAZAMENTO DETECTADO');
  } else {
    btn.classList.remove('active');
    btn.innerHTML = '<span>ENV</span> Sensor Gás GLP';
    txtStatus.innerText = 'NORMAL';
    txtStatus.className = 'status-pill text-green';
    enviarEventoBackend('Sensor de Gás GLP', 'NORMAL');
  }
  recalcularRisco();
}

// ==========================================
// 🚨 4. EMERGÊNCIA E WEBCAM
// ==========================================
function discarEmergencia(servico, motivo) {
  const modalEmergencia = document.getElementById('emergencyModal');
  document.getElementById('emergencyTitle').innerText = `🚨 LIGANDO PARA ${servico}`;
  document.getElementById('emergencyBody').innerText = `Motivo: ${motivo}. Estabelecendo conexão...`;
  modalEmergencia.style.display = 'flex';

  let segundos = 3;
  document.getElementById('emergencyTimer').innerText = `00:0${segundos}`;

  clearInterval(estadoSistema.timerEmergencia);
  estadoSistema.timerEmergencia = setInterval(() => {
    segundos--;
    document.getElementById('emergencyTimer').innerText = `00:0${segundos}`;
    if (segundos <= 0) {
      clearInterval(estadoSistema.timerEmergencia);
      document.getElementById('emergencyBody').innerText = `CHAMADA CONECTADA. Transmitindo dados.`;
      adicionarLog(`📞 Chamada efetuada para ${servico}.`);
    }
  }, 1000);
}

function cancelarEmergencia() {
  clearInterval(estadoSistema.timerEmergencia);
  document.getElementById('emergencyModal').style.display = 'none';
  adicionarLog('Chamada de emergência cancelada pelo operador.');
}

async function abrirCamera(id, nome) {
  document.getElementById('modalTitle').innerText = `FEED AO VIVO — ${nome.toUpperCase()}`;
  document.getElementById('cameraModal').style.display = 'flex';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById('webcam').srcObject = stream;
    estadoSistema.streamWebcam = stream;
  } catch (err) {
    alert("Erro ao conectar a webcam: " + err.message);
  }
}

function fecharCamera() {
  document.getElementById('cameraModal').style.display = 'none';
  clearInterval(intervaloReconhecimento);
  if (estadoSistema.streamWebcam) {
    estadoSistema.streamWebcam.getTracks().forEach(t => t.stop());
  }
}

function adicionarLog(msg) {
  const feed = document.getElementById('logFeed');
  const hora = new Date().toLocaleTimeString().substring(0, 5);
  const div = document.createElement('div');
  div.className = 'log-item';
  div.innerHTML = `<small>${hora}</small><span>${msg}</span>`;
  feed.prepend(div);
}

// ==========================================
// 💬 5. CHATBOT INTERATIVO NLP
// ==========================================
function verificarEnter(event) {
  if (event.key === 'Enter') enviarMensagem();
}

function enviarMensagem() {
  const input = document.getElementById('chatInput');
  const mensagem = input.value.trim().toLowerCase();
  
  if (mensagem === '') return;

  adicionarMensagemChat(input.value, 'user-msg');
  input.value = '';

  setTimeout(() => processarIntencaoBot(mensagem), 500);
}

function processarIntencaoBot(msg) {
  let resposta = "Desculpe, não entendi o comando. Tente perguntar sobre o 'risco', 'sensores' ou pedir para 'trancar a porta'.";

  if (msg.includes('risco') || msg.includes('status') || msg.includes('segura')) {
    const riscoAtual = document.getElementById('riskValue').innerText;
    resposta = `O nível de risco atual da casa é de ${riscoAtual}. ${estadoSistema.portaPrincipal ? "Atenção: A porta principal está aberta." : "Os acessos principais estão seguros."}`;
  } 
  else if (msg.includes('trancar') || msg.includes('fechar') && msg.includes('porta')) {
    if (estadoSistema.portaPrincipal) {
      togglePorta();
      resposta = "Comando aceito. A porta principal foi trancada remotamente.";
    } else {
      resposta = "A porta principal já se encontra trancada.";
    }
  }
  else if (msg.includes('polícia') || msg.includes('socorro') || msg.includes('190')) {
    discarEmergencia('190 (POLÍCIA MILITAR)', 'Acionamento via Assistente de Voz');
    resposta = "Alerta de emergência ativado! Entrando em contato com a Polícia Militar imediatamente.";
  }

  adicionarMensagemChat(resposta, 'system-msg');
}

function adicionarMensagemChat(texto, classe) {
  const chatHistory = document.getElementById('chatHistory');
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${classe}`;
  msgDiv.innerText = texto;
  chatHistory.appendChild(msgDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ==========================================
// 🔌 6. INTEGRAÇÃO COM O BACK-END
// ==========================================
const backendLogsRenderizados = new Set();

function atualizarEstadoBackend(online, totalLogs = null) {
  const chip = document.getElementById('backendChip');
  const status = document.getElementById('backendStatusText');
  const count = document.getElementById('backendEventCount');
  const label = document.getElementById('backendConnectionLabel');

  if (chip) {
    chip.classList.remove('online', 'offline');
    chip.classList.add(online ? 'online' : 'offline');
  }

  if (status) status.textContent = online ? 'Online' : 'Offline';
  if (count && totalLogs !== null) count.textContent = totalLogs;
  if (label) label.textContent = online ? 'Conexão estável • porta 3001' : 'Servidor indisponível';
}

function renderizarLogsBackend(logs = []) {
  const feed = document.getElementById('logFeed');
  if (!feed) return;

  [...logs].reverse().forEach(log => {
    if (backendLogsRenderizados.has(log.id)) return;
    backendLogsRenderizados.add(log.id);

    const div = document.createElement('div');
    div.className = 'log-item backend-log';
    const hora = (log.timestamp || new Date().toLocaleTimeString()).substring(0, 5);
    div.innerHTML = `<small>${hora}</small><span><strong>${log.tipo}</strong> — ${log.status}</span>`;
    feed.prepend(div);
  });
}

async function verificarBackend(renderizar = true) {
  try {
    const resposta = await fetch('http://localhost:3001/api/status');
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

    const dados = await resposta.json();
    atualizarEstadoBackend(true, dados.totalLogs);
    if (renderizar) renderizarLogsBackend(dados.logs);
    console.log('Backend conectado:', dados);
    return dados;
  } catch (erro) {
    atualizarEstadoBackend(false);
    console.warn('Back-end indisponível. O painel continuará funcionando em modo local.', erro);
    return null;
  }
}

async function enviarEventoBackend(tipo, status) {
  try {
    const resposta = await fetch('http://localhost:3001/api/evento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, status })
    });

    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const dados = await resposta.json();

    if (dados.log?.id) backendLogsRenderizados.add(dados.log.id);
    console.log('Evento enviado ao backend:', dados);
    await verificarBackend(false);
    return dados;
  } catch (erro) {
    atualizarEstadoBackend(false);
    console.warn('Evento mantido apenas no front-end porque o back-end está offline.', erro);
    return null;
  }
}

// Inicialização do painel
window.addEventListener('load', () => {
  carregarModelosIA();
  verificarBackend();
});
