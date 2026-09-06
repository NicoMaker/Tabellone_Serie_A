// Classe principale della pagina Stagione (Classifica) — stato dell'app,
// gestione tema, caricamento dati e piccoli helper per gli stati della UI.
class StandingsApp {
  constructor() {
    this.teamsData = [];
    this.criteriaLabels = {};
    this.zonesData = {};
    this.currentSortCriteria = "points";
    this.currentFilter = "all";
    this.searchTerm = "";

    this.teamDataUrl = document.getElementById("teamdata").getAttribute("link");
    this.zoneDataUrl = document.getElementById("zonedata").getAttribute("link");
  }

  init() {
    this.initTheme();
    this.bindFilterButtons();
    this.bindRetryButton();
    this.bindSearch();
    this.bindWhatsAppButton();
    this.loadTeamsData();
  }

  // --- Gestione Tema (dark/light) ---
  initTheme() {
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem("theme") || "dark";
    this.applyTheme(savedTheme);

    themeToggle.addEventListener("click", () => {
      const isLight = document.documentElement.classList.contains("light");
      const newTheme = isLight ? "dark" : "light";
      this.applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  applyTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) return;
    const icon = themeToggle.querySelector(".theme-icon");
    if (icon) icon.textContent = theme === "light" ? "🌙" : "🌞";
  }

  // --- Calcolo punti e partite giocate ---
  updateTeamStats(teams) {
    teams.forEach((team) => {
      const pointsFromWins = team.wins * 3;
      const pointsFromDraws = team.draws * 1;
      const totalPoints = pointsFromWins + pointsFromDraws;

      team.points = totalPoints;
      team.matchesPlayed = team.wins + team.draws + team.losses;
    });
  }

  // --- Caricamento dati dai file JSON ---
  async loadTeamsData() {
    try {
      this.showLoading(true);
      this.hideError();
      this.hideNoResults();

      const teamsResponse = await fetch(this.teamDataUrl);
      if (!teamsResponse.ok)
        throw new Error("Errore nel caricamento dei dati delle squadre");
      this.teamsData = await teamsResponse.json();

      this.updateTeamStats(this.teamsData.teams);

      const labelsResponse = await fetch("../../data/criteri.json");
      if (!labelsResponse.ok)
        throw new Error("Errore nel caricamento delle etichette");
      this.criteriaLabels = await labelsResponse.json();

      const zonesResponse = await fetch(this.zoneDataUrl);
      if (!zonesResponse.ok)
        throw new Error("Errore nel caricamento dei dati delle zone");
      this.zonesData = await zonesResponse.json();

      // Avvia sempre con ordinamento per punti
      this.currentSortCriteria = "points";
      this.sortTable("points");
      this.generateLegend();
      this.updateFooterDate();
      this.showLoading(false);
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
      this.showError();
      this.showLoading(false);
    }
  }

  updateFooterDate() {
    const footer = document.getElementById("info");
    if (!footer) return;

    const footerText = footer.querySelector("p");
    if (!footerText) return;

    const seasonHasChampion =
      this.teamsData.champion && this.teamsData.champion.trim() !== "";

    if (seasonHasChampion) {
      footerText.textContent = `© Info Serie A ${this.teamsData.endDate}`;
    } else {
      const today = new Date();
      const day = today.getDate().toString().padStart(2, "0");
      const month = today.toLocaleString("it-IT", { month: "long" });
      const year = today.getFullYear();
      footerText.textContent = `© Info Serie A ${day} ${month} ${year}`;
    }
  }

  // --- Stati UI: loading / errore / nessun risultato ---
  showLoading(show) {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (show) loadingOverlay.style.display = "flex";
    else loadingOverlay.style.display = "none";
  }

  showError() {
    const errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "flex";
  }

  hideError() {
    const errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "none";
  }

  showNoResults() {
    const noResultsMessage = document.getElementById("no-results-message");
    noResultsMessage.style.display = "flex";
  }

  hideNoResults() {
    const noResultsMessage = document.getElementById("no-results-message");
    if (noResultsMessage) noResultsMessage.style.display = "none";
  }

  // --- Zone di classifica (scudetto, champions, europa, retrocessione...) ---
  getTeamZone(position) {
    if (!this.zonesData.zones) return "none";

    for (const zone of this.zonesData.zones)
      if (zone.positions.includes(position)) return zone.name;

    return "none";
  }

  getZoneLabel(zone) {
    if (!this.zonesData.zones) return "";

    const zoneObj = this.zonesData.zones.find((z) => z.name === zone);
    return zoneObj ? zoneObj.label : "";
  }
}
