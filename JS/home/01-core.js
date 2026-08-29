// Classe principale della Home (Archivio Stagioni) — stato, tema dark/light
// e riferimenti DOM condivisi dagli altri moduli.
class SerieATabelloneApp {
  constructor() {
    this.seasonsGrid = document.getElementById("seasonsGrid");
    this.themeToggle = document.getElementById("theme-toggle");
    this.seasonsData = null;
  }

  init() {
    console.log("Inizializzazione Tabellone - Archivio Stagioni");
    this.initTheme();
    this.loadSeasons();
    this.initOnlineStatusHandling();
    this.initWhatsAppButton();
  }

  // --- Gestione Tema ---
  initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    this.applyTheme(savedTheme);

    this.themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.classList.contains("light")
        ? "light"
        : "dark";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      this.applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  applyTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");
    this.updateThemeIcon(theme);
  }

  updateThemeIcon(theme) {
    if (!this.themeToggle) return;
    const icon = this.themeToggle.querySelector(".theme-icon");
    icon && (icon.textContent = theme === "light" ? "🌙" : "🌞");
  }
}
