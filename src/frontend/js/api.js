/**
 * API Service for communicating with the backend
 */
class ApiService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || window.location.origin;
    this.apiUrl = `${this.baseUrl}/api`;
  }

  /**
   * Make a request to the API
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {object} data - Request data
   * @returns {Promise} - Promise with response data
   */
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.apiUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      console.log(`Making ${method} request to: ${url}`, data ? { data } : '');
      const response = await fetch(url, options);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

        try {
          // Try to parse error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use text as is
          errorMessage = errorText || errorMessage;
        }

        // Aggiungi dettagli specifici per errori comuni
        if (response.status === 405) {
          errorMessage = `Method ${method} not allowed for endpoint ${endpoint}. Please check if the endpoint is correct and supports this method.`;
        }

        console.error(`API Error (${response.status}):`, errorMessage);
        throw new Error(errorMessage);
      }

      // Handle empty responses
      const responseText = await response.text();
      if (!responseText) {
        return null; // Return null for empty responses
      }

      // Parse JSON response
      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.error('JSON parsing error:', e);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Get all bots
   * @returns {Promise} - Promise with bots data
   */
  async getBots() {
    return this.request('/bots');
  }

  /**
   * Get bot details
   * @param {string} id - Bot ID
   * @returns {Promise} - Promise with bot details
   */
  async getBotDetails(id) {
    return this.request(`/bots/${id}`);
  }

  /**
   * Create a new bot
   * @param {object} botData - Bot configuration data
   * @returns {Promise} - Promise with created bot data
   */
  async createBot(botData) {
    return this.request('/bots', 'POST', botData);
  }

  /**
   * Update bot configuration
   * @param {string} id - Bot ID
   * @param {object} config - New bot configuration
   * @returns {Promise} - Promise with updated bot data
   */
  async updateBot(id, config) {
    return this.request(`/bots/${id}`, 'PUT', config);
  }

  /**
   * Delete a bot
   * @param {string} id - Bot ID
   * @returns {Promise} - Promise with deletion result
   */
  async deleteBot(id) {
    return this.request(`/bots/${id}`, 'DELETE');
  }

  /**
   * Start a bot
   * @param {string} id - Bot ID
   * @returns {Promise} - Promise with start result
   */
  async startBot(id) {
    return this.request(`/bots/${id}/start`, 'POST');
  }

  /**
   * Stop a bot
   * @param {string} id - Bot ID
   * @returns {Promise} - Promise with stop result
   */
  async stopBot(id) {
    return this.request(`/bots/${id}/stop`, 'POST');
  }

  /**
   * Get account information
   * @param {object} credentials - API credentials
   * @returns {Promise} - Promise with account data
   */
  async getAccountInfo(credentials) {
    return this.request('/account/assets', 'POST', credentials);
  }

  /**
   * Test API connection
   * @param {object} credentials - API credentials
   * @returns {Promise} - Promise with test result
   */
  /**
   * Test API connection
   * @param {object} credentials - API credentials
   * @returns {Promise} - Promise with test result
   */
  async testApiConnection(credentials) {
    // Proviamo a usare l'endpoint principale dell'account
    // che probabilmente è già configurato correttamente
    const testCredentials = {
      ...credentials,
      timestamp: Date.now()
    };

    try {
      // Utilizziamo l'endpoint principale dell'account
      return await this.request('/account', 'POST', testCredentials);
    } catch (error) {
      // Se fallisce, aggiungiamo un messaggio più chiaro
      if (error.message.includes('405')) {
        throw new Error('API connection test failed: Server configuration issue. Please make sure the backend server is running correctly.');
      }
      throw error;
    }
  }
}

// Create a singleton instance
const apiService = new ApiService();