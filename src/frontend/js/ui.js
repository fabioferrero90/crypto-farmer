/**
 * UI Service for managing the user interface
 */
class UiService {
  constructor() {
    this.pages = ['dashboard', 'bots', 'portfolio', 'settings'];
    this.currentPage = 'dashboard';
    this.modals = {};
    this.botCards = new Map();

    // Initialize Bootstrap modals
    this.initModals();

    // Initialize navigation
    this.initNavigation();
  }

  /**
   * Initialize Bootstrap modals
   */
  initModals() {
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modalEl => {
      const modalId = modalEl.id;
      this.modals[modalId] = new bootstrap.Modal(modalEl);
    });
  }

  /**
   * Initialize navigation
   */
  initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateTo(page);
      });
    });
  }

  /**
   * Navigate to a page
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
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`.nav-link[data-page="${page}"]`).classList.add('active');

    this.currentPage = page;
  }

  /**
   * Show a modal
   * @param {string} modalId - Modal ID
   */
  showModal(modalId) {
    if (this.modals[modalId]) {
      this.modals[modalId].show();
    }
  }

  /**
   * Hide a modal
   * @param {string} modalId - Modal ID
   */
  hideModal(modalId) {
    if (this.modals[modalId]) {
      this.modals[modalId].hide();
    }
  }

  /**
   * Show loading spinner
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    // Create spinner overlay if it doesn't exist
    if (!document.getElementById('loadingSpinner')) {
      const spinnerHtml = `
        <div id="loadingSpinner" class="spinner-overlay">
          <div class="spinner-container">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2" id="loadingMessage">${message}</p>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', spinnerHtml);
    } else {
      document.getElementById('loadingMessage').textContent = message;
      document.getElementById('loadingSpinner').style.display = 'flex';
    }
  }

  /**
   * Hide loading spinner
   */
  hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  }

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, danger, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  showNotification(message, type = 'success', duration = 3000) {
    // Create notifications container if it doesn't exist
    if (!document.getElementById('notificationsContainer')) {
      const containerHtml = `
        <div id="notificationsContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>
      `;
      document.body.insertAdjacentHTML('beforeend', containerHtml);
    }

    const container = document.getElementById('notificationsContainer');
    const id = Date.now();

    const notificationHtml = `
      <div id="notification-${id}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', notificationHtml);

    const toastElement = document.getElementById(`notification-${id}`);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: duration });
    toast.show();

    // Remove the element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  /**
   * Update dashboard stats
   * @param {object} stats - Dashboard statistics
   */
  updateDashboardStats(stats) {
    if (stats.totalBalance !== undefined) {
      document.getElementById('totalBalance').textContent = `$${stats.totalBalance.toFixed(2)}`;
    }

    if (stats.balanceChange !== undefined) {
      const balanceChangeEl = document.getElementById('balanceChange');
      balanceChangeEl.textContent = `${stats.balanceChange > 0 ? '+' : ''}${stats.balanceChange.toFixed(2)}%`;
      balanceChangeEl.className = stats.balanceChange >= 0 ? 'text-success-light' : 'text-danger-light';
    }

    if (stats.activeBots !== undefined) {
      document.getElementById('activeBots').textContent = stats.activeBots;
    }

    if (stats.totalProfit !== undefined) {
      document.getElementById('totalProfit').textContent = `$${stats.totalProfit.toFixed(2)}`;
    }

    if (stats.profitChange !== undefined) {
      const profitChangeEl = document.getElementById('profitChange');
      profitChangeEl.textContent = `${stats.profitChange > 0 ? '+' : ''}${stats.profitChange.toFixed(2)}%`;
      profitChangeEl.className = stats.profitChange >= 0 ? 'text-success-light' : 'text-danger-light';
    }
  }

  /**
   * Update recent trades list
   * @param {Array} trades - Recent trades
   */
  updateRecentTrades(trades) {
    const container = document.getElementById('recentTrades');

    if (!trades || trades.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted py-3">
          <i class="bi bi-clock-history fs-4 d-block mb-2"></i>
          Nessuna operazione recente
        </div>
      `;
      return;
    }

    let html = '';

    trades.forEach(trade => {
      const isProfit = trade.profit > 0;
      const tradeType = trade.type === 'buy' ? 'Acquistato' : 'Venduto';
      const tradeClass = trade.type === 'buy' ? 'buy' : 'sell';
      const profitClass = isProfit ? 'text-success' : 'text-danger';

      html += `
        <div class="list-group-item trade-item ${tradeClass}">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">${tradeType} ${trade.amount} ${trade.symbol.replace('USDT', '')}</h6>
            <small>${this.formatDate(trade.timestamp)}</small>
          </div>
          <p class="mb-1">Prezzo: €${trade.price.toFixed(2)}</p>
          ${trade.profit !== undefined ? `<small class="${profitClass}">Profitto: ${isProfit ? '+' : ''}€${trade.profit.toFixed(2)}</small>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Update bots list
   * @param {Array} bots - Bots list
   */
  updateBotsList(bots) {
    const container = document.getElementById('botsList');
    const noBotsMessage = document.getElementById('noBotsMessage');

    if (!bots || bots.length === 0) {
      noBotsMessage.style.display = 'block';
      container.innerHTML = '';
      return;
    }

    noBotsMessage.style.display = 'none';
    let html = '';

    bots.forEach(bot => {
      const isRunning = bot.isRunning;
      const statusClass = isRunning ? 'active' : 'inactive';
      const statusText = isRunning ? 'In esecuzione' : 'Fermo';

      html += `
        <div class="col-md-4 mb-4">
          <div class="card bot-card h-100" data-bot-id="${bot.id}">
            <div class="card-header">
              <h5 class="mb-0">${bot.symbol}</h5>
              <span class="badge bg-${isRunning ? 'success' : 'danger'}">
                <span class="bot-status ${statusClass}"></span>
                ${statusText}
              </span>
            </div>
            <div class="card-body">
              <p class="card-text">Strategy: ${bot.strategy}</p>
              <p class="card-text">Abilitato: ${bot.enabled ? 'Sì' : 'No'}</p>
              <button class="btn btn-sm btn-primary view-bot-btn" data-bot-id="${bot.id}">
                Visualizza Dettagli
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Show bot details
   * @param {string} botId - Bot ID
   */
  async showBotDetails(botId) {
    this.showLoading('Loading bot details...');

    try {
      const botDetails = await apiService.getBotDetails(botId);
      const container = document.getElementById('botDetailsContent');

      const isRunning = botDetails.isRunning;
      const statusClass = isRunning ? 'success' : 'danger';
      const statusText = isRunning ? 'Running' : 'Stopped';

      let html = `
        <div class="row mb-4">
          <div class="col-md-6">
            <h5>Bot Information</h5>
            <table class="table">
              <tr>
                <th>ID</th>
                <td>${botDetails.id}</td>
              </tr>
              <tr>
                <th>Symbol</th>
                <td>${botDetails.symbol}</td>
              </tr>
              <tr>
                <th>Strategy</th>
                <td>${botDetails.strategy}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td><span class="badge bg-${statusClass}">${statusText}</span></td>
              </tr>
            </table>
          </div>
          <div class="col-md-6">
            <h5>Configuration</h5>
            <table class="table">
              <tr>
                <th>Interval</th>
                <td>${botDetails.config.interval}</td>
              </tr>
              <tr>
                <th>Amount</th>
                <td>${botDetails.config.amount}</td>
              </tr>
              <tr>
                <th>Stop Loss</th>
                <td>${botDetails.config.stopLoss * 100}%</td>
              </tr>
              <tr>
                <th>Take Profit</th>
                <td>${botDetails.config.takeProfit * 100}%</td>
              </tr>
            </table>
          </div>
        </div>
      `;

      // Add positions if any
      if (botDetails.positions && botDetails.positions.length > 0) {
        html += `
          <div class="row mb-4">
            <div class="col-12">
              <h5>Open Positions</h5>
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Entry Price</th>
                      <th>Current Price</th>
                      <th>Stop Loss</th>
                      <th>Take Profit</th>
                      <th>Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
        `;

        botDetails.positions.forEach(position => {
          const currentPrice = botDetails.lastUpdate ? botDetails.lastUpdate.close : position.price;
          const profitLoss = (currentPrice - position.price) * position.amount;
          const profitLossPercent = ((currentPrice - position.price) / position.price) * 100;
          const profitClass = profitLoss >= 0 ? 'success' : 'danger';

          html += `
            <tr>
              <td>${position.symbol}</td>
              <td>${position.type}</td>
              <td>${position.amount}</td>
              <td>$${position.price.toFixed(2)}</td>
              <td>$${currentPrice.toFixed(2)}</td>
              <td>$${position.stopLoss.toFixed(2)}</td>
              <td>$${position.takeProfit.toFixed(2)}</td>
              <td class="text-${profitClass}">
                ${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)}
                (${profitLossPercent >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}%)
              </td>
            </tr>
          `;
        });

        html += `
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="row mb-4">
            <div class="col-12">
              <div class="alert alert-info">
                No open positions
              </div>
            </div>
          </div>
        `;
      }

      // Add last update if available
      if (botDetails.lastUpdate) {
        html += `
          <div class="row">
            <div class="col-12">
              <h5>Last Update</h5>
              <table class="table">
                <tr>
                  <th>Timestamp</th>
                  <td>${this.formatDate(botDetails.lastUpdate.timestamp)}</td>
                </tr>
                <tr>
                  <th>Price</th>
                  <td>$${botDetails.lastUpdate.close.toFixed(2)}</td>
                </tr>
                <tr>
                  <th>24h Change</th>
                  <td>${((botDetails.lastUpdate.close - botDetails.lastUpdate.open) / botDetails.lastUpdate.open * 100).toFixed(2)}%</td>
                </tr>
              </table>
            </div>
          </div>
        `;
      }

      container.innerHTML = html;

      // Update toggle button text
      const toggleBotBtn = document.getElementById('toggleBotBtn');
      toggleBotBtn.textContent = isRunning ? 'Stop Bot' : 'Start Bot';
      toggleBotBtn.className = `btn ${isRunning ? 'btn-danger' : 'btn-success'}`;
      toggleBotBtn.setAttribute('data-bot-id', botId);

      // Update delete button
      document.getElementById('deleteBotBtn').setAttribute('data-bot-id', botId);

      // Update update button
      document.getElementById('updateBotBtn').setAttribute('data-bot-id', botId);

      // Show the modal
      this.showModal('botDetailsModal');
    } catch (error) {
      this.showNotification(`Error loading bot details: ${error.message}`, 'danger');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Update portfolio assets
   * @param {Array} assets - Portfolio assets
   */
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

    container.innerHTML = html;
  }

  /**
   * Format date
   * @param {number} timestamp - Timestamp in milliseconds
   * @returns {string} - Formatted date
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Update strategy parameters form
   * @param {string} strategy - Strategy type
   */
  updateStrategyParams(strategy) {
    const container = document.getElementById('strategyParams');
    const descriptionContainer = document.getElementById('strategyDescription');

    // Update strategy description
    if (strategy) {
      let description = '';
      switch (strategy) {
        case 'sma':
          description = `<div class="alert alert-info">
            <h6>Strategia Incrocio SMA (Simple Moving Average)</h6>
            <p>Questa strategia utilizza due medie mobili semplici di periodi diversi (breve e lungo). 
            Genera un segnale di acquisto quando la media mobile breve incrocia al rialzo la media mobile lunga, 
            e un segnale di vendita quando la media mobile breve incrocia al ribasso la media mobile lunga. 
            È efficace in mercati con trend definiti ma può generare falsi segnali in mercati laterali.</p>
          </div>`;
          break;
        case 'rsi':
          description = `<div class="alert alert-info">
            <h6>Strategia RSI (Relative Strength Index)</h6>
            <p>L'RSI è un oscillatore di momentum che misura la velocità e il cambiamento dei movimenti di prezzo. 
            Varia da 0 a 100 e viene utilizzato per identificare condizioni di ipercomprato (sopra 70) o ipervenduto (sotto 30). 
            La strategia genera segnali di acquisto quando l'RSI esce dalla zona di ipervenduto e segnali di vendita 
            quando esce dalla zona di ipercomprato. È particolarmente efficace in mercati laterali o in range.</p>
          </div>`;
          break;
        case 'macd':
          description = `<div class="alert alert-info">
            <h6>Strategia MACD (Moving Average Convergence Divergence)</h6>
            <p>Il MACD è un indicatore di trend che mostra la relazione tra due medie mobili esponenziali. 
            È composto da una linea MACD (differenza tra EMA veloce e lenta), una linea di segnale (EMA della linea MACD) 
            e un istogramma. Genera segnali di acquisto quando la linea MACD incrocia al rialzo la linea di segnale, 
            e segnali di vendita quando incrocia al ribasso. È utile per identificare cambiamenti di momentum, 
            direzione e forza del trend.</p>
          </div>`;
          break;
      }
      descriptionContainer.innerHTML = description;
    } else {
      descriptionContainer.innerHTML = '';
    }

    if (!strategy) {
      container.innerHTML = '';
      return;
    }

    let html = '<h6 class="mt-3 mb-3">Parametri Strategia</h6>';

    switch (strategy) {
      case 'sma':
        html += `
          <div class="row mb-3">
            <div class="col-md-6">
              <label for="shortPeriod" class="form-label">Periodo Breve</label>
              <input type="number" class="form-control" id="shortPeriod" value="9" min="2" max="50">
              <small class="form-text text-muted">Numero di candele per calcolare la media mobile breve. Valori più bassi reagiscono più velocemente ai cambiamenti di prezzo.</small>
            </div>
            <div class="col-md-6">
              <label for="longPeriod" class="form-label">Periodo Lungo</label>
              <input type="number" class="form-control" id="longPeriod" value="21" min="5" max="200">
              <small class="form-text text-muted">Numero di candele per calcolare la media mobile lunga. Valori più alti forniscono segnali più affidabili ma meno frequenti.</small>
            </div>
          </div>
        `;
        break;
      case 'rsi':
        html += `
          <div class="row mb-3">
            <div class="col-md-4">
              <label for="rsiPeriod" class="form-label">Periodo RSI</label>
              <input type="number" class="form-control" id="rsiPeriod" value="14" min="2" max="50">
              <small class="form-text text-muted">Numero di candele utilizzate per calcolare l'RSI. Il valore standard è 14, valori più bassi aumentano la sensibilità.</small>
            </div>
            <div class="col-md-4">
              <label for="overbought" class="form-label">Livello Ipercomprato</label>
              <input type="number" class="form-control" id="overbought" value="70" min="50" max="90">
              <small class="form-text text-muted">Soglia sopra la quale il mercato è considerato ipercomprato. Valori standard: 70-80.</small>
            </div>
            <div class="col-md-4">
              <label for="oversold" class="form-label">Livello Ipervenduto</label>
              <input type="number" class="form-control" id="oversold" value="30" min="10" max="50">
              <small class="form-text text-muted">Soglia sotto la quale il mercato è considerato ipervenduto. Valori standard: 20-30.</small>
            </div>
          </div>
        `;
        break;
      case 'macd':
        html += `
          <div class="row mb-3">
            <div class="col-md-4">
              <label for="fastPeriod" class="form-label">Periodo Veloce</label>
              <input type="number" class="form-control" id="fastPeriod" value="12" min="2" max="50">
              <small class="form-text text-muted">Periodo per la media mobile esponenziale veloce. Valori più bassi reagiscono più rapidamente ai cambiamenti di prezzo.</small>
            </div>
            <div class="col-md-4">
              <label for="slowPeriod" class="form-label">Periodo Lento</label>
              <input type="number" class="form-control" id="slowPeriod" value="26" min="5" max="100">
              <small class="form-text text-muted">Periodo per la media mobile esponenziale lenta. Valori più alti forniscono una visione più stabile del trend.</small>
            </div>
            <div class="col-md-4">
              <label for="signalPeriod" class="form-label">Periodo Segnale</label>
              <input type="number" class="form-control" id="signalPeriod" value="9" min="2" max="50">
              <small class="form-text text-muted">Periodo per la linea di segnale (EMA della linea MACD). Determina la sensibilità dei segnali di trading.</small>
            </div>
          </div>
        `;
        break;
    }

    // Add explanations for common bot settings
    html += `
      <div class="mt-4 mb-3">
        <h6>Parametri Generali del Bot</h6>
        <div class="alert alert-light border">
          <p class="mb-2"><strong>Coppia di Trading:</strong> La coppia di criptovalute su cui il bot opererà (es. BTC/USDT).</p>
          <p class="mb-2"><strong>Intervallo:</strong> L'intervallo di tempo tra le candele utilizzate per l'analisi (es. 1m, 5m, 1h, 1d).</p>
          <p class="mb-2"><strong>Importo:</strong> La quantità di criptovaluta da acquistare/vendere in ogni operazione.</p>
          <p class="mb-2"><strong>Stop Loss:</strong> Percentuale di perdita massima consentita prima di chiudere automaticamente una posizione per limitare le perdite.</p>
          <p class="mb-0"><strong>Take Profit:</strong> Percentuale di guadagno desiderata per chiudere automaticamente una posizione e realizzare il profitto.</p>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}

// Create global UI service instance
const uiService = new UiService();