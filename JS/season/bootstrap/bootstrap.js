// Binding degli eventi UI e avvio dell'applicazione.
Object.assign(StandingsApp.prototype, {
  bindFilterButtons() {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const criteria = button.dataset.criteria;
        this.sortTable(criteria);
      });
    });
  },

  bindRetryButton() {
    document
      .getElementById("retry-button")
      .addEventListener("click", () => this.loadTeamsData());
  },

  bindSearch() {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        this.searchTeams(searchInput.value);
      });
    }
  },

  bindWhatsAppButton() {
    const whatsappButton = document.getElementById("whatsapp-share-btn");
    if (whatsappButton) {
      whatsappButton.addEventListener("click", () =>
        this.shareStandingsOnWhatsApp(),
      );
    }
  },
});

// Inizializzazione
document.addEventListener("DOMContentLoaded", () => {
  const app = new StandingsApp();
  app.init();
});
