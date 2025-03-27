/**
 * UI Service for managing the user interface
 */
class UiService {
  constructor() {
    this.pages = ['dashboard', 'bots', 'portfolio', 'settings'];
    this.currentPage = 'dashboard';
    this.modals = {};
    this.botCards = new Map();
    this.notifications = []; // Array per tenere traccia delle notifiche attive
    this.notificationCount = 0; // Contatore per ID univoci

    // Initialize navigation
    this.initNavigation();

    // Initialize modals
    this.initModals();

    // Initialize sidebar toggle for mobile
    this.initSidebarToggle();
    console.log("UiService initialized"); // Added log
  }

  /**
   * Initialize navigation
   */
  initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-page], a[data-page]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateTo(page);
      });
    });
  }

  /**
   * Initialize modals
   */
  initModals() {
    // Get all modal elements
    const createBotModal = document.getElementById('createBotModal');
    const botDetailsModal = document.getElementById('botDetailsModal');

    // Store modal references
    this.modals = {
      createBotModal,
      botDetailsModal
    };

    // Add event listeners to close buttons
    const closeButtons = document.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modal = button.closest('[id$="Modal"]');
        if (modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        const modalId = e.target.querySelector('[id$="Modal"]')?.id;
        if (modalId) {
          this.hideModal(modalId);
        }
      }
    });
  }

  /**
   * Initialize sidebar toggle for mobile
   */
  initSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
      });
    }
  }

  /**
   * Navigate to a specific page
   * @param {string} page - Page name
   */
  navigateTo(page) {
    if (!this.pages.includes(page)) return;

    // Hide all pages
    document.querySelectorAll('.page-content').forEach(pageEl => {
      pageEl.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`${page}Page`).classList.add('active');

    // Update navigation
    document.querySelectorAll('[data-page]').forEach(link => {
      link.classList.remove('bg-primary-50', 'dark:bg-primary-900/50', 'text-primary-700', 'dark:text-primary-300');
    });

    document.querySelector(`[data-page="${page}"]`).classList.add(
      'bg-primary-50', 'dark:bg-primary-900/50', 'text-primary-700', 'dark:text-primary-300'
    );

    this.currentPage = page;

    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      document.getElementById('sidebar').classList.add('-translate-x-full');
    }
  }

  /**
   * Show a modal
   * @param {string} modalId - Modal ID
   */
  showModal(modalId) {
    if (this.modals[modalId]) {
      this.modals[modalId].classList.remove('hidden');
      // Add a small delay to trigger the animation
      setTimeout(() => {
        this.modals[modalId].querySelector('.inline-block').classList.add('scale-100');
        this.modals[modalId].querySelector('.inline-block').classList.remove('scale-95');
      }, 10);
    }
  }

  /**
   * Show a notification toast
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, danger, warning, info)
   */
  showNotification(message, type = 'success') {
    console.log("Showing notification", message, type);

    // Genera un ID univoco per questa notifica
    const notificationId = `notification-${this.notificationCount++}`;

    // Crea un nuovo elemento di notifica
    const notificationContainer = document.createElement('div');
    notificationContainer.id = notificationId;
    notificationContainer.className = 'notification-item mb-3';

    // Clona il template della notifica
    const template = document.getElementById('notificationToast');
    const notificationElement = template.cloneNode(true);
    notificationElement.id = `toast-${notificationId}`;
    notificationElement.classList.remove('hidden');

    // Imposta il messaggio
    const messageEl = notificationElement.querySelector('#notificationMessage');
    messageEl.id = `message-${notificationId}`;
    messageEl.textContent = message;

    // Aggiorna l'icona e il colore in base al tipo
    const toastInner = notificationElement.querySelector('.border-l-4');
    const icon = notificationElement.querySelector('.bi');

    toastInner.classList.remove('border-primary-500', 'border-green-500', 'border-red-500', 'border-yellow-500', 'border-blue-500');
    icon.classList.remove('bi-info-circle', 'bi-check-circle', 'bi-exclamation-triangle', 'bi-x-circle', 'text-primary-500', 'text-green-500', 'text-red-500', 'text-yellow-500', 'text-blue-500');

    switch (type) {
      case 'success':
        toastInner.classList.add('border-green-500');
        icon.classList.add('bi-check-circle', 'text-green-500');
        break;
      case 'danger':
      case 'error':
        toastInner.classList.add('border-red-500');
        icon.classList.add('bi-x-circle', 'text-red-500');
        break;
      case 'warning':
        toastInner.classList.add('border-yellow-500');
        icon.classList.add('bi-exclamation-triangle', 'text-yellow-500');
        break;
      case 'info':
      default:
        toastInner.classList.add('border-blue-500');
        icon.classList.add('bi-info-circle', 'text-blue-500');
        break;
    }

    // Aggiungi gestore per il pulsante di chiusura
    const closeBtn = notificationElement.querySelector('#closeNotification');
    closeBtn.id = `close-${notificationId}`;
    closeBtn.addEventListener('click', () => this.removeNotification(notificationId));

    // Aggiungi la notifica al container
    notificationContainer.appendChild(notificationElement);

    // Crea il container principale se non esiste
    let notificationsContainer = document.getElementById('notificationsContainer');
    if (!notificationsContainer) {
      notificationsContainer = document.createElement('div');
      notificationsContainer.id = 'notificationsContainer';
      notificationsContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col-reverse space-y-reverse space-y-3';
      document.body.appendChild(notificationsContainer);
    }

    // Aggiungi la notifica al container principale (all'inizio per averla in basso)
    notificationsContainer.appendChild(notificationContainer);

    // Aggiungi alla lista di notifiche attive
    this.notifications.push({
      id: notificationId,
      timeout: setTimeout(() => this.removeNotification(notificationId), 5000)
    });
  }

  /**
   * Remove a specific notification
   * @param {string} notificationId - ID of the notification to remove
   */
  removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
      // Animazione di fade-out
      notification.classList.add('opacity-0');
      setTimeout(() => {
        notification.remove();

        // Rimuovi dalla lista di notifiche attive
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          clearTimeout(this.notifications[index].timeout);
          this.notifications.splice(index, 1);
        }

        // Rimuovi il container se non ci sono più notifiche
        if (this.notifications.length === 0) {
          const container = document.getElementById('notificationsContainer');
          if (container && container.childNodes.length === 0) {
            container.remove();
          }
        }
      }, 300);
    }
  }

  /**
   * Hide all notifications
   */
  hideNotification() {
    // Rimuovi tutte le notifiche attive
    this.notifications.forEach(notification => {
      clearTimeout(notification.timeout);
      const element = document.getElementById(notification.id);
      if (element) element.remove();
    });

    this.notifications = [];

    // Rimuovi il container
    const container = document.getElementById('notificationsContainer');
    if (container) container.remove();
  }

  /**
   * Hide notification toast
   */
  hideNotification() {
    const toast = document.getElementById('notificationToast');
    toast.classList.add('hidden');

    // Clear timeout if exists
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
  }

  /**
   * Show loading spinner
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {

    const spinner = document.getElementById('loadingSpinner');
    const messageEl = spinner.querySelector('p');

    // Set message
    messageEl.textContent = message;

    // Show spinner
    spinner.classList.remove('hidden');
  }

  /**
   * Hide loading spinner
   */
  hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    spinner.classList.add('hidden');
  }

  /**
   * Hide a modal
   * @param {string} modalId - Modal ID
   */
  hideModal(modalId) {
    if (this.modals[modalId]) {
      const modalElement = this.modals[modalId];
      const modalContent = modalElement.querySelector('.inline-block');

      modalContent.classList.remove('scale-100');
      modalContent.classList.add('scale-95');

      // Add a small delay to allow the animation to complete
      setTimeout(() => {
        modalElement.classList.add('hidden');
      }, 300);
    }
  }

  // Update the updateStrategyParams method in the UiService class
  updateStrategyParams(strategy) {
    const container = document.getElementById('strategyParams');
    container.innerHTML = '';

    // Add strategy description if a strategy is selected
    if (strategy) {
      const descriptionHTML = getStrategyDescription(strategy);
      container.innerHTML = `
        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
          ${descriptionHTML}
        </div>
      `;
    }

    switch (strategy) {
      case 'sma':
        container.innerHTML += `
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="shortPeriod" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo Breve</label>
              <input type="number" id="shortPeriod" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="9" min="2" required>
              <div class="text-xs text-gray-500 mt-1" title="Numero di periodi per calcolare la media mobile a breve termine. Valori più bassi reagiscono più velocemente ai cambiamenti di prezzo.">Numero di periodi per la media mobile a breve termine.</div>
            </div>
            <div>
              <label for="longPeriod" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo Lungo</label>
              <input type="number" id="longPeriod" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="21" min="5" required>
              <div class="text-xs text-gray-500 mt-1" title="Numero di periodi per calcolare la media mobile a lungo termine. Valori più alti forniscono segnali più stabili ma meno reattivi.">Numero di periodi per la media mobile a lungo termine.</div>
            </div>
          </div>
        `;
        break;
      case 'rsi':
        container.innerHTML += `
          <div>
            <label for="rsiPeriod" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo RSI</label>
            <input type="number" id="rsiPeriod" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="14" min="2" required>
            <div class="text-xs text-gray-500 mt-1" title="Numero di periodi utilizzati per calcolare l'RSI. Il valore standard è 14, valori più bassi rendono l'indicatore più sensibile.">Numero di periodi per calcolare l'RSI.</div>
          </div>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label for="oversold" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Livello Ipervenduto</label>
              <input type="number" id="oversold" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="30" min="1" max="49" required>
              <div class="text-xs text-gray-500 mt-1" title="Quando l'RSI scende sotto questo valore, il mercato è considerato ipervenduto e potrebbe essere un buon momento per comprare.">Soglia sotto la quale il bot considera il mercato ipervenduto (segnale di acquisto).</div>
            </div>
            <div>
              <label for="overbought" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Livello Ipercomprato</label>
              <input type="number" id="overbought" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="70" min="51" max="99" required>
              <div class="text-xs text-gray-500 mt-1" title="Quando l'RSI sale sopra questo valore, il mercato è considerato ipercomprato e potrebbe essere un buon momento per vendere.">Soglia sopra la quale il bot considera il mercato ipercomprato (segnale di vendita).</div>
            </div>
          </div>
        `;
        break;
      case 'macd':
        container.innerHTML += `
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="fastPeriod" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo Veloce</label>
              <input type="number" id="fastPeriod" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="12" min="2" required>
              <div class="text-xs text-gray-500 mt-1" title="Numero di periodi per la media mobile veloce. Valori standard: 12.">Periodi per la media mobile veloce.</div>
            </div>
            <div>
              <label for="slowPeriod" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo Lento</label>
              <input type="number" id="slowPeriod" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="26" min="5" required>
              <div class="text-xs text-gray-500 mt-1" title="Numero di periodi per la media mobile lenta. Valori standard: 26.">Periodi per la media mobile lenta.</div>
            </div>
            <div>
              <label for="signalPeriod" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo Segnale</label>
              <input type="number" id="signalPeriod" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="9" min="2" required>
              <div class="text-xs text-gray-500 mt-1" title="Numero di periodi per la linea del segnale. Valori standard: 9.">Periodi per la linea del segnale.</div>
            </div>
          </div>
        `;
        break;
    }
  }

  updatePortfolioAssets(assets) {
    const container = document.getElementById('assetsList');

    if (!assets || assets.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">Nessun asset trovato</td>
        </tr>
      `;
      return;
    }

    let html = '';

    assets.forEach(asset => {
      const changeClass = asset.change >= 0 ? 'success' : 'danger';

      html += `
        <tr>
          <td>
            <strong>${asset.symbol}</strong>
          </td>
          <td>${asset.balance.toFixed(8)}</td>
          <td>€${asset.value.toFixed(2)}</td>
          <td>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar bg-primary" role="progressbar" style="width: ${asset.allocation}%"></div>
            </div>
            <small>${asset.allocation.toFixed(2)}%</small>
          </td>
          <td class="text-${changeClass}">
            ${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%
          </td>
        </tr>
      `;
    });

    console.log(html)

    container.innerHTML = html;
  }
}

// Initialize UI service
const uiService = new UiService();

/**
 * Get description for a trading strategy
 * @param {string} strategy - Strategy type
 * @returns {string} - HTML description
 */
function getStrategyDescription(strategy) {
  if (!strategy) return '';

  const descriptions = {
    'sma': `
      <h4 class="text-sm font-medium text-gray-800 dark:text-white mb-2">Media Mobile Semplice (SMA)</h4>
      <p class="text-xs text-gray-600 dark:text-gray-300">
        Questa strategia confronta due medie mobili: una a breve termine e una a lungo termine. 
        Quando la media a breve termine supera quella a lungo termine, è un segnale di acquisto. 
        Quando scende sotto, è un segnale di vendita. È una strategia semplice e adatta ai principianti, 
        che funziona bene in mercati con trend definiti.
        <a href="https://www.investopedia.com/terms/s/sma.asp" target="_blank" class="text-primary-600 hover:underline ml-1">
          Scopri di più <i class="bi bi-box-arrow-up-right text-xs"></i>
        </a>
      </p>
    `,
    'rsi': `
      <h4 class="text-sm font-medium text-gray-800 dark:text-white mb-2">Indice di Forza Relativa (RSI)</h4>
      <p class="text-xs text-gray-600 dark:text-gray-300">
        L'RSI misura la velocità e il cambiamento dei movimenti di prezzo. Varia da 0 a 100. 
        Un valore sopra 70 indica che la criptovaluta è "ipercomprata" (potenziale segnale di vendita), 
        mentre sotto 30 è "ipervenduta" (potenziale segnale di acquisto). 
        È utile per identificare possibili inversioni di prezzo.
        <a href="https://www.investopedia.com/terms/r/rsi.asp" target="_blank" class="text-primary-600 hover:underline ml-1">
          Scopri di più <i class="bi bi-box-arrow-up-right text-xs"></i>
        </a>
      </p>
    `,
    'macd': `
      <h4 class="text-sm font-medium text-gray-800 dark:text-white mb-2">MACD (Moving Average Convergence Divergence)</h4>
      <p class="text-xs text-gray-600 dark:text-gray-300">
        Il MACD combina più medie mobili per identificare cambiamenti di momentum e direzione. 
        Quando la linea MACD supera la linea del segnale, è un segnale di acquisto. 
        Quando scende sotto, è un segnale di vendita. 
        È una strategia versatile che funziona in diversi tipi di mercato.
        <a href="https://www.investopedia.com/terms/m/macd.asp" target="_blank" class="text-primary-600 hover:underline ml-1">
          Scopri di più <i class="bi bi-box-arrow-up-right text-xs"></i>
        </a>
      </p>
    `
  };

  return descriptions[strategy] || '';
}
