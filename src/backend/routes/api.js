const express = require('express');
const router = express.Router();
const BitgetService = require('../services/bitgetService');
const TradingBot = require('../bot/tradingBot');
const { SmaCrossoverStrategy, RsiStrategy, MacdStrategy } = require('../strategies');

// Store active bots
const activeBots = new Map();

// Initialize BitGet service with API keys from environment variables
const createBitgetService = (apiKey, secretKey, passphrase) => {
  return new BitgetService(apiKey, secretKey, passphrase);
};

// Get all active bots
router.get('/bots', (req, res) => {
  const bots = Array.from(activeBots.entries()).map(([id, bot]) => ({
    id,
    symbol: bot.config.symbol,
    strategy: bot.strategy.name,
    enabled: bot.config.enabled,
    isRunning: bot.isRunning
  }));

  res.json({ bots });
});

// Create a new bot
router.post('/bots', (req, res) => {
  try {
    const { apiKey, secretKey, passphrase, symbol, strategyType, config } = req.body;

    if (!apiKey || !secretKey || !passphrase || !symbol || !strategyType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create BitGet service
    const bitgetService = createBitgetService(apiKey, secretKey, passphrase);

    // Create strategy based on type
    let strategy;
    switch (strategyType) {
      case 'sma':
        strategy = new SmaCrossoverStrategy(
          config?.shortPeriod || 9,
          config?.longPeriod || 21
        );
        break;
      case 'rsi':
        strategy = new RsiStrategy(
          config?.period || 14,
          config?.overbought || 70,
          config?.oversold || 30
        );
        break;
      case 'macd':
        strategy = new MacdStrategy(
          config?.fastPeriod || 12,
          config?.slowPeriod || 26,
          config?.signalPeriod || 9
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid strategy type' });
    }

    // Create bot configuration
    const botConfig = {
      symbol,
      interval: config?.interval || '1h',
      amount: config?.amount || 0.001,
      enabled: config?.enabled || false,
      stopLoss: config?.stopLoss || 0.05,
      takeProfit: config?.takeProfit || 0.1
    };

    // Create and start the bot
    const bot = new TradingBot(bitgetService, strategy, botConfig);
    const botId = Date.now().toString();

    // Store the bot
    activeBots.set(botId, bot);

    // Start the bot if enabled
    if (botConfig.enabled) {
      bot.start();
    }

    res.json({
      id: botId,
      message: 'Bot created successfully',
      config: botConfig
    });
  } catch (error) {
    console.error('Error creating bot:', error);
    res.status(500).json({ error: 'Failed to create bot' });
  }
});

// Get bot details
router.get('/bots/:id', (req, res) => {
  const { id } = req.params;
  const bot = activeBots.get(id);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  res.json({
    id,
    symbol: bot.config.symbol,
    strategy: bot.strategy.name,
    config: bot.config,
    isRunning: bot.isRunning,
    positions: bot.positions,
    lastUpdate: bot.marketData.length > 0 ? bot.marketData[bot.marketData.length - 1] : null
  });
});

// Update bot configuration
router.put('/bots/:id', (req, res) => {
  const { id } = req.params;
  const bot = activeBots.get(id);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  const { config } = req.body;

  if (!config) {
    return res.status(400).json({ error: 'Missing configuration' });
  }

  // Update bot configuration
  bot.updateConfig(config);

  // Start or stop the bot based on enabled status
  if (config.enabled !== undefined) {
    if (config.enabled && !bot.isRunning) {
      bot.start();
    } else if (!config.enabled && bot.isRunning) {
      bot.stop();
    }
  }

  res.json({
    id,
    message: 'Bot configuration updated',
    config: bot.config
  });
});

// Delete a bot
router.delete('/bots/:id', (req, res) => {
  const { id } = req.params;
  const bot = activeBots.get(id);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  // Stop the bot if running
  if (bot.isRunning) {
    bot.stop();
  }

  // Remove the bot
  activeBots.delete(id);

  res.json({
    id,
    message: 'Bot deleted successfully'
  });
});

// Start a bot
router.post('/bots/:id/start', (req, res) => {
  const { id } = req.params;
  const bot = activeBots.get(id);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  if (bot.isRunning) {
    return res.status(400).json({ error: 'Bot is already running' });
  }

  bot.start();

  res.json({
    id,
    message: 'Bot started successfully'
  });
});

// Stop a bot
router.post('/bots/:id/stop', (req, res) => {
  const { id } = req.params;
  const bot = activeBots.get(id);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  if (!bot.isRunning) {
    return res.status(400).json({ error: 'Bot is not running' });
  }

  bot.stop();

  res.json({
    id,
    message: 'Bot stopped successfully'
  });
});

// Get account information
router.post('/account', async (req, res) => {
  try {
    const { apiKey, secretKey, passphrase } = req.body;

    if (!apiKey || !secretKey || !passphrase) {
      return res.status(400).json({ error: 'Missing API credentials' });
    }

    const bitgetService = createBitgetService(apiKey, secretKey, passphrase);
    const accountInfo = await bitgetService.getPrivate('/api/spot/v1/account/getInfo');
    res.json(accountInfo);
  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({ error: 'Failed to fetch account information' });
  }
});

router.post("/account/assets", async (req, res) => {
  try {
    const { apiKey, secretKey, passphrase } = req.body;

    if (!apiKey || !secretKey || !passphrase) {
      return res.status(400).json({ error: 'Missing API credentials' });
    }

    const bitgetService = createBitgetService(apiKey, secretKey, passphrase);
    const accountAssets = await bitgetService.getPrivate('/api/spot/v1/account/assets-lite');
    res.json(accountAssets);
  } catch (error) {
    console.error('Error fetching account assets:', error);
    res.status(500).json({ error: 'Failed to fetch account assets' });
  }
});

// Test API connection
router.post('/account/test', async (req, res) => {
  try {
    const { apiKey, secretKey, passphrase } = req.body;

    if (!apiKey || !secretKey || !passphrase) {
      return res.status(400).json({ error: 'Missing API credentials' });
    }

    // Create BitGet service
    const bitgetService = createBitgetService(apiKey, secretKey, passphrase);

    // Prima testiamo la connessione base
    const connectionTest = await bitgetService.testConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        error: 'API connection failed',
        message: connectionTest.error
      });
    }

    // Poi testiamo l'autenticazione
    try {
      // Proviamo un endpoint che richiede autenticazione
      const marketData = await bitgetService.getMarketData('BTCUSDT');

      res.json({
        success: true,
        message: 'API connection and authentication successful',
        data: {
          connected: true,
          timestamp: Date.now()
        }
      });
    } catch (authError) {
      // Se la connessione funziona ma l'autenticazione fallisce
      return res.status(401).json({
        success: false,
        error: 'API authentication failed',
        message: authError.message
      });
    }
  } catch (error) {
    console.error('API connection test error:', error);
    res.status(500).json({
      success: false,
      error: 'API connection failed',
      message: error.message || 'Unknown error'
    });
  }
});

module.exports = router;