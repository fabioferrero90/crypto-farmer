/**
 * Theme Service for managing dark mode
 */
class ThemeService {
  constructor() {
    this.darkModeKey = 'darkModeEnabled';
    this.darkModeToggle = document.getElementById('darkModeToggle');

    // Initialize theme
    this.init();
  }

  /**
   * Initialize theme service
   */
  init() {
    // Check if dark mode was previously enabled
    const isDarkMode = localStorage.getItem(this.darkModeKey) === 'true';

    // Set initial state
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      this.updateToggleState(true);
    }

    // Add event listener for toggle
    this.darkModeToggle.addEventListener('click', () => {
      this.toggleDarkMode();
    });

    // Listen for system theme changes if no preference is set
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(this.darkModeKey)) {
        this.setDarkMode(e.matches);
      }
    });
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    const isDarkMode = !document.documentElement.classList.contains('dark');
    this.setDarkMode(isDarkMode);
  }

  /**
   * Set dark mode state
   * @param {boolean} isDarkMode - Whether to enable dark mode
   */
  setDarkMode(isDarkMode) {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    this.updateToggleState(isDarkMode);

    // Save preference to localStorage
    localStorage.setItem(this.darkModeKey, isDarkMode);

    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('darkModeChanged', {
      detail: { isDarkMode }
    }));
  }

  /**
   * Update toggle button state
   * @param {boolean} isDarkMode - Whether dark mode is enabled
   */
  updateToggleState(isDarkMode) {
    // Update the toggle appearance
    const toggleButton = this.darkModeToggle;
    const toggleSpan = toggleButton.querySelector('span');

    if (isDarkMode) {
      toggleSpan.classList.add('dark:translate-x-6');
    } else {
      toggleSpan.classList.remove('dark:translate-x-6');
    }
  }
}

// Initialize theme service
const themeService = new ThemeService();