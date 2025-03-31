let teamsData = []; // Variabile per memorizzare i dati delle squadre
let criteriaLabels = {}; // Variabile per memorizzare le etichette dei criteri

// Funzione per caricare i dati da un file JSON
async function loadTeamsData() {
  try {
    // Carica i dati delle squadre
    const teamsResponse = await fetch("JSON/teamsData.json");
    teamsData = await teamsResponse.json(); // Memorizza i dati delle squadre

    // Carica le etichette dei criteri
    const labelsResponse = await fetch("JSON/criteriaLabels.json");
    criteriaLabels = await labelsResponse.json(); // Memorizza le etichette

    loadTableData(teamsData.teams); // Carica i dati iniziali nella tabella
    sortTable("points"); // Ordina inizialmente per Punti
    highlightSelectedButton("points"); // Evidenzia il pulsante "Punti"
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
  }
}

// Funzione per caricare i dati nella tabella
function loadTableData(teams) {
  const tableBody = document
    .getElementById("league-table")
    .getElementsByTagName("tbody")[0];
  tableBody.innerHTML = ""; // Pulisce la tabella

  teams.forEach((team, index) => {
    const row = tableBody.insertRow();
    row.innerHTML = ` 
      <td>${index + 1}</td>
      <td><img src="${team.image}" alt="${team.name}" width="30" height="30"> ${team.name}</td>
      <td>${team.points}</td>
      <td>${team.matchesPlayed}</td>
      <td>${team.wins}</td>
      <td>${team.draws}</td>
      <td>${team.losses}</td>
      <td>${team.goalsFor}</td>
      <td>${team.goalsAgainst}</td>
      <td>${team.goalsFor - team.goalsAgainst}</td> <!-- Differenza reti calcolata -->
    `;
  });
}

// Funzione per ordinare la tabella
function sortTable(criteria) {
  const sortedTeams = [...teamsData.teams].sort((a, b) => {
    if (
      criteria === "goalDifference" ||
      criteria === "points" ||
      criteria === "wins" ||
      criteria === "goalsFor" ||
      criteria === "goalsAgainst" ||
      criteria === "losses" ||
      criteria === "draws"
    )
      return (b[criteria] || 0) - (a[criteria] || 0); // Ordinamento decrescente, evitando NaN
    return a[criteria].localeCompare(b[criteria]); // Ordinamento alfabetico
  });

  loadTableData(sortedTeams); // Ricarica i dati nella tabella
  highlightSelectedButton(criteria); // Cambia il colore dei pulsanti
  displaySortingCriteria(criteria); // Mostra il criterio di ordinamento selezionato
}

// Funzione per evidenziare il pulsante selezionato
function highlightSelectedButton(criteria) {
  const buttons = document.querySelectorAll(".controls button");
  buttons.forEach((button) => button.classList.remove("selected"));
  const selectedButton = document.querySelector(
    `button[data-criteria="${criteria}"]`
  );
  if (selectedButton) selectedButton.classList.add("selected");
}

// Funzione per mostrare il criterio di ordinamento
function displaySortingCriteria(criteria) {
  const sortingText = document.getElementById("sorting-criteria");
  sortingText.textContent = `Ordinato per: ${
    criteriaLabels[criteria] || "Nessun criterio selezionato"
  }`;
}

// Carica i dati iniziali delle squadre
loadTeamsData();
