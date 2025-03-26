/**
 * Charts Service for managing charts
 */
class ChartsService {
  constructor() {
    this.charts = {};
    this.colors = {
      primary: '#4e73df',
      success: '#1cc88a',
      info: '#36b9cc',
      warning: '#f6c23e',
      danger: '#e74a3b',
      secondary: '#858796',
      light: '#f8f9fc',
      dark: '#5a5c69'
    };

    // Dark mode colors
    this.darkModeColors = {
      primary: '#4e73df',
      success: '#1cc88a',
      info: '#36b9cc',
      warning: '#f6c23e',
      danger: '#e74a3b',
      secondary: '#858796',
      light: '#343a40',
      dark: '#f8f9fc'
    };

    // Initialize charts
    this.initCharts();
    
    // Listen for dark mode changes
    this.listenForDarkModeChanges();
  }

  /**
   * Listen for dark mode changes
   */
  listenForDarkModeChanges() {
    document.addEventListener('darkModeChanged', (e) => {
      const isDarkMode = e.detail.isDarkMode;
      this.updateChartsTheme(isDarkMode);
    });
  }

  /**
   * Update charts theme based on dark mode
   * @param {boolean} isDarkMode - Whether dark mode is enabled
   */
  updateChartsTheme(isDarkMode) {
    // Update chart colors based on theme
    const colors = isDarkMode ? this.darkModeColors : this.colors;
    
    // Update performance chart
    if (this.charts.performance) {
      this.charts.performance.options.scales.x.grid.color = this.hexToRgba(colors.secondary, 0.1);
      this.charts.performance.options.scales.y.grid.color = this.hexToRgba(colors.secondary, 0.1);
      this.charts.performance.options.scales.x.ticks.color = isDarkMode ? '#e0e0e0' : '#666';
      this.charts.performance.options.scales.y.ticks.color = isDarkMode ? '#e0e0e0' : '#666';
      this.charts.performance.update();
    }
    
    // Update allocation chart
    if (this.charts.allocation) {
      this.charts.allocation.options.plugins.legend.labels.color = isDarkMode ? '#e0e0e0' : '#666';
      this.charts.allocation.data.datasets[0].borderColor = colors.light;
      this.charts.allocation.update();
    }
  }

  /**
   * Initialize charts
   */
  initCharts() {
    // Performance chart
    this.initPerformanceChart();

    // Allocation chart
    this.initAllocationChart();
  }

  /**
   * Initialize performance chart
   */
  initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');

    if (!ctx) return;

    this.charts.performance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Valore Portafoglio',
            data: [],
            borderColor: this.colors.primary,
            backgroundColor: this.hexToRgba(this.colors.primary, 0.1),
            borderWidth: 2,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: €${context.raw.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: false,
            grid: {
              color: this.hexToRgba(this.colors.secondary, 0.1)
            },
            ticks: {
              // Modifica le callback per formattare i valori in euro invece di dollari
              callback: function (value) {
                return '€' + value.toFixed(2);
              }
            }
          }
        }
      }
    });
  }

  /**
   * Initialize allocation chart
   */
  initAllocationChart() {
    const ctx = document.getElementById('allocationChart');

    if (!ctx) return;

    this.charts.allocation = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              this.colors.primary,
              this.colors.success,
              this.colors.info,
              this.colors.warning,
              this.colors.danger,
              this.colors.secondary
            ],
            borderWidth: 1,
            borderColor: this.colors.light
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              boxWidth: 12
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.raw;
                const percentage = context.parsed;
                return `${label}: €${value.toFixed(2)} (${percentage.toFixed(2)}%)`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  /**
   * Update performance chart
   * @param {Array} data - Performance data
   */
  updatePerformanceChart(data) {
    if (!this.charts.performance || !data || data.length === 0) return;

    const labels = data.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleDateString();
    });

    const values = data.map(item => item.value);

    this.charts.performance.data.labels = labels;
    this.charts.performance.data.datasets[0].data = values;
    this.charts.performance.update();
  }

  /**
   * Update allocation chart
   * @param {Array} assets - Portfolio assets
   */
  updateAllocationChart(assets) {
    if (!this.charts.allocation || !assets || assets.length === 0) return;

    const labels = assets.map(asset => asset.symbol);
    const values = assets.map(asset => asset.value);

    this.charts.allocation.data.labels = labels;
    this.charts.allocation.data.datasets[0].data = values;
    this.charts.allocation.update();
  }

  /**
   * Convert hex color to rgba
   * @param {string} hex - Hex color
   * @param {number} alpha - Alpha value
   * @returns {string} - RGBA color
   */
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

// Create global charts service instance
const chartsService = new ChartsService();