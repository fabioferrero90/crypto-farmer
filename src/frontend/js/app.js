/**
 * Main application class
 */
class App {
  constructor() {
    this.apiCredentials = {
      apiKey: '',
      secretKey: '',
      passphrase: ''
    };
    this.socket = null;
    this.bots = [];
    this.assets = [];
    this.performanceData = [];
    this.recentTrades = [];

    // Initialize the application
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    // Load saved credentials
    this.loadCredentials();

    // Initialize socket connection
    this.initSocket();

    // Initialize event listeners
    this.initEventListeners();

    // Load initial data
    await this.loadInitialData();
  }

  /**
   * Initialize socket connection
   */
  initSocket() {
    try {
      this.socket = io();

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('bot_update', (data) => {
        this.handleBotUpdate(data);
      });

      this.socket.on('trade', (data) => {
        this.handleTradeUpdate(data);
      });

      this.socket.on('error', (error) => {
        uiService.showNotification(`Socket error: ${error}`, 'danger');
      });
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Create bot button
    document.getElementById('createBotBtn').addEventListener('click', () => {
      uiService.showModal('createBotModal');
    });

    // New bot button
    document.getElementById('newBotBtn').addEventListener('click', () => {
      uiService.showModal('createBotModal');
    });

    // Save bot button
    document.getElementById('saveBotBtn').addEventListener('click', () => {
      this.createBot();
    });

    // Bot strategy selection
    document.getElementById('botStrategy').addEventListener('change', (e) => {
      uiService.updateStrategyParams(e.target.value);
    });

    // Bot symbol selection
    document.getElementById('botSymbol').addEventListener('change', (e) => {
      document.getElementById('amountSymbol').textContent = e.target.value.replace('USDT', '');
    });

    // Toggle bot button
    document.getElementById('toggleBotBtn').addEventListener('click', (e) => {
      const botId = e.target.getAttribute('data-bot-id');
      const bot = this.bots.find(b => b.id === botId);

      if (bot) {
        if (bot.isRunning) {
          this.stopBot(botId);
        } else {
          this.startBot(botId);
        }
      }
    });

    // Delete bot button
    document.getElementById('deleteBotBtn').addEventListener('click', (e) => {
      const botId = e.target.getAttribute('data-bot-id');

      if (confirm('Are you sure you want to delete this bot?')) {
        this.deleteBot(botId);
      }
    });

    // Update bot button
    document.getElementById('updateBotBtn').addEventListener('click', (e) => {
      const botId = e.target.getAttribute('data-bot-id');
      // TODO: Implement bot update functionality
      uiService.showNotification('Bot update functionality coming soon', 'info');
    });

    // Refresh bots button
    document.getElementById('refreshBotsBtn').addEventListener('click', () => {
      this.loadBots();
    });

    // Refresh portfolio button
    document.getElementById('refreshPortfolioBtn').addEventListener('click', () => {
      this.loadPortfolio();
    });

    // Navigation links
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.closest('.nav-link').getAttribute('data-page');
        this.navigateToPage(page);
      });
    });

    // Test API connection button
    document.getElementById('testApiBtn').addEventListener('click', () => {
      this.testApiConnection();
    });

    // Save settings button
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    // Refresh dashboard button
    document.querySelector('#dashboardPage .refresh-data').addEventListener('click', () => {
      this.loadDashboardData();
    });
  }

  /**
   * Navigate to a specific page
   * @param {string} page - Page name
   */
  navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(el => {
      el.classList.remove('active');
    });

    // Show selected page
    const pageElement = document.getElementById(`${page}Page`);
    if (pageElement) {
      pageElement.classList.add('active');
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(el => {
      el.classList.remove('active');
    });

    const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (navLink) {
      navLink.classList.add('active');
    }

    // Load page-specific data
    switch (page) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'bots':
        this.loadBots();
        break;
      case 'portfolio':
        this.loadPortfolio();
        break;
      case 'settings':
        // No data loading needed for settings
        break;
    }
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    try {
      // Check if API credentials are set
      if (this.hasApiCredentials()) {
        // Load dashboard data
        await this.loadDashboardData();

        // Load bots
        await this.loadBots();

        // Load portfolio
        await this.loadPortfolio();
      } else {
        // Navigate to settings page if no credentials are set
        uiService.navigateTo('settings');
        uiService.showNotification('Please set your API credentials', 'warning');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      uiService.showNotification('Failed to load initial data', 'danger');
    }
  }

  /**
   * Load dashboard data
   */
  async loadDashboardData() {
    if (!this.hasApiCredentials()) return;

    uiService.showLoading('Loading dashboard data...');

    try {
      // Load account info
      const accountInfo = await apiService.getAccountInfo(this.apiCredentials);

      if (accountInfo && accountInfo.data) {
        // Calculate total balance
        let totalBalance = 0;
        const assets = accountInfo.data.map(asset => {
          const value = parseFloat(asset.available) * parseFloat(asset.usdtRate);
          totalBalance += value;
          return {
            symbol: asset.coinName,
            balance: parseFloat(asset.available),
            value: value,
            change: Math.random() * 10 - 5 // Mock 24h change (replace with actual data)
          };
        });

        // Update dashboard stats
        uiService.updateDashboardStats({
          totalBalance: totalBalance,
          balanceChange: Math.random() * 10 - 5, // Mock 24h change (replace with actual data)
          activeBots: this.bots.filter(bot => bot.isRunning).length,
          totalProfit: Math.random() * 1000, // Mock total profit (replace with actual data)
          profitChange: Math.random() * 20 - 10 // Mock profit change (replace with actual data)
        });

        // Update assets
        this.assets = assets;

        // Generate mock performance data (replace with actual data)
        this.generateMockPerformanceData();

        // Update charts
        chartsService.updatePerformanceChart(this.performanceData);
        chartsService.updateAllocationChart(this.assets);

        // Update recent trades
        uiService.updateRecentTrades(this.recentTrades);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      uiService.showNotification('Failed to load dashboard data', 'danger');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Load bots
   */
  async loadBots() {
    if (!this.hasApiCredentials()) return;

    uiService.showLoading('Loading bots...');

    try {
      const response = await apiService.getBots();

      if (response && response.bots) {
        this.bots = response.bots;
        uiService.updateBotsList(this.bots);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
      uiService.showNotification('Failed to load bots', 'danger');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Load portfolio
   */
  async loadPortfolio() {
    if (!this.hasApiCredentials()) return;

    uiService.showLoading('Loading portfolio...');

    try {
      // Load account info
      const accountInfo = await apiService.getAccountInfo(this.apiCredentials);

      if (accountInfo && accountInfo.data) {
        // Calculate total balance
        let totalBalance = 0;
        accountInfo.data.forEach(asset => {
          totalBalance += parseFloat(asset.available) * parseFloat(asset.usdtRate);
        });

        // Create assets array with allocation percentage
        const assets = accountInfo.data.map(asset => {
          const value = parseFloat(asset.available) * parseFloat(asset.usdtRate);
          return {
            symbol: asset.coinName,
            balance: parseFloat(asset.available),
            value: value,
            allocation: (value / totalBalance) * 100,
            change: Math.random() * 10 - 5 // Mock 24h change (replace with actual data)
          };
        });

        // Sort assets by value (descending)
        assets.sort((a, b) => b.value - a.value);

        // Update assets
        this.assets = assets;

        // Update UI
        uiService.updatePortfolioAssets(this.assets);
        chartsService.updateAllocationChart(this.assets);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      uiService.showNotification('Failed to load portfolio', 'danger');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Create a new bot
   */
  async createBot() {
    if (!this.hasApiCredentials()) {
      uiService.showNotification('Please set your API credentials first', 'warning');
      uiService.hideModal('createBotModal');
      uiService.navigateTo('settings');
      return;
    }

    // Get form values
    const symbol = document.getElementById('botSymbol').value;
    const strategyType = document.getElementById('botStrategy').value;
    const interval = document.getElementById('botInterval').value;
    const amount = parseFloat(document.getElementById('botAmount').value);
    const stopLoss = parseFloat(document.getElementById('botStopLoss').value) / 100;
    const takeProfit = parseFloat(document.getElementById('botTakeProfit').value) / 100;
    const enabled = document.getElementById('botEnabled').checked;

    // Validate form
    if (!symbol || !strategyType || !interval || isNaN(amount) || isNaN(stopLoss) || isNaN(takeProfit)) {
      uiService.showNotification('Please fill all required fields', 'warning');
      return;
    }

    // Get strategy parameters
    let config = {
      symbol,
      interval,
      amount,
      stopLoss,
      takeProfit,
      enabled
    };

    // Add strategy-specific parameters
    switch (strategyType) {
      case 'sma':
        config.shortPeriod = parseInt(document.getElementById('shortPeriod').value);
        config.longPeriod = parseInt(document.getElementById('longPeriod').value);
        break;
      case 'rsi':
        config.period = parseInt(document.getElementById('rsiPeriod').value);
        config.overbought = parseInt(document.getElementById('overbought').value);
        config.oversold = parseInt(document.getElementById('oversold').value);
        break;
      case 'macd':
        config.fastPeriod = parseInt(document.getElementById('fastPeriod').value);
        config.slowPeriod = parseInt(document.getElementById('slowPeriod').value);
        config.signalPeriod = parseInt(document.getElementById('signalPeriod').value);
        break;
    }

    uiService.showLoading('Creating bot...');

    try {
      const botData = {
        ...this.apiCredentials,
        symbol,
        strategyType,
        config
      };

      const response = await apiService.createBot(botData);

      if (response && response.id) {
        uiService.showNotification('Bot created successfully', 'success');
        uiService.hideModal('createBotModal');

        // Reset form
        document.getElementById('createBotForm').reset();
        document.getElementById('strategyParams').innerHTML = '';

        // Reload bots
        await this.loadBots();

        // Navigate to bots page
        uiService.navigateTo('bots');
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      uiService.showNotification(`Failed to create bot: ${error.message}`, 'danger');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Start a bot
   * @param {string} botId - Bot ID
   */
  async startBot(botId) {
    uiService.showLoading('Starting bot...');

    try {
      const response = await apiService.startBot(botId);

      if (response && response.message) {
        uiService.showNotification(response.message, 'success');

        // Update bot status
        const botIndex = this.bots.findIndex(bot => bot.id === botId);
        if (botIndex !== -1) {
          this.bots[botIndex].isRunning = true;
          uiService.updateBotsList(this.bots);
        }

        // Reload bot details
        uiService.hideModal('botDetailsModal');
        await this.loadBots();
      }
    } catch (error) {
      console.error('Error starting bot:', error);
      uiService.showNotification(`Failed to start bot: ${error.message}`, 'danger');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Stop a bot
   * @param {string} botId - Bot ID
   */
  async stopBot(botId) {
    uiService.showLoading('Stopping bot...');

    try {
      const response = await apiService.stopBot(botId);

      if (response && response.message) {
        uiService.showNotification(response.message, 'success');

        // Update bot status
        const botIndex = this.bots.findIndex(bot => bot.id === botId);
        if (botIndex !== -1) {
          this.bots[botIndex].isRunning = false;
          uiService.updateBotsList(this.bots);
        }

        // Reload bot details
        uiService.hideModal('botDetailsModal');
        await this.loadBots();
      }
    } catch (error) {
      console.error('Error stopping bot:', error);
      uiService.showNotification(`Failed to stop bot: ${error.message}`, 'danger');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Delete a bot
   * @param {string} botId - Bot ID
   */
  async deleteBot(botId) {
    uiService.showLoading('Deleting bot...');

    try {
      const response = await apiService.deleteBot(botId);

      if (response && response.message) {
        uiService.showNotification(response.message, 'success');

        // Remove bot from list
        this.bots = this.bots.filter(bot => bot.id !== botId);
        uiService.updateBotsList(this.bots);

        // Hide modal
        uiService.hideModal('botDetailsModal');
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
      uiService.showNotification(`Failed to delete bot: ${error.message}`, 'danger');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Test API connection
   */
  async testApiConnection() {
    // Get API credentials from form
    const apiKey = document.getElementById('apiKey').value;
    const secretKey = document.getElementById('secretKey').value;
    const passphrase = document.getElementById('passphrase').value;

    if (!apiKey || !secretKey || !passphrase) {
      uiService.showNotification('Please fill all API credentials', 'warning');
      return;
    }

    uiService.showLoading('Testing API connection...');

    try {
      const credentials = { apiKey, secretKey, passphrase };
      const response = await apiService.testApiConnection(credentials);

      uiService.showNotification('API connection successful', 'success');
    } catch (error) {
      console.error('API connection error:', error);
      uiService.showNotification(`API connection failed: ${error.message}`, 'danger');
    } finally {
      uiService.hideLoading();
    }
  }

  /**
   * Save settings
   */
  saveSettings() {
    // Get API credentials from form
    const apiKey = document.getElementById('apiKey').value;
    const secretKey = document.getElementById('secretKey').value;
    const passphrase = document.getElementById('passphrase').value;

    if (!apiKey || !secretKey || !passphrase) {
      uiService.showNotification('Please fill all API credentials', 'warning');
      return;
    }

    // Save API credentials
    this.apiCredentials = { apiKey, secretKey, passphrase };
    localStorage.setItem('apiCredentials', JSON.stringify(this.apiCredentials));

    // Save notification settings
    const notificationSettings = {
      email: document.getElementById('emailNotifications').checked,
      emailAddress: document.getElementById('emailAddress').value,
      trade: document.getElementById('tradeNotifications').checked,
      error: document.getElementById('errorNotifications').checked
    };

    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));

    uiService.showNotification('Settings saved successfully', 'success');

    // Load initial data
    this.loadInitialData();
  }

  /**
   * Load credentials from local storage
   */
  loadCredentials() {
    const savedCredentials = localStorage.getItem('apiCredentials');

    if (savedCredentials) {
      this.apiCredentials = JSON.parse(savedCredentials);

      // Fill form fields
      document.getElementById('apiKey').value = this.apiCredentials.apiKey;
      document.getElementById('secretKey').value = this.apiCredentials.secretKey;
      document.getElementById('passphrase').value = this.apiCredentials.passphrase;
    }

    // Load notification settings
    const savedNotificationSettings = localStorage.getItem('notificationSettings');

    if (savedNotificationSettings) {
      const settings = JSON.parse(savedNotificationSettings);

      document.getElementById('emailNotifications').checked = settings.email;
      document.getElementById('emailAddress').value = settings.emailAddress || '';
      document.getElementById('tradeNotifications').checked = settings.trade;
      document.getElementById('errorNotifications').checked = settings.error;
    }
  }

  /**
   * Check if API credentials are set
   * @returns {boolean} - True if API credentials are set
   */
  hasApiCredentials() {
    return !!(this.apiCredentials.apiKey && this.apiCredentials.secretKey && this.apiCredentials.passphrase);
  }

  /**
   * Handle bot update
   * @param {object} data - Bot update data
   */
  handleBotUpdate(data) {
    // Update bot in list
    const botIndex = this.bots.findIndex(bot => bot.id === data.id);

    if (botIndex !== -1) {
      this.bots[botIndex] = { ...this.bots[botIndex], ...data };
      uiService.updateBotsList(this.bots);
    }
  }

  /**
   * Handle trade update
   * @param {object} data - Trade update data
   */
  handleTradeUpdate(data) {
    // Add trade to recent trades
    this.recentTrades.unshift(data);

    // Keep only the last 10 trades
    if (this.recentTrades.length > 10) {
      this.recentTrades = this.recentTrades.slice(0, 10);
    }

    // Update UI
    uiService.updateRecentTrades(this.recentTrades);
  }

  /**
   * Generate mock performance data
   */
  generateMockPerformanceData() {
    // Generate 30 days of mock data
    const data = [];
    const now = new Date();
    let value = 10000; // Starting value

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Random daily change between -3% and +3%
      const change = (Math.random() * 6 - 3) / 100;
      value = value * (1 + change);

      data.push({
        timestamp: date.getTime(),
        value: value
      });
    }

    this.performanceData = data;
  }
}

// Initialize the application
const app = new App();