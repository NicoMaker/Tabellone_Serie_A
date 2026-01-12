// Global variables
let teamsData = [],
  criteriaLabels = {},
  zonesData = {},
  currentSortCriteria = "points",
  currentFilter = "all",
  searchTerm = ""

// Function to calculate points and total matches
function updateTeamStats(teams) {
  teams.forEach((team) => {
    const pointsFromWins = team.wins * 3
    const pointsFromDraws = team.draws * 1
    const totalPoints = pointsFromWins + pointsFromDraws

    team.points = totalPoints
    team.matchesPlayed = team.wins + team.draws + team.losses
  })
}

const teamdata = document.getElementById("teamdata").getAttribute("link"),
  zonedata = document.getElementById("zonedata").getAttribute("link")

// Function to load data from JSON files
async function loadTeamsData() {
  try {
    showLoading(true)
    hideError()
    hideNoResults()

    const teamsResponse = await fetch(teamdata)
    if (!teamsResponse.ok) throw new Error("Errore nel caricamento dei dati delle squadre")
    teamsData = await teamsResponse.json()

    updateTeamStats(teamsData.teams)

    const labelsResponse = await fetch("../../data/criteri.json")
    if (!labelsResponse.ok) throw new Error("Errore nel caricamento delle etichette")
    criteriaLabels = await labelsResponse.json()

    const zonesResponse = await fetch(zonedata)
    if (!zonesResponse.ok) throw new Error("Errore nel caricamento dei dati delle zone")
    zonesData = await zonesResponse.json()

    loadTableData(teamsData.teams)
    sortTable("points")
    generateLegend()
    updateFooterDate()
    showLoading(false)
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error)
    showError()
    showLoading(false)
  }
}

// ✅ Funzione aggiornata con giorno a due cifre
function updateFooterDate() {
  const footer = document.getElementById("info")
  if (!footer) return

  const footerText = footer.querySelector("p")
  if (!footerText) return

  const seasonHasChampion = teamsData.champion && teamsData.champion.trim() !== ""

  if (seasonHasChampion) {
    footerText.textContent = `© Info Serie A ${teamsData.endDate}`
  } else {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, "0") // aggiunge 0 davanti se < 10
    const month = today.toLocaleString("it-IT", { month: "long" })
    const year = today.getFullYear()
    footerText.textContent = `© Info Serie A ${day} ${month} ${year}`
  }
}

function showLoading(show) {
  const loadingOverlay = document.getElementById("loading-overlay")
  if (show) loadingOverlay.style.display = "flex"
  else loadingOverlay.style.display = "none"
}

function showError() {
  const errorMessage = document.getElementById("error-message")
  errorMessage.style.display = "flex"
}

function hideError() {
  const errorMessage = document.getElementById("error-message")
  errorMessage.style.display = "none"
}

function showNoResults() {
  const noResultsMessage = document.getElementById("no-results-message")
  noResultsMessage.style.display = "flex"
}

function hideNoResults() {
  const noResultsMessage = document.getElementById("no-results-message")
  if (noResultsMessage) noResultsMessage.style.display = "none"
}

function getTeamZone(position) {
  if (!zonesData.zones) return "none"

  for (const zone of zonesData.zones)
    if (zone.positions.includes(position)) return zone.name

  return "none"
}

function loadTableData(teams) {
  const tableBody = document.getElementById("league-table").getElementsByTagName("tbody")[0]
  tableBody.innerHTML = ""

  if (teams.length === 0) {
    showNoResults()
    return
  }

  hideNoResults()

  teams.forEach((team, index) => {
    const goalDifference = team.goalsFor - team.goalsAgainst

    const row = tableBody.insertRow()
    const position = index + 1
    const zone = getTeamZone(position)

    if (zone !== "none") row.classList.add(`${zone}-zone`)
    row.dataset.zone = zone

    // Position
    const positionCell = row.insertCell()
    positionCell.textContent = position
    positionCell.classList.add("pos-col")

    // Team
    const teamCell = row.insertCell()
    teamCell.innerHTML = `<img src="${team.image}" alt="${team.name}" width="36" height="36"> ${team.name}`
    teamCell.classList.add("team-col")

    // Stats
    const pointsCell = row.insertCell()
    pointsCell.textContent = team.points
    pointsCell.classList.add("pts-col")

    row.insertCell().textContent = team.matchesPlayed // G
    row.insertCell().textContent = team.wins // V
    row.insertCell().textContent = team.draws // N
    row.insertCell().textContent = team.losses // S
    row.insertCell().textContent = team.goalsFor // GF
    row.insertCell().textContent = team.goalsAgainst // GS

    // Goal Difference
    const goalDifferenceCell = row.insertCell()
    const goalDifferenceText = goalDifference > 0 ? `+${goalDifference}` : goalDifference.toString()
    goalDifferenceCell.textContent = goalDifferenceText
    goalDifferenceCell.classList.add("goal-difference-col") // Classe per lo stile
    goalDifferenceCell.dataset.value = goalDifferenceText // Attributo per il selettore CSS
  })
}

function sortTable(criteria) {
  currentSortCriteria = criteria

  const sortedTeams = sortTeamsByCriteria(teamsData.teams, criteria),
    filteredTeams = filterTeamsBySearchTerm(sortedTeams)

  loadTableData(filteredTeams)
  highlightSelectedButton(criteria)
  displaySortingCriteria(criteria)

  if (currentFilter !== "all") filterTableByZone(currentFilter)
}

function sortTeamsByCriteria(teams, criteria) {
  return [...teams].sort((a, b) => {
    const aGoalDifference = a.goalsFor - a.goalsAgainst,
      bGoalDifference = b.goalsFor - b.goalsAgainst

    switch (criteria) {
      case "points":
        return sortByPoints(a, b, aGoalDifference, bGoalDifference)
      case "goalDifference":
        return sortByGoalDifference(aGoalDifference, bGoalDifference)
      case "name":
        return sortByName(a, b)
      default:
        return sortByOtherCriteria(a, b, criteria)
    }
  })
}

function sortByPoints(a, b, aGoalDifference, bGoalDifference) {
  if (a.points !== b.points) return b.points - a.points
  if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed
  return bGoalDifference - aGoalDifference
}

const sortByGoalDifference = (aGoalDifference, bGoalDifference) => bGoalDifference - aGoalDifference
const sortByName = (a, b) => a.name.localeCompare(b.name)
const sortByOtherCriteria = (a, b, criteria) => (b[criteria] || 0) - (a[criteria] || 0)

function filterTeamsBySearchTerm(teams) {
  return searchTerm
    ? teams.filter((team) => team.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : teams
}

function highlightSelectedButton(criteria) {
  const buttons = document.querySelectorAll(".filter-btn")
  buttons.forEach((button) => {
    button.classList.remove("selected")
    if (button.dataset.criteria === criteria) button.classList.add("selected")
  })
}

function displaySortingCriteria(criteria) {
  const sortingText = document.getElementById("sorting-criteria").querySelector("span")
  sortingText.textContent = criteriaLabels[criteria] || "Nessun criterio selezionato"
}

function filterTableByZone(zone) {
  currentFilter = zone
  highlightLegendItem(zone)

  const rows = document.querySelectorAll("#league-table tbody tr")

  if (zone === "champions") {
    rows.forEach((row) => {
      if (row.dataset.zone === "champions" || row.dataset.zone === "championship") {
        row.style.display = ""
      } else {
        row.style.display = "none"
      }
    })
    return
  }

  if (zone === "all") {
    rows.forEach((row) => {
      row.style.display = ""
    })
    return
  }

  rows.forEach((row) => {
    if (row.dataset.zone === zone) {
      row.style.display = ""
    } else {
      row.style.display = "none"
    }
  })
}

function highlightLegendItem(zone) {
  const legendItems = document.querySelectorAll(".legend-item")
  legendItems.forEach((item) => {
    item.classList.remove("selected-legend")
  })

  if (zone !== "all") {
    const selectedItem = document.querySelector(`.legend-item.${zone}`)
    if (selectedItem) selectedItem.classList.add("selected-legend")
  }
}

function generateLegend() {
  const legend = document.querySelector(".legend")
  legend.innerHTML = ""

  if (!zonesData.zones) return

  zonesData.zones.forEach((zone) => {
    const legendItem = document.createElement("div")
    legendItem.className = `legend-item ${zone.name}`
    legendItem.innerHTML = `
      <span class="legend-color" style="background-color: ${zone.color};"></span>
      <span>${zone.label}</span>
    `
    legendItem.style.cursor = "pointer"
    legendItem.addEventListener("click", () => {
      filterTableByZone(zone.name)
    })
    legend.appendChild(legendItem)
  })

  const resetButton = document.createElement("div")
  resetButton.className = "legend-item reset"
  resetButton.innerHTML = `
    <span class="legend-color" style="background-color: #64748b;"></span>
    <span>Mostra tutte</span>
  `
  resetButton.style.cursor = "pointer"
  resetButton.addEventListener("click", () => {
    filterTableByZone("all")
  })
  legend.appendChild(resetButton)
}

function searchTeams(term) {
  searchTerm = term.trim()
  showLoading(true)

  setTimeout(() => {
    const filteredTeams = teamsData.teams.filter((team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    loadTableData(filteredTeams)
    showLoading(false)

    if (filteredTeams.length === 0) showNoResults()
  }, 300)
}

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".filter-btn")
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const criteria = this.dataset.criteria
      sortTable(criteria)
    })
  })

  document.getElementById("retry-button").addEventListener("click", loadTeamsData)

  const searchInput = document.getElementById("search-input")
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      searchTeams(this.value)
    })
  }

  loadTeamsData()
})