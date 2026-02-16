// Function to create a season card HTML
function createSeasonCard(season, isCurrent) {
  const currentBadge = isCurrent
    ? '<div class="current-badge">In corso</div>'
    : "";
  const championBadge = season.champion
    ? `<div class="champion-badge">${season.champion}</div>`
    : "";

  return `
        <a href="${season.url}" class="season-card">
            ${currentBadge}
            <div class="season-card-header">
                <div class="season-year">${season.year}</div>
                <img src="${season.logo}" alt="Stagione ${season.year}">
            </div>
            <div class="season-card-content">
                ${championBadge}
                <h3>${season.title}</h3>
            </div>
        </a>
    `;
}

// Function to load and display seasons from JSON file
async function loadSeasons() {
  const seasonsGrid = document.getElementById("seasonsGrid");

  try {
    const response = await fetch("data/seasons-data.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    seasonsGrid.innerHTML = "";

    const sortedSeasons = data.seasons.sort((a, b) => {
      const yearA = Number.parseInt(a.year.split("-")[0]);
      const yearB = Number.parseInt(b.year.split("-")[0]);
      return yearB - yearA;
    });

    if (sortedSeasons.length === 0) {
      seasonsGrid.innerHTML =
        '<div class="error-message">Nessuna stagione trovata.</div>';
      return;
    }

    sortedSeasons.forEach((season, index) => {
      if (!("champion" in season)) {
        season.champion = null;
      }

      const isCurrent = index === 0 && season.champion === null;
      seasonsGrid.innerHTML += createSeasonCard(season, isCurrent);
    });

    console.log(`Caricate ${sortedSeasons.length} stagioni con successo`);
    
    // Store seasons data globally for WhatsApp share
    window.seasonsData = sortedSeasons;
  } catch (error) {
    console.error("Errore nel caricamento delle stagioni:", error);
    let errorMessage = "Errore nel caricamento delle stagioni.";

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorMessage =
        "Impossibile caricare il file seasons-data.json. Verifica che il file esista.";
    } else if (error.name === "SyntaxError") {
      errorMessage = "Il file JSON contiene errori di sintassi.";
    } else if (error.message.includes("404")) {
      errorMessage = "File seasons-data.json non trovato.";
    }

    seasonsGrid.innerHTML = `<div class="error-message">${errorMessage}</div>`;
  }
}

// ===========================
// WHATSAPP SHARE - RIEPILOGO STAGIONI
// ===========================

function shareSeasonsOnWhatsApp() {
  if (!window.seasonsData || window.seasonsData.length === 0) {
    alert("Carica prima i dati delle stagioni!");
    return;
  }

  const seasons = window.seasonsData;
  
  let message = "*SERIE A - ARCHIVIO STAGIONI*\n";
  message += `Riepilogo completo\n`;
  message += `${"=".repeat(40)}\n\n`;

  seasons.forEach((season) => {
    const statusText = season.champion ? "COMPLETATA" : "IN CORSO";
    const championText = season.champion ? `\n   Campione: ${season.champion}` : "";
    
    message += `*${season.year}* - ${statusText}${championText}\n\n`;
  });

  message += `${"=".repeat(40)}\n`;
  message += `Serie A Archive - ${seasons.length} stagioni disponibili`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappURL, "_blank");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inizializzazione pagina Generale Stagioni");
  loadSeasons();
  
  // Event listener per pulsante WhatsApp
  const whatsappButton = document.getElementById("whatsapp-share-seasons-btn");
  if (whatsappButton) {
    whatsappButton.addEventListener("click", shareSeasonsOnWhatsApp);
  }
});

// Online/offline status
window.addEventListener("online", () => {
  console.log("Connessione ripristinata");
  loadSeasons();
});

window.addEventListener("offline", () => {
  console.log("Connessione persa");
});

document.querySelector(".main-footer .container").innerHTML = `
    <p>&copy; ${new Date().getFullYear()} Serie A Archive. Tutti i diritti riservati.</p>
`;

document.getElementById("currentYear").innerHTML = `
    <p>&copy; ${new Date().getFullYear()} Serie A Archive. Tutti i diritti riservati.</p>
`;