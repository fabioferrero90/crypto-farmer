const axios = require('axios');
const crypto = require('node:crypto');

const ENABLE_HTTP_TRACE = false;

class BitgetService {
  constructor(apiKey, apiSecret, apiPass) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.apiPass = apiPass;
    this.baseUrl = 'https://api.bitget.com';

    this.options = {
      strictParamValidation: false,
      encodeQueryStringValues: true,
      parseExceptions: false,
    };
    
    this.globalRequestOptions = {
      /** in ms == 5 minutes by default */
      timeout: 1000 * 60 * 5,
      /** inject custom rquest options based on axios specs - see axios docs for more guidance on AxiosRequestConfig: https://github.com/axios/axios#request-config */
      headers: {
        'X-CHANNEL-API-CODE': 'hbnni',
        'Content-Type': 'application/json',
        locale: 'en-US',
      },
    };
  }
  
  /* WRAPPED METHODS */
  get(endpoint, params = {}) {
    return this._makeRequest('GET', endpoint, params, true);
  }

  getPrivate(endpoint, params = {}) {
    return this._makeRequest('GET', endpoint, params, false);
  }

  post(endpoint, params = {}) {
    return this._makeRequest('POST', endpoint, params, true);
  }

  postPrivate(endpoint, params = {}) {
    return this._makeRequest('POST', endpoint, params, false);
  }

  deletePrivate(endpoint, params = {}) {
    return this._makeRequest('DELETE', endpoint, params, false);
  }

  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  serializeParams(params, strict_validation = false, encodeValues = true, prefixWith = '') {
    if (!params) {
      return '';
    }

    const queryString = Object.keys(params)
      .sort()
      .map((key) => {
        const value = params[key];
        if (strict_validation === true && typeof value === 'undefined') {
          throw new Error('Failed to sign API request due to undefined parameter',);
        }
        const encodedValue = encodeValues ? encodeURIComponent(value) : value;
        return `${key}=${encodedValue}`;
      })
      .join('&');

    // Only prefix if there's a value
    return queryString ? prefixWith + queryString : queryString;
  }

  async buildRequest(
    method,
    endpoint,
    url,
    params = {},
    isPublicApi = false,
  ) {
    const options = {
      ...this.globalRequestOptions,
      method,
      url,
    }

    for (const key in params) {
      if (typeof params[key] === 'undefined') {
        delete params[key];
      }
    }

    if (isPublicApi || !this.apiKey || !this.apiPass) {
      return {
        ...options,
        params: params,
      };
    }
    
    const signResult = await this.prepareSignParams(
      method,
      endpoint,
      'bitget',
      params,
      isPublicApi,
    );

    const authHeaders = {
      'ACCESS-KEY': this.apiKey,
      'ACCESS-PASSPHRASE': this.apiPass,
      'ACCESS-TIMESTAMP': signResult.timestamp,
      'ACCESS-SIGN': signResult.sign,
    };

    if (method === 'GET') {
      return {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers,
        },
        url: options.url + signResult.queryParamsWithSign,
        params: {},
      };
    }

    return {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      data: params,
    };
  }

  prepareSignParams(
    method,
    endpoint,
    signMethod,
    params = {},
    isPublicApi = false,
  ) {
    if (isPublicApi) {
      return {
        originalParams: params,
        paramsWithSign: params,
      };
    }
    
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Private endpoints require api and private keys set');
    }

    return this.signRequest(params, endpoint, method, signMethod);
  }

  async signRequest(
    data,
    endpoint,
    method,
    signMethod,
  ) {
    const timestamp = Date.now().toString();

    const res = {
      originalParams: {
        ...data,
      },
      sign: "",
      timestamp,
      recvWindow: 0,
      serializedParams: '',
      queryParamsWithSign: '',
    };

    if (!this.apiKey || !this.apiSecret) {
      return res;
    }

    // It's possible to override the recv window on a per rquest level
    const strictParamValidation = this.options.strictParamValidation;
    const encodeQueryStringValues = this.options.encodeQueryStringValues;
    
    if (signMethod === 'bitget') {
      const signRequestParams =
        method === 'GET'
          ? this.serializeParams(
              data,
              strictParamValidation,
              encodeQueryStringValues,
              '?',
            )
          : JSON.stringify(data) || '';

      const paramsStr =
        timestamp + method.toUpperCase() + endpoint + signRequestParams;

      res.sign = await this.signMessage(paramsStr, this.apiSecret, 'base64');
      res.queryParamsWithSign = signRequestParams;
      return res;
    }
    
    console.error(signMethod, `Unhandled sign method`,);
    return res;
  }

  // Generate signature for API authentication
  async signMessage(
    message,
    secret,
    method = 'hex' || 'base64',
  ) {
    const hmac = crypto.createHmac('sha256', secret).update(message);
    switch (method) {
      case 'hex': {
        return hmac.digest('hex');
      }
      case 'base64': {
        return hmac.digest().toString('base64');
      }
      default: {
        throw new Error(`Unhandled sign method: ${method}`);
      }
    }
  }

  parseException(e) {
    if (this.options.parseExceptions === false) {
      throw e;
    }

    // Something happened in setting up the request that triggered an error
    if (!e.response) {
      if (!e.request) {
        throw e.message;
      }

      // request made but no response received
      throw e;
    }

    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const response = e.response;

    throw {
      code: response.status,
      message: response.statusText,
      body: response.data,
      headers: response.headers,
      requestOptions: {
        ...this.options,
        // Prevent credentials from leaking into error messages
        apiPass: 'omittedFromError',
        apiSecret: 'omittedFromError',
      },
    };
  }

  // Make API request
  async _makeRequest(
    method,
    endpoint,
    params = {},
    isPublicApi = false,
  ) {
    // Sanity check to make sure it's only ever prefixed by one forward slash
    const requestUrl = [this.baseUrl, endpoint].join(
      endpoint.startsWith('/') ? '' : '/',
    );
    
    const options = await this.buildRequest(
      method,
      endpoint,
      requestUrl,
      params,
      isPublicApi,
    );
    
    if (ENABLE_HTTP_TRACE) {
      console.log('full request: ', options);
    }

    // Dispatch request
    return axios(options)
      .then((response) => {
        if (response.status == 200) {
          if (
            typeof response.data?.code === 'string' &&
            response.data?.code !== '00000'
          ) {
            throw { response };
          }
          return response.data;
        }
        throw { response };
      })
      .catch((e) => this.parseException(e));
  }

  // Get market data - endpoint aggiornato
  async getMarketData(symbol) {
    return this.get('/api/spot/v1/market/ticker', { symbol });
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

    return this.post('/api/spot/v1/trade/place-order', {}, data);
  }

  // Cancel order - endpoint aggiornato
  async cancelOrder(symbol, orderId) {
    return this.post('/api/spot/v1/trade/cancel-order', {}, { symbol, orderId });
  }

  // Get order history - endpoint aggiornato
  async getOrderHistory(symbol) {
    return this.get('/api/spot/v1/trade/history-orders', { symbol });
  }

  // Get open orders - endpoint aggiornato
  async getOpenOrders(symbol) {
    return this.get('/api/spot/v1/trade/open-orders', { symbol });
  }

  // Aggiunto metodo per ottenere i dati storici delle candele - endpoint aggiornato
  async getKlines(symbol, period, startTime, endTime, limit = 100) {
    return this.get('/api/spot/v1/market/candles', {
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
      const response = this.get("/api/v1/common/time")
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
      return await this.get('/api/spot/v1/account/info');
    } catch (error) {
      console.error('Authentication test failed:', error);
      throw error;
    }
  }
}

module.exports = BitgetService;