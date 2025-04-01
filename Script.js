// Variabili globali
let teamsData = [],
  criteriaLabels = {},
  currentSortCriteria = "points",
  currentFilter = "all"; // Nuovo: tiene traccia del filtro attuale

// Funzione per caricare i dati da un file JSON
async function loadTeamsData() {
  try {
    showLoading(true);
    hideError();

    // Carica i dati delle squadre
    const teamsResponse = await fetch("JSON/teamsData.json");
    if (!teamsResponse.ok)
      throw new Error("Errore nel caricamento dei dati delle squadre");
    teamsData = await teamsResponse.json();

    // Carica le etichette dei criteri
    const labelsResponse = await fetch("JSON/criteriaLabels.json");
    if (!labelsResponse.ok)
      throw new Error("Errore nel caricamento delle etichette");
    criteriaLabels = await labelsResponse.json();

    // Carica i dati iniziali nella tabella
    loadTableData(teamsData.teams);

    // Ordina inizialmente per Punti
    sortTable("points");

    // Nascondi il loader
    showLoading(false);
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
    showError();
    showLoading(false);
  }
}

// Funzione per mostrare/nascondere il loader
function showLoading(show) {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (show) loadingOverlay.style.display = "flex";
  else loadingOverlay.style.display = "none";
}

// Funzione per mostrare il messaggio di errore
function showError() {
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "block";
}

// Funzione per nascondere il messaggio di errore
function hideError() {
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "none";
}

// Funzione per caricare i dati nella tabella
function loadTableData(teams) {
  const tableBody = document
    .getElementById("league-table")
    .getElementsByTagName("tbody")[0];
  tableBody.innerHTML = ""; // Pulisce la tabella

  teams.forEach((team, index) => {
    // Calcola la differenza reti
    const goalDifference = team.goalsFor - team.goalsAgainst;

    // Crea la riga della tabella
    const row = tableBody.insertRow();

    // Aggiungi classi per le zone di classifica
    if (index < 4) {
      row.classList.add("champions-zone");
      row.dataset.zone = "champions";
    } else if (index === 4) {
      row.classList.add("europa-zone");
      row.dataset.zone = "europa";
    } else if (index === 5) {
      row.classList.add("conference-zone");
      row.dataset.zone = "conference";
    } else if (index >= teams.length - 3) {
      row.classList.add("relegation-zone");
      row.dataset.zone = "relegation";
    } else row.dataset.zone = "none";

    // Inserisci i dati nella riga
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><img src="${team.image}" alt="${team.name}" width="30" height="30"> ${
      team.name
    }</td>
      <td>${team.points}</td>
      <td>${team.matchesPlayed}</td>
      <td>${team.wins}</td>
      <td>${team.draws}</td>
      <td>${team.losses}</td>
      <td>${team.goalsFor}</td>
      <td>${team.goalsAgainst}</td>
      <td>${goalDifference > 0 ? "+" + goalDifference : goalDifference}</td>
    `;
  });
}

// Funzione per ordinare la tabella
function sortTable(criteria) {
  currentSortCriteria = criteria;

  const sortedTeams = [...teamsData.teams].sort((a, b) => {
    // Calcola la differenza reti prima di ordinare
    const aGoalDifference = a.goalsFor - a.goalsAgainst;
    const bGoalDifference = b.goalsFor - b.goalsAgainst;

    // Gestisci l'ordinamento per vari criteri
    if (criteria === "goalDifference") {
      return bGoalDifference - aGoalDifference;
    }

    if (criteria === "name") {
      return a[criteria].localeCompare(b[criteria]); // Ordinamento alfabetico
    }

    // Per tutti gli altri criteri numerici (ordinamento decrescente)
    return (b[criteria] || 0) - (a[criteria] || 0);
  });

  loadTableData(sortedTeams);
  highlightSelectedButton(criteria);
  displaySortingCriteria(criteria);

  // Riapplica il filtro corrente dopo l'ordinamento
  if (currentFilter !== "all") {
    filterTableByZone(currentFilter);
  }
}

// Funzione per evidenziare il pulsante selezionato
function highlightSelectedButton(criteria) {
  const buttons = document.querySelectorAll(".filter-buttons button");
  buttons.forEach((button) => {
    button.classList.remove("selected");
    if (button.dataset.criteria === criteria) button.classList.add("selected");
  });
}

// Funzione per mostrare il criterio di ordinamento
function displaySortingCriteria(criteria) {
  const sortingText = document
    .getElementById("sorting-criteria")
    .querySelector("span");
  sortingText.textContent =
    criteriaLabels[criteria] || "Nessun criterio selezionato";
}

// Nuova funzione per filtrare la tabella per zona
function filterTableByZone(zone) {
  currentFilter = zone;

  // Evidenzia l'elemento della legenda selezionato
  highlightLegendItem(zone);

  // Se è "all", mostra tutte le righe
  if (zone === "all") {
    const rows = document.querySelectorAll("#league-table tbody tr");
    rows.forEach((row) => {
      row.style.display = "";
    });
    return;
  }

  // Altrimenti, filtra per zona
  const rows = document.querySelectorAll("#league-table tbody tr");
  rows.forEach((row) => {
    if (row.dataset.zone === zone) row.style.display = "";
    else row.style.display = "none";
  });
}

// Funzione per evidenziare l'elemento della legenda selezionato
function highlightLegendItem(zone) {
  const legendItems = document.querySelectorAll(".legend-item");
  legendItems.forEach((item) => {
    item.classList.remove("selected-legend");
  });

  if (zone !== "all") {
    document
      .querySelector(`.legend-item.${zone}`)
      .classList.add("selected-legend");
  }
}

// Aggiungi event listener ai pulsanti di ordinamento
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".filter-buttons button");
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const criteria = this.dataset.criteria;
      sortTable(criteria);
    });
  });

  // Aggiungi event listener al pulsante di retry
  document
    .getElementById("retry-button")
    .addEventListener("click", loadTeamsData);

  // Aggiungi event listener agli elementi della legenda
  const legendItems = document.querySelectorAll(".legend-item");
  legendItems.forEach((item) => {
    item.style.cursor = "pointer"; // Cambia il cursore per indicare che è cliccabile

    item.addEventListener("click", function () {
      const zone = this.classList[1]; // champions, europa, conference, relegation
      filterTableByZone(zone);
    });
  });

  // Aggiungi un pulsante per mostrare tutte le squadre
  const legend = document.querySelector(".legend");
  const resetButton = document.createElement("div");
  resetButton.className = "legend-item reset";
  resetButton.innerHTML = `
    <span class="legend-color" style="background-color: #999;"></span>
    <span>Mostra tutte</span>
  `;
  resetButton.style.cursor = "pointer";
  resetButton.addEventListener("click", function () {
    filterTableByZone("all");
  });
  legend.appendChild(resetButton);

  // Carica i dati iniziali
  loadTeamsData();
});

const info = `&copy; Info Serie A ${
  (new Date().getDate() < 10 ? "0" : "") + new Date().getDate()
} ${
  [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ][new Date().getMonth()]
} ${new Date().getFullYear()}`;

document.getElementById("info").innerHTML = `<footer>${info}</footer>`;
