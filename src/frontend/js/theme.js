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
      document.body.classList.add('dark-mode');
      this.darkModeToggle.checked = true;
    }
    
    // Add event listener for toggle
    this.darkModeToggle.addEventListener('change', () => {
      this.toggleDarkMode();
    });
  }
  
  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    const isDarkMode = this.darkModeToggle.checked;
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Save preference to localStorage
    localStorage.setItem(this.darkModeKey, isDarkMode);
    
    // Dispatch event for other components to react
    document.dispatchEvent(new CustomEvent('darkModeChanged', { 
      detail: { isDarkMode } 
    }));
  }
}

// Create global theme service instance
const themeService = new ThemeService();