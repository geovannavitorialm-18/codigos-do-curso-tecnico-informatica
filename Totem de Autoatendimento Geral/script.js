/* ==========================================================================
   LÓGICA E NAVEGAÇÃO DO TOTEM (UBS PALMITAL DE MINAS)
   ========================================================================== */

let navigationHistory = ['screen-welcome'];
let currentScreenId = 'screen-welcome';
let ttsEnabled = true;
let currentFontSize = 16;
let returnTimer = null;

let ticketCounters = {
  CON: 1,
  VAC: 1,
  ENF: 1,
  PRE: 1
};

const screenSpeechTexts = {
  'screen-welcome': 'Bem vindo à Unidade Básica de Saúde de Palmital de Minas. Toque em iniciar atendimento.',
  'screen-menu': 'Menu principal. Escolha uma das opções na tela.',
  'screen-consultas': 'Consultas Médicas. Apresente-se com 15 minutos de antecedência.',
  'screen-vacinacao': 'Sala de Vacinação. Lembre-se de trazer sua carteira de vacinas.',
  'screen-enfermagem': 'Enfermagem e Triagem. Aferição de pressão e exames rápidos.',
  'screen-prenatal': 'Atendimento Pré-Natal prioritário.',
  'screen-documentos': 'Documentos Necessários. Traga documento com foto e cartão do SUS.',
  'screen-localizacao': 'Localização dos Setores da UBS.',
  'screen-ajuda': 'Ajuda e Dúvidas. Fale com a recepção.',
  'screen-ticket': 'Senha gerada com sucesso. Aguarde na sala de espera.',
  'screen-end': 'Obrigado por utilizar nosso autoatendimento.'
};

// Executa após a página estar totalmente pronta no navegador
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  setupAllButtons();
  speakText(screenSpeechTexts['screen-welcome']);
});

/* ==========================================================================
   CONFIGURAÇÃO DOS CLIQUES DOS BOTÕES
   ========================================================================== */
function setupAllButtons() {
  // Botão "Iniciar Atendimento"
  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => navigateTo('screen-menu'));
  }

  // Cards do Menu Principal
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-target');
      if (target) navigateTo(target);
    });
  });

  // Botões de Emissão de Senhas
  document.querySelectorAll('.btn-emit-ticket').forEach(btn => {
    btn.addEventListener('click', () => {
      const service = btn.getAttribute('data-service');
      const prefix = btn.getAttribute('data-prefix');
      generateTicket(service, prefix);
    });
  });

  // Botão Concluir na tela da senha
  const btnFinishTicket = document.getElementById('btn-finish-ticket');
  if (btnFinishTicket) {
    btnFinishTicket.addEventListener('click', () => navigateTo('screen-end'));
  }

  // Botões de Voltar ao Início
  const btnEndHome = document.getElementById('btn-end-home');
  if (btnEndHome) {
    btnEndHome.addEventListener('click', resetToHome);
  }

  const globalHomeBtn = document.getElementById('global-home-btn');
  if (globalHomeBtn) {
    globalHomeBtn.addEventListener('click', resetToHome);
  }

  // Botão Voltar
  const globalBackBtn = document.getElementById('global-back-btn');
  if (globalBackBtn) {
    globalBackBtn.addEventListener('click', goBack);
  }

  // Controles de Acessibilidade
  setupAccessibility();
}

/* ==========================================================================
   MUDANÇA DE TELAS
   ========================================================================== */

function navigateTo(targetScreenId, isGoingBack = false) {
  if (returnTimer) {
    clearInterval(returnTimer);
    returnTimer = null;
  }

  const currentScreen = document.getElementById(currentScreenId);
  const targetScreen = document.getElementById(targetScreenId);

  if (!targetScreen) return;

  if (!isGoingBack && currentScreenId !== targetScreenId) {
    navigationHistory.push(targetScreenId);
  }

  if (currentScreen) {
    currentScreen.classList.remove('active');
  }

  targetScreen.classList.add('active');
  currentScreenId = targetScreenId;

  updateFooterButtons();

  if (screenSpeechTexts[targetScreenId]) {
    speakText(screenSpeechTexts[targetScreenId]);
  }

  if (targetScreenId === 'screen-end') {
    startAutoReturnTimer();
  }
}

function goBack() {
  if (navigationHistory.length > 1) {
    navigationHistory.pop();
    const previousScreen = navigationHistory[navigationHistory.length - 1];
    navigateTo(previousScreen, true);
  } else {
    resetToHome();
  }
}

function resetToHome() {
  if (returnTimer) {
    clearInterval(returnTimer);
    returnTimer = null;
  }
  navigationHistory = ['screen-welcome'];
  navigateTo('screen-welcome', true);
}

function updateFooterButtons() {
  const backBtn = document.getElementById('global-back-btn');
  if (!backBtn) return;

  if (currentScreenId === 'screen-welcome' || currentScreenId === 'screen-end') {
    backBtn.classList.add('hidden');
  } else {
    backBtn.classList.remove('hidden');
  }
}

/* ==========================================================================
   GERAÇÃO DE SENHAS
   ========================================================================== */

function generateTicket(serviceName, prefix) {
  const num = ticketCounters[prefix] || 1;
  const formattedNumber = String(num).padStart(3, '0');
  const ticketCode = `${prefix}-${formattedNumber}`;
  
  ticketCounters[prefix] = num + 1;

  document.getElementById('ticket-service-name').innerText = serviceName;
  document.getElementById('ticket-code').innerText = ticketCode;

  const now = new Date();
  document.getElementById('ticket-time-stamp').innerText = `Emitido às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  navigateTo('screen-ticket');
}

/* ==========================================================================
   TEMPORIZADOR AUTOMÁTICO NA TELA FINAL
   ========================================================================== */

function startAutoReturnTimer() {
  let secondsLeft = 10;
  const timerDisplay = document.getElementById('countdown-timer');
  if (timerDisplay) timerDisplay.innerText = secondsLeft;

  returnTimer = setInterval(() => {
    secondsLeft -= 1;
    if (timerDisplay) timerDisplay.innerText = secondsLeft;

    if (secondsLeft <= 0) {
      clearInterval(returnTimer);
      returnTimer = null;
      resetToHome();
    }
  }, 1000);
}

/* ==========================================================================
   SINTETIZADOR DE VOZ E FONTE
   ========================================================================== */

function speakText(text) {
  if (!ttsEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function setupAccessibility() {
  const ttsBtn = document.getElementById('tts-toggle-btn');
  const ttsStatus = document.getElementById('tts-status');

  if (ttsBtn) {
    ttsBtn.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      if (ttsEnabled) {
        ttsStatus.innerText = 'LIGADA';
        speakText('Leitura por voz ativada');
      } else {
        ttsStatus.innerText = 'DESLIGADA';
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      }
    });
  }

  document.getElementById('font-increase')?.addEventListener('click', () => {
    if (currentFontSize < 22) {
      currentFontSize += 2;
      document.documentElement.style.fontSize = `${currentFontSize}px`;
    }
  });

  document.getElementById('font-decrease')?.addEventListener('click', () => {
    if (currentFontSize > 12) {
      currentFontSize -= 2;
      document.documentElement.style.fontSize = `${currentFontSize}px`;
    }
  });

  document.getElementById('font-reset')?.addEventListener('click', () => {
    currentFontSize = 16;
    document.documentElement.style.fontSize = '16px';
  });
}

/* ==========================================================================
   RELÓGIO EM TEMPO REAL
   ========================================================================== */

function initClock() {
  const clockEl = document.getElementById('current-clock');
  const dateEl = document.getElementById('current-date');

  function update() {
    const now = new Date();
    if (clockEl) clockEl.innerText = now.toLocaleTimeString('pt-BR');
    if (dateEl) dateEl.innerText = now.toLocaleDateString('pt-BR');
  }

  update();
  setInterval(update, 1000);
}