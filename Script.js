// Variabili globali
let teamsData = [],
  criteriaLabels = {},
  zonesData = {}, // Nuova variabile per i dati delle zone
  currentSortCriteria = "points",
  currentFilter = "all", // Tiene traccia del filtro attuale
  searchTerm = ""; // Variabile per il termine di ricerca

// Funzione per calcolare i punti e il totale delle partite
function updateTeamStats(teams) {
  teams.forEach((team) => {
    // Calcolo dei punti per la squadra
    const pointsFromWins = team.wins * 3; // Ogni vittoria dà 3 punti
    const pointsFromDraws = team.draws * 1; // Ogni pareggio dà 1 punto
    const totalPoints = pointsFromWins + pointsFromDraws;

    // Aggiorniamo i punti nel team (senza modificarli nel JSON originale)
    team.points = totalPoints;

    // Calcoliamo anche il totale delle partite, senza scriverlo nel JSON
    team.matchesPlayed = team.wins + team.draws + team.losses;
  });
}

const teamdata = document.getElementById("teamdata").getAttribute("link"),
  zonedata = document.getElementById("teamdata").getAttribute("link");

// Funzione per caricare i dati da un file JSON
async function loadTeamsData() {
  try {
    showLoading(true);
    hideError();
    hideNoResults(); // Nascondi il messaggio "nessun risultato"

    // Carica i dati delle squadre
    const teamsResponse = await fetch(teamdata);
    if (!teamsResponse.ok)
      throw new Error("Errore nel caricamento dei dati delle squadre");
    teamsData = await teamsResponse.json();

    // Calcoliamo e aggiorniamo le statistiche delle squadre
    updateTeamStats(teamsData.teams);

    // Carica le etichette dei criteri
    const labelsResponse = await fetch("JSON/criteriaLabels.json");
    if (!labelsResponse.ok)
      throw new Error("Errore nel caricamento delle etichette");
    criteriaLabels = await labelsResponse.json();

    // Carica i dati delle zone
    const zonesResponse = await fetch(zonedata);
    if (!zonesResponse.ok)
      throw new Error("Errore nel caricamento dei dati delle zone");
    zonesData = await zonesResponse.json();

    // Carica i dati iniziali nella tabella
    loadTableData(teamsData.teams);

    // Ordina inizialmente per Punti
    sortTable("points");

    // Genera la legenda basata sui dati delle zone
    generateLegend();

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

// Funzione per mostrare il messaggio "nessun risultato"
function showNoResults() {
  const noResultsMessage = document.getElementById("no-results-message");
  noResultsMessage.style.display = "flex";
}

// Funzione per nascondere il messaggio "nessun risultato"
function hideNoResults() {
  const noResultsMessage = document.getElementById("no-results-message");
  if (noResultsMessage) noResultsMessage.style.display = "none";
}

// Funzione per determinare la zona di una squadra in base alla posizione
function getTeamZone(position) {
  // Se non abbiamo ancora caricato i dati delle zone, restituisci "none"
  if (!zonesData.zones) return "none";

  // Controlla in quale zona si trova la posizione
  for (const zone of zonesData.zones)
    if (zone.positions.includes(position)) return zone.name;

  return "none";
}

// Funzione per caricare i dati nella tabella
function loadTableData(teams) {
  const tableBody = document
    .getElementById("league-table")
    .getElementsByTagName("tbody")[0];
  tableBody.innerHTML = ""; // Pulisce la tabella

  // Se non ci sono squadre da mostrare, mostra il messaggio "nessun risultato"
  if (teams.length === 0) {
    showNoResults();
    return;
  }

  // Altrimenti, nascondi il messaggio "nessun risultato"
  hideNoResults();

  teams.forEach((team, index) => {
    // Calcola la differenza reti
    const goalDifference = team.goalsFor - team.goalsAgainst;

    // Crea la riga della tabella
    const row = tableBody.insertRow();

    // Determina la zona in base alla posizione
    const position = index + 1,
      zone = getTeamZone(position);

    // Aggiungi la classe della zona e il dataset
    if (zone !== "none") row.classList.add(`${zone}-zone`);
    row.dataset.zone = zone;

    // Inserisci i dati nella riga
    row.innerHTML = `
      <td>${position}</td>
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
    const aGoalDifference = a.goalsFor - a.goalsAgainst,
      bGoalDifference = b.goalsFor - b.goalsAgainst;

    // Gestisci l'ordinamento per vari criteri
    if (criteria === "goalDifference") return bGoalDifference - aGoalDifference;

    if (criteria === "name") return a[criteria].localeCompare(b[criteria]); // Ordinamento alfabetico

    // Per tutti gli altri criteri numerici (ordinamento decrescente)
    return (b[criteria] || 0) - (a[criteria] || 0);
  });

  // Applica il filtro di ricerca se c'è un termine di ricerca
  const filteredTeams = searchTerm
    ? sortedTeams.filter((team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedTeams;

  loadTableData(filteredTeams);
  highlightSelectedButton(criteria);
  displaySortingCriteria(criteria);

  // Riapplica il filtro corrente dopo l'ordinamento
  if (currentFilter !== "all") filterTableByZone(currentFilter);
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

// Funzione per filtrare la tabella per zona
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
    const selectedItem = document.querySelector(`.legend-item.${zone}`);
    if (selectedItem) selectedItem.classList.add("selected-legend");
  }
}

// Funzione per generare dinamicamente la legenda basata sui dati delle zone
function generateLegend() {
  const legend = document.querySelector(".legend");
  legend.innerHTML = ""; // Pulisce la legenda esistente

  // Se non abbiamo ancora caricato i dati delle zone, esci
  if (!zonesData.zones) return;

  // Aggiungi elementi della legenda basati sui dati JSON
  zonesData.zones.forEach((zone) => {
    const legendItem = document.createElement("div");
    legendItem.className = `legend-item ${zone.name}`;
    legendItem.innerHTML = `
      <span class="legend-color" style="background-color: ${zone.color};"></span>
      <span>${zone.label}</span>
    `;
    legendItem.style.cursor = "pointer";
    legendItem.addEventListener("click", function () {
      filterTableByZone(zone.name);
    });
    legend.appendChild(legendItem);
  });

  // Aggiungi un pulsante per mostrare tutte le squadre
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
}

// Funzione per cercare le squadre
function searchTeams(term) {
  searchTerm = term.trim();

  // Mostra il loader durante la ricerca
  showLoading(true);

  // Simula un ritardo di ricerca per mostrare il loader
  setTimeout(() => {
    // Filtra le squadre in base al termine di ricerca
    const filteredTeams = teamsData.teams.filter((team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Carica i dati filtrati nella tabella
    loadTableData(filteredTeams);

    // Nascondi il loader
    showLoading(false);

    // Se non ci sono risultati, mostra il messaggio "nessun risultato"
    if (filteredTeams.length === 0) showNoResults();
  }, 500); // Ritardo di 500ms per mostrare l'animazione
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

  // Aggiungi event listener al campo di ricerca
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      searchTeams(this.value);
    });
  }

  // Carica i dati iniziali
  loadTeamsData();
});

// Funzione per convertire JSON in CSV
function convertToCSV(objArray) {
  const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
  let csv = "";
  const headers = Object.keys(array[0]).join(","); // Intestazioni
  csv += headers + "\n";

  array.forEach((row) => {
    const values = Object.values(row).map((val) =>
      typeof val === "string" ? `"${val}"` : val
    );
    csv += values.join(",") + "\n";
  });

  return csv;
}

// Funzione per scaricare i dati in CSV
function downloadCSV() {
  if (teamsData.length === 0) {
    alert("Nessun dato disponibile per il download!");
    return;
  }

  const csvContent = convertToCSV(teamsData.teams),
    blob = new Blob([csvContent], { type: "text/csv" }),
    link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "teams_data.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Funzione per visualizzare i dati in tabella (aggiunta per completezza)
function renderTable() {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = "";

  teamsData.teams.forEach((team) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><img src="${team.image}" width="30"></td>
      <td>${team.name}</td>
      <td>${team.points}</td>
      <td>${team.matchesPlayed}</td>
      <td>${team.wins}</td>
      <td>${team.draws}</td>
      <td>${team.losses}</td>
      <td>${team.goalsFor}</td>
      <td>${team.goalsAgainst}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Bottone per scaricare il CSV
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("download-csv")
    .addEventListener("click", downloadCSV);
  loadTeamsData();
});

// Funzione per convertire JSON in CSV (senza immagini)
function convertToCSV(objArray) {
  const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
  let csv = "";

  // Prendiamo le chiavi escludendo 'image'
  const headers = Object.keys(array[0])
    .filter((key) => key !== "image")
    .join(",");
  csv += headers + "\n";

  array.forEach((row) => {
    const values = Object.entries(row)
      .filter(([key]) => key !== "image") // Escludiamo l'immagine
      .map(([_, val]) => (typeof val === "string" ? `"${val}"` : val));

    csv += values.join(",") + "\n";
  });

  return csv;
}

// Funzione per scaricare il CSV
function downloadJSON() {
  if (teamsData.length === 0) {
    alert("Nessun dato disponibile per il download!");
    return;
  }

  const jsonContent = JSON.stringify(teamsData, null, 2),
    blob = new Blob([jsonContent], { type: "application/json" }),
    link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "teams_data.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Eventi per i bottoni di download
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("download-csv")
    .addEventListener("click", downloadCSV);
  document
    .getElementById("download-json")
    .addEventListener("click", downloadJSON);
  loadTeamsData();
});

// Aggiorna il footer con la data corrente
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
