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
  zonedata = document.getElementById("zonedata").getAttribute("link");

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
    const labelsResponse = await fetch("../criteriaLabels.json");
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
  if (!zonesData.zones) return "none";

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
    const goalDifference = team.goalsFor - team.goalsAgainst;

    const row = tableBody.insertRow();
    const position = index + 1;
    const zone = getTeamZone(position); // Ottieni la zona

    if (zone !== "none") row.classList.add(`${zone}-zone`);
    row.dataset.zone = zone;

    if (zone !== "none") {
      const zoneData = zonesData.zones.find((z) => z.name === zone);
    }

    const positionCell = row.insertCell();
    positionCell.textContent = position;

    row.innerHTML += `
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
// Funzione principale per ordinare la tabella
function sortTable(criteria) {
  currentSortCriteria = criteria;

  const sortedTeams = sortTeamsByCriteria(teamsData.teams, criteria),
    filteredTeams = filterTeamsBySearchTerm(sortedTeams);

  loadTableData(filteredTeams);
  highlightSelectedButton(criteria);
  displaySortingCriteria(criteria);

  if (currentFilter !== "all") filterTableByZone(currentFilter);
}

// Funzione per ordinare i team in base al criterio
function sortTeamsByCriteria(teams, criteria) {
  return [...teams].sort((a, b) => {
    const aGoalDifference = a.goalsFor - a.goalsAgainst,
      bGoalDifference = b.goalsFor - b.goalsAgainst;

    switch (criteria) {
      case "points":
        return sortByPoints(a, b, aGoalDifference, bGoalDifference);
      case "goalDifference":
        return sortByGoalDifference(aGoalDifference, bGoalDifference);
      case "name":
        return sortByName(a, b);
      default:
        return sortByOtherCriteria(a, b, criteria);
    }
  });
}

// Funzione per ordinare per punti
function sortByPoints(a, b, aGoalDifference, bGoalDifference) {
  if (a.points !== b.points) return b.points - a.points;

  if (a.matchesPlayed !== b.matchesPlayed)
    return a.matchesPlayed - b.matchesPlayed;

  return bGoalDifference - aGoalDifference;
}

// Funzione per ordinare per differenza reti
const sortByGoalDifference = (aGoalDifference, bGoalDifference) =>
  bGoalDifference - aGoalDifference;

// Funzione per ordinare per nome
const sortByName = (a, b) => a.name.localeCompare(b.name);

// Funzione per ordinare altri criteri
const sortByOtherCriteria = (a, b, criteria) =>
  (b[criteria] || 0) - (a[criteria] || 0);

// Funzione per filtrare i team in base al termine di ricerca
function filterTeamsBySearchTerm(teams) {
  return searchTerm
    ? teams.filter((team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : teams;
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

  highlightLegendItem(zone);

  if (zone === "all") {
    const rows = document.querySelectorAll("#league-table tbody tr");
    rows.forEach((row) => {
      row.style.display = "";
    });
    return;
  }

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
  legend.innerHTML = "";

  if (!zonesData.zones) return;

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

  showLoading(true);

  setTimeout(() => {
    const filteredTeams = teamsData.teams.filter((team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    loadTableData(filteredTeams);

    showLoading(false);

    if (filteredTeams.length === 0) showNoResults();
  }, 500); // Ritardo di 500ms per mostrare l'animazione
}

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".filter-buttons button");
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const criteria = this.dataset.criteria;
      sortTable(criteria);
    });
  });

  document
    .getElementById("retry-button")
    .addEventListener("click", loadTeamsData);

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      searchTeams(this.value);
    });
  }

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
