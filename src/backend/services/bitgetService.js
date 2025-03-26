const axios = require('axios');
const crypto = require('node:crypto');

class BitgetService {
  constructor(apiKey, secretKey, passphrase) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.passphrase = passphrase;
    this.baseUrl = 'https://api.bitget.com';
  }

  // Generate signature for API authentication
  generateSignature(timestamp = Date.now().toString(), method, requestPath, body = '') {
    const message = timestamp + method.toUpperCase() + requestPath + (body ? JSON.stringify(body) : '');
    const hmac = crypto.createHmac("sha256", Buffer.from(this.secretKey, "utf8"));
    const update = hmac.update(Buffer.from(message, "utf8"));
    const digest = update.digest();
    const signature = digest.toString("base64");
    console.log("Timestamp:", timestamp);
    console.log("Method:", method.toUpperCase());
    console.log("Request Path:", requestPath);
    console.log("Body:", body ? JSON.stringify(body) : '');
    console.log("Message:", message);
    console.log("Signature:", signature);
    return signature;
  }

  // Make API request
  async makeRequest(method, endpoint, params = {}, data = null) {
    // get milliseconds since epoch
    const timestamp = Date.now().toString();

    // Costruisci il percorso della richiesta includendo i parametri nella firma
    let requestPath = endpoint;
    if (Object.keys(params).length > 0) {
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      requestPath += `?${queryString}`;
    }

    // Genera la firma
    const signature = this.generateSignature(timestamp, method, requestPath, data);

    try {
      // Costruisci l'URL completo
      const url = `${this.baseUrl}${endpoint}`;

      console.log(`Making ${method} request to: ${url}`);
      console.log('Request params:', params);
      console.log('Request data:', data);

      const response = await axios({
        method,
        url,
        params,
        data,
        headers: {
          'ACCESS-KEY': this.apiKey,
          'ACCESS-SIGN': signature,
          'ACCESS-TIMESTAMP': timestamp,
          'ACCESS-PASSPHRASE': this.passphrase,
          'Content-Type': 'application/json',
          "locale": "en_US",
          'X-CHANNEL-API-CODE': 'spot' // Aggiunto header richiesto dalla documentazione
        }
      });

      return response.data;
    } catch (error) {
      // Gestione dettagliata degli errori
      let errorMessage = 'BitGet API Error: ';

      if (error.response) {
        // La richiesta è stata effettuata e il server ha risposto con un codice di stato
        // che non rientra nell'intervallo 2xx
        errorMessage += `Status ${error.response.status} - ${error.response.statusText}`;
        console.error(errorMessage);
        console.error('Error details:', error.response.data);
        console.error('Request URL:', `${this.baseUrl}${endpoint}`);
        console.error('Request method:', method);
        console.error('Request params:', params);
        console.error('Request data:', data);

        throw new Error(`${errorMessage}: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // La richiesta è stata effettuata ma non è stata ricevuta alcuna risposta
        errorMessage += 'No response received from server';
        console.error(errorMessage);
        console.error('Request URL:', `${this.baseUrl}${endpoint}`);

        throw new Error(errorMessage);
      } else {
        // Si è verificato un errore durante l'impostazione della richiesta
        errorMessage += error.message;
        console.error(errorMessage);

        throw new Error(errorMessage);
      }
    }
  }

  // Get account information - endpoint aggiornato
  async getAccountInfo() {
    return this.makeRequest('GET', '/api/spot/v1/account/assets');
  }

  // Get market data - endpoint aggiornato
  async getMarketData(symbol) {
    return this.makeRequest('GET', '/api/spot/v1/market/ticker', { symbol });
  }

  // Place order - endpoint aggiornato
  async placeOrder(symbol, side, orderType, price, quantity) {
    const data = {
      symbol,
      side,
      orderType,
      force: 'normal',
      price: price.toString(),
      quantity: quantity.toString()
    };

    return this.makeRequest('POST', '/api/spot/v1/trade/place-order', {}, data);
  }

  // Cancel order - endpoint aggiornato
  async cancelOrder(symbol, orderId) {
    return this.makeRequest('POST', '/api/spot/v1/trade/cancel-order', {}, { symbol, orderId });
  }

  // Get order history - endpoint aggiornato
  async getOrderHistory(symbol) {
    return this.makeRequest('GET', '/api/spot/v1/trade/history-orders', { symbol });
  }

  // Get open orders - endpoint aggiornato
  async getOpenOrders(symbol) {
    return this.makeRequest('GET', '/api/spot/v1/trade/open-orders', { symbol });
  }

  // Aggiunto metodo per ottenere i dati storici delle candele - endpoint aggiornato
  async getKlines(symbol, period, startTime, endTime, limit = 100) {
    return this.makeRequest('GET', '/api/spot/v1/market/candles', {
      symbol,
      period, // es. '1m', '5m', '15m', '30m', '1h', '4h', '1d'
      startTime,
      endTime,
      limit
    });
  }

  // Aggiunto metodo per ottenere il saldo di un asset specifico
  async getAssetBalance(coin) {
    const assets = await this.getAccountInfo();
    return assets.data.find(asset => asset.coinName === coin);
  }

  // Test connection using a public endpoint - endpoint aggiornato
  async testConnection() {
    try {
      // Utilizziamo un endpoint pubblico che non richiede autenticazione
      const response = await axios.get(`${this.baseUrl}/api/v1/common/time`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Connection test failed:', error.message);

      let errorDetails = '';
      if (error.response) {
        errorDetails = `Status: ${error.response.status}, Message: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorDetails = 'No response received from server';
      } else {
        errorDetails = error.message;
      }

      return {
        success: false,
        error: `Connection test failed: ${errorDetails}`
      };
    }
  }

  // Test authentication with API keys
  async testAuthentication() {
    try {
      // Utilizziamo un endpoint che richiede autenticazione ma è meno complesso
      return await this.makeRequest('GET', '/api/spot/v1/account/info');
    } catch (error) {
      console.error('Authentication test failed:', error);
      throw error;
    }
  }
}

module.exports = BitgetService;