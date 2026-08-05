// Global variables
let teamsData = [],
  criteriaLabels = {},
  zonesData = {},
  currentSortCriteria = "points",
  currentFilter = "all",
  searchTerm = ""

// --- Gestione Tema (dark/light, come in Risultati) ---
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle")
  if (!themeToggle) return

  const savedTheme = localStorage.getItem("theme") || "dark"
  applyTheme(savedTheme)

  themeToggle.addEventListener("click", () => {
    const isLight = document.documentElement.classList.contains("light")
    const newTheme = isLight ? "dark" : "light"
    applyTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  })
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light")
  const themeToggle = document.getElementById("theme-toggle")
  if (!themeToggle) return
  const icon = themeToggle.querySelector(".theme-icon")
  if (icon) icon.textContent = theme === "light" ? "🌙" : "🌞"
}

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

    // Avvia sempre con ordinamento per punti
    currentSortCriteria = "points"
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
    const day = today.getDate().toString().padStart(2, "0")
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

function getZoneLabel(zone) {
  if (!zonesData.zones) return ""

  const zoneObj = zonesData.zones.find((z) => z.name === zone)
  return zoneObj ? zoneObj.label : ""
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

    const positionCell = row.insertCell()
    positionCell.textContent = position
    positionCell.classList.add("pos-col")

    const teamCell = row.insertCell()
    teamCell.innerHTML = `<img src="${team.image}" alt="${team.name}" class="team-logo-small"> ${team.name}`
    teamCell.classList.add("team-col")

    const pointsCell = row.insertCell()
    pointsCell.textContent = team.points
    pointsCell.classList.add("pts-col")

    row.insertCell().textContent = team.matchesPlayed
    row.insertCell().textContent = team.wins
    row.insertCell().textContent = team.draws
    row.insertCell().textContent = team.losses
    row.insertCell().textContent = team.goalsFor
    row.insertCell().textContent = team.goalsAgainst

    const goalDifferenceCell = row.insertCell()
    const goalDifferenceText = goalDifference > 0 ? `+${goalDifference}` : goalDifference.toString()
    goalDifferenceCell.textContent = goalDifferenceText
    goalDifferenceCell.classList.add("goal-difference-col")
    goalDifferenceCell.dataset.value = goalDifferenceText
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// TIEBREAKER — scontri diretti manuali da points.json
//
// Nel JSON aggiungi (opzionale):
// "tiebreakers": [
//   ["Milan", "Roma"],        ← Milan batte Roma (primo = vince)
//   ["Como", "Juventus"]      ← Como batte Juventus
// ]
//
// Funziona solo quando due squadre hanno gli stessi punti.
// Se non c'è nessuna regola per una coppia, si usa la differenza reti.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dato un gruppo di squadre a pari punti, restituisce un indice di priorità
 * basato sui tiebreakers manuali definiti nel JSON.
 * Più basso = posizione migliore.
 *
 * L'algoritmo conta quante volte una squadra PERDE contro le altre del gruppo:
 * chi perde di meno va davanti.
 */
function getTiebreakerScore(teamName, group) {
  const tiebreakers = teamsData.tiebreakers || []
  const groupNames = group.map((t) => t.name)

  let losses = 0

  groupNames.forEach((opponent) => {
    if (opponent === teamName) return

    // Cerca una regola che coinvolga questa coppia
    const rule = tiebreakers.find(
      (r) =>
        (r[0] === teamName && r[1] === opponent) ||
        (r[0] === opponent && r[1] === teamName)
    )

    if (rule) {
      // r[0] è il vincitore, r[1] è il perdente
      if (rule[1] === teamName) losses++
    }
  })

  return losses
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
  // Raggruppa per punti per poter calcolare i tiebreaker nel contesto corretto
  const grouped = {}
  teams.forEach((t) => {
    const key = t.points
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  return [...teams].sort((a, b) => {
    const aGoalDifference = a.goalsFor - a.goalsAgainst,
      bGoalDifference = b.goalsFor - b.goalsAgainst

    switch (criteria) {
      case "points":
        return sortByPoints(a, b, aGoalDifference, bGoalDifference, grouped)
      case "goalDifference":
        return sortByGoalDifference(aGoalDifference, bGoalDifference)
      case "name":
        return sortByName(a, b)
      case "goalsAgainst":
        if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst
        return b.points - a.points
      case "losses":
        if (a.losses !== b.losses) return a.losses - b.losses
        return b.points - a.points
      default:
        return sortByOtherCriteria(a, b, criteria)
    }
  })
}

function sortByPoints(a, b, aGoalDifference, bGoalDifference, grouped) {
  // 1. Punti
  if (a.points !== b.points) return b.points - a.points

  // 2. Scontri diretti (tiebreaker manuale) — solo se a pari punti
  const group = grouped[a.points] || []
  if (group.length > 1 && teamsData.tiebreakers && teamsData.tiebreakers.length > 0) {
    const scoreA = getTiebreakerScore(a.name, group)
    const scoreB = getTiebreakerScore(b.name, group)
    if (scoreA !== scoreB) return scoreA - scoreB // meno sconfitte = meglio
  }

  // 3. Partite giocate (meno = meglio, ha una gara in mano)
  if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed

  // 4. Differenza reti globale
  if (aGoalDifference !== bGoalDifference) return bGoalDifference - aGoalDifference

  // 5. Gol fatti
  if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor

  // 6. Gol subiti
  if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst

  // 7. Alfabetico
  return a.name.localeCompare(b.name)
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

// ===========================
// WHATSAPP SHARE - CLASSIFICA COMPLETA
// ===========================

function shareStandingsOnWhatsApp() {
  if (!teamsData.teams || teamsData.teams.length === 0) {
    alert("Carica prima i dati della classifica!")
    return
  }

  const sortedTeams = sortTeamsByCriteria(teamsData.teams, "points")
  const seasonBadge = document.querySelector(".season-badge")
  const seasonTitle = seasonBadge ? seasonBadge.textContent.trim() : "Serie A"
  const seasonHasChampion = teamsData.champion && teamsData.champion.trim() !== ""
  const statusText = seasonHasChampion ? "*CLASSIFICA FINALE*" : "*CLASSIFICA ATTUALE*"

  let dateText = ""
  if (seasonHasChampion && teamsData.endDate) {
    dateText = teamsData.endDate
  } else {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, "0")
    const month = today.toLocaleString("it-IT", { month: "long" })
    const year = today.getFullYear()
    dateText = `${day} ${month} ${year}`
  }

  let message = `${statusText}\n`
  message += `*${seasonTitle}*\n`
  message += `${dateText}\n`
  message += `${"=".repeat(40)}\n\n`

  sortedTeams.forEach((team, index) => {
    const position = index + 1
    const goalDiff = team.goalsFor - team.goalsAgainst
    const goalDiffText = goalDiff > 0 ? `+${goalDiff}` : goalDiff.toString()
    const zone = getTeamZone(position)
    const zoneLabel = getZoneLabel(zone)
    const zoneText = zoneLabel ? ` [${zoneLabel}]` : ""

    message += `${position}. ${team.name}${zoneText}\n`
    message += `   Pt: ${team.points} | G: ${team.matchesPlayed} | V: ${team.wins} | P: ${team.draws} | S: ${team.losses}\n`
    message += `   GF: ${team.goalsFor} | GS: ${team.goalsAgainst} | DR: ${goalDiffText}\n\n`
  })

  message += `${"=".repeat(40)}\n`
  message += `Serie A Archive - Classifica completa`

  const encodedMessage = encodeURIComponent(message)
  const whatsappURL = `https://wa.me/?text=${encodedMessage}`
  window.open(whatsappURL, "_blank")
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme()

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

  const whatsappButton = document.getElementById("whatsapp-share-btn")
  if (whatsappButton) {
    whatsappButton.addEventListener("click", shareStandingsOnWhatsApp)
  }

  loadTeamsData()
})