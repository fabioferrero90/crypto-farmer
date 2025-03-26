const EventEmitter = require('events');

class TradingBot extends EventEmitter {
  constructor(bitgetService, strategy, config) {
    super();
    this.bitgetService = bitgetService;
    this.strategy = strategy;
    this.config = {
      symbol: config.symbol || 'BTCUSDT',
      interval: config.interval || '1h',
      amount: config.amount || 0.001,
      enabled: config.enabled || false,
      stopLoss: config.stopLoss || 0.05, // 5%
      takeProfit: config.takeProfit || 0.1, // 10%
      ...config
    };

    this.marketData = [];
    this.positions = [];
    this.isRunning = false;
    this.lastSignal = null;
  }

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit('status', { status: 'started', config: this.config });

    // Start the main loop
    this.mainLoop();
  }

  async stop() {
    this.isRunning = false;
    this.emit('status', { status: 'stopped' });
  }

  async mainLoop() {
    while (this.isRunning) {
      try {
        // Fetch market data
        await this.updateMarketData();

        // Analyze market data with strategy
        const analysis = this.strategy.analyze(this.marketData);

        // Execute trades based on signals
        if (this.config.enabled && analysis.signal !== 'neutral' && analysis.signal !== this.lastSignal) {
          await this.executeTrade(analysis.signal);
          this.lastSignal = analysis.signal;
        }

        // Check stop loss and take profit for open positions
        await this.checkPositions();

        // Emit update event
        this.emit('update', {
          marketData: this.marketData[this.marketData.length - 1],
          analysis,
          positions: this.positions
        });

        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, this.getIntervalMs()));
      } catch (error) {
        console.error('Error in trading bot main loop:', error);
        this.emit('error', error);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  async updateMarketData() {
    // Get historical candles
    const marketData = await this.bitgetService.getMarketData(this.config.symbol);

    // Update local market data
    if (marketData && marketData.data) {
      this.marketData.push({
        timestamp: Date.now(),
        open: parseFloat(marketData.data.open),
        high: parseFloat(marketData.data.high),
        low: parseFloat(marketData.data.low),
        close: parseFloat(marketData.data.close),
        volume: parseFloat(marketData.data.volume)
      });

      // Keep only the last 100 candles
      if (this.marketData.length > 100) {
        this.marketData = this.marketData.slice(-100);
      }
    }
  }

  async executeTrade(signal) {
    try {
      const currentPrice = this.marketData[this.marketData.length - 1].close;

      if (signal === 'buy') {
        // Execute buy order
        const orderResult = await this.bitgetService.placeOrder(
          this.config.symbol,
          'buy',
          'market',
          currentPrice,
          this.config.amount
        );

        if (orderResult && orderResult.data) {
          const position = {
            id: orderResult.data.orderId,
            symbol: this.config.symbol,
            type: 'buy',
            price: currentPrice,
            amount: this.config.amount,
            timestamp: Date.now(),
            stopLoss: currentPrice * (1 - this.config.stopLoss),
            takeProfit: currentPrice * (1 + this.config.takeProfit)
          };

          this.positions.push(position);
          this.emit('trade', { type: 'buy', position });
        }
      } else if (signal === 'sell') {
        // Execute sell order for all open positions
        for (const position of this.positions) {
          if (position.type === 'buy') {
            const orderResult = await this.bitgetService.placeOrder(
              this.config.symbol,
              'sell',
              'market',
              currentPrice,
              position.amount
            );

            if (orderResult && orderResult.data) {
              this.emit('trade', {
                type: 'sell',
                position,
                profit: (currentPrice - position.price) * position.amount
              });
            }
          }
        }

        // Clear positions
        this.positions = [];
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      this.emit('error', error);
    }
  }

  async checkPositions() {
    if (this.positions.length === 0) return;

    const currentPrice = this.marketData[this.marketData.length - 1].close;
    const positionsToRemove = [];

    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i];

      // Check stop loss
      if (position.type === 'buy' && currentPrice <= position.stopLoss) {
        try {
          const orderResult = await this.bitgetService.placeOrder(
            position.symbol,
            'sell',
            'market',
            currentPrice,
            position.amount
          );

          if (orderResult && orderResult.data) {
            this.emit('trade', {
              type: 'stop_loss',
              position,
              profit: (currentPrice - position.price) * position.amount
            });
            positionsToRemove.push(i);
          }
        } catch (error) {
          console.error('Error executing stop loss:', error);
        }
      }

      // Check take profit
      if (position.type === 'buy' && currentPrice >= position.takeProfit) {
        try {
          const orderResult = await this.bitgetService.placeOrder(
            position.symbol,
            'sell',
            'market',
            currentPrice,
            position.amount
          );

          if (orderResult && orderResult.data) {
            this.emit('trade', {
              type: 'take_profit',
              position,
              profit: (currentPrice - position.price) * position.amount
            });
            positionsToRemove.push(i);
          }
        } catch (error) {
          console.error('Error executing take profit:', error);
        }
      }
    }

    // Remove closed positions
    for (let i = positionsToRemove.length - 1; i >= 0; i--) {
      this.positions.splice(positionsToRemove[i], 1);
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('config', this.config);
  }

  getIntervalMs() {
    const interval = this.config.interval;
    const value = parseInt(interval);
    const unit = interval.slice(-1);

    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // Default to 1 minute
    }
  }
}

module.exports = TradingBot;