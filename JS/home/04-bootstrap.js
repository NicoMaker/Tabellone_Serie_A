// Gestione stato connessione + avvio applicazione
Object.assign(SerieATabelloneApp.prototype, {
  initOnlineStatusHandling() {
    window.addEventListener("online", () => {
      console.log("Connessione ripristinata");
      this.loadSeasons();
    });

    window.addEventListener("offline", () => {
      console.log("Connessione persa");
    });
  },
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const app = new SerieATabelloneApp();
  app.init();
});

document.getElementById("footer").innerHTML = `
  <footer>
      <div class="copyright">
          © ${new Date().getFullYear()} Tabellone Serie A. Tutti i diritti riservati.
      </div>
  </footer>`;
