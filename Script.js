let teamsData = []; // Variabile per memorizzare i dati delle squadre

// Funzione per caricare i dati da un file JSON
async function loadTeamsData() {
  try {
    const response = await fetch("teamsData.json");
    teamsData = await response.json(); // Memorizza i dati
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
      <td>${
        team.goalsFor - team.goalsAgainst
      }</td> <!-- Differenza reti calcolata -->
    `;
  });
}

// Funzione per ordinare la tabella
function sortTable(criteria) {
  // Ordina i dati in base al criterio selezionato
  const sortedTeams = [...teamsData.teams].sort((a, b) => {
    // Se il criterio è un numero (per esempio, punti, vittorie, gol fatti, gol subiti, sconfitte)
    if (
      criteria === "goalDifference" ||
      criteria === "points" ||
      criteria === "wins" ||
      criteria === "goalsFor" ||
      criteria === "goalsAgainst" ||
      criteria === "losses" ||
      criteria === "draws"
    )
      // Gestiamo il caso in cui uno dei valori sia NaN (non un numero)
      return (b[criteria] || 0) - (a[criteria] || 0); // Ordinamento decrescente, evitando NaN
    // Se il criterio è una stringa (per esempio, nome della squadra)
    return a[criteria].localeCompare(b[criteria]); // Ordinamento alfabetico
  });

  // Ricarica i dati nella tabella
  loadTableData(sortedTeams);

  // Cambia il colore dei pulsanti per evidenziare il criterio selezionato
  highlightSelectedButton(criteria);

  // Mostra il criterio di ordinamento selezionato
  displaySortingCriteria(criteria);
}

// Funzione per evidenziare il pulsante selezionato
function highlightSelectedButton(criteria) {
  // Rimuovi la classe 'selected' da tutti i pulsanti
  const buttons = document.querySelectorAll(".controls button");
  buttons.forEach((button) => button.classList.remove("selected"));

  // Aggiungi la classe 'selected' al pulsante corrispondente
  const selectedButton = document.querySelector(
    `button[data-criteria="${criteria}"]`
  );
  if (selectedButton) selectedButton.classList.add("selected");
}

// Funzione per mostrare il criterio di ordinamento
function displaySortingCriteria(criteria) {
  const sortingText = document.getElementById("sorting-criteria"),
    criteriaText = {
      points: "Punti",
      wins: "Vittorie",
      goalDifference: "Differenza Reti",
      goalsFor: "Gol Fatti",
      goalsAgainst: "Gol Subiti",
      name: "Nome",
      losses: "Sconfitte",
      draws: "Pareggi",
    };
  sortingText.textContent = `Ordinato per: ${
    criteriaText[criteria] || "Nessun criterio selezionato"
  }`;
}

// Carica i dati iniziali delle squadre
loadTeamsData();
