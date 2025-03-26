const technicalIndicators = require('technicalindicators');

// Base Strategy class
class Strategy {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  analyze(marketData) {
    throw new Error('Method not implemented');
  }
}

// Simple Moving Average Crossover Strategy
class SmaCrossoverStrategy extends Strategy {
  constructor(shortPeriod = 9, longPeriod = 21) {
    super(
      'SMA Crossover',
      'Generates signals based on short and long Simple Moving Average crossovers'
    );
    this.shortPeriod = shortPeriod;
    this.longPeriod = longPeriod;
  }

  analyze(marketData) {
    const prices = marketData.map(candle => candle.close);

    const shortSMA = technicalIndicators.SMA.calculate({
      period: this.shortPeriod,
      values: prices
    });

    const longSMA = technicalIndicators.SMA.calculate({
      period: this.longPeriod,
      values: prices
    });

    // Adjust arrays to have the same length
    const startIdx = prices.length - shortSMA.length;
    const shortSMAValues = shortSMA;
    const longSMAValues = longSMA.slice(-(shortSMA.length));

    // Check for crossover
    if (shortSMAValues.length < 2) return { signal: 'neutral' };

    const currentShortSMA = shortSMAValues[shortSMAValues.length - 1];
    const previousShortSMA = shortSMAValues[shortSMAValues.length - 2];
    const currentLongSMA = longSMAValues[longSMAValues.length - 1];
    const previousLongSMA = longSMAValues[longSMAValues.length - 2];

    // Bullish crossover: short SMA crosses above long SMA
    if (previousShortSMA <= previousLongSMA && currentShortSMA > currentLongSMA) {
      return { signal: 'buy' };
    }

    // Bearish crossover: short SMA crosses below long SMA
    if (previousShortSMA >= previousLongSMA && currentShortSMA < currentLongSMA) {
      return { signal: 'sell' };
    }

    return { signal: 'neutral' };
  }
}

// Relative Strength Index Strategy
class RsiStrategy extends Strategy {
  constructor(period = 14, overbought = 70, oversold = 30) {
    super(
      'RSI Strategy',
      'Generates signals based on Relative Strength Index overbought/oversold conditions'
    );
    this.period = period;
    this.overbought = overbought;
    this.oversold = oversold;
  }

  analyze(marketData) {
    const prices = marketData.map(candle => candle.close);

    const rsiValues = technicalIndicators.RSI.calculate({
      period: this.period,
      values: prices
    });

    if (rsiValues.length === 0) return { signal: 'neutral' };

    const currentRSI = rsiValues[rsiValues.length - 1];
    const previousRSI = rsiValues.length > 1 ? rsiValues[rsiValues.length - 2] : null;

    // Oversold condition: RSI crosses above oversold level
    if (previousRSI !== null && previousRSI <= this.oversold && currentRSI > this.oversold) {
      return { signal: 'buy' };
    }

    // Overbought condition: RSI crosses below overbought level
    if (previousRSI !== null && previousRSI >= this.overbought && currentRSI < this.overbought) {
      return { signal: 'sell' };
    }

    return { signal: 'neutral' };
  }
}

// MACD Strategy
class MacdStrategy extends Strategy {
  constructor(fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    super(
      'MACD Strategy',
      'Generates signals based on Moving Average Convergence Divergence crossovers'
    );
    this.fastPeriod = fastPeriod;
    this.slowPeriod = slowPeriod;
    this.signalPeriod = signalPeriod;
  }

  analyze(marketData) {
    const prices = marketData.map(candle => candle.close);

    const macdValues = technicalIndicators.MACD.calculate({
      fastPeriod: this.fastPeriod,
      slowPeriod: this.slowPeriod,
      signalPeriod: this.signalPeriod,
      values: prices
    });

    if (macdValues.length < 2) return { signal: 'neutral' };

    const current = macdValues[macdValues.length - 1];
    const previous = macdValues[macdValues.length - 2];

    // Bullish crossover: MACD line crosses above signal line
    if (previous.MACD <= previous.signal && current.MACD > current.signal) {
      return { signal: 'buy' };
    }

    // Bearish crossover: MACD line crosses below signal line
    if (previous.MACD >= previous.signal && current.MACD < current.signal) {
      return { signal: 'sell' };
    }

    return { signal: 'neutral' };
  }
}

module.exports = {
  Strategy,
  SmaCrossoverStrategy,
  RsiStrategy,
  MacdStrategy
};