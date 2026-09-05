// Rendering della tabella e criteri di ordinamento (inclusi i tiebreaker manuali).
Object.assign(StandingsApp.prototype, {
  loadTableData(teams) {
    const tableBody = document
      .getElementById("league-table")
      .getElementsByTagName("tbody")[0];
    tableBody.innerHTML = "";

    if (teams.length === 0) {
      this.showNoResults();
      return;
    }

    this.hideNoResults();

    teams.forEach((team, index) => {
      const goalDifference = team.goalsFor - team.goalsAgainst;

      const row = tableBody.insertRow();
      const position = index + 1;
      const zone = this.getTeamZone(position);

      if (zone !== "none") row.classList.add(`${zone}-zone`);
      row.dataset.zone = zone;

      const positionCell = row.insertCell();
      positionCell.textContent = position;
      positionCell.classList.add("pos-col");

      const teamCell = row.insertCell();
      teamCell.innerHTML = `<img src="${team.image}" alt="${team.name}" class="team-logo-small"> ${team.name}`;
      teamCell.classList.add("team-col");

      const pointsCell = row.insertCell();
      pointsCell.textContent = team.points;
      pointsCell.classList.add("pts-col");

      row.insertCell().textContent = team.matchesPlayed;
      row.insertCell().textContent = team.wins;
      row.insertCell().textContent = team.draws;
      row.insertCell().textContent = team.losses;
      row.insertCell().textContent = team.goalsFor;
      row.insertCell().textContent = team.goalsAgainst;

      const goalDifferenceCell = row.insertCell();
      const goalDifferenceText =
        goalDifference > 0 ? `+${goalDifference}` : goalDifference.toString();
      goalDifferenceCell.textContent = goalDifferenceText;
      goalDifferenceCell.classList.add("goal-difference-col");
      goalDifferenceCell.dataset.value = goalDifferenceText;
    });
  },

  // ─────────────────────────────────────────────────────────────────────
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
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Dato un gruppo di squadre a pari punti, restituisce un indice di
   * priorità basato sui tiebreakers manuali definiti nel JSON.
   * Più basso = posizione migliore.
   *
   * L'algoritmo conta quante volte una squadra PERDE contro le altre del
   * gruppo: chi perde di meno va davanti.
   */
  getTiebreakerScore(teamName, group) {
    const tiebreakers = this.teamsData.tiebreakers || [];
    const groupNames = group.map((t) => t.name);

    let losses = 0;

    groupNames.forEach((opponent) => {
      if (opponent === teamName) return;

      // Cerca una regola che coinvolga questa coppia
      const rule = tiebreakers.find(
        (r) =>
          (r[0] === teamName && r[1] === opponent) ||
          (r[0] === opponent && r[1] === teamName),
      );

      if (rule) {
        // r[0] è il vincitore, r[1] è il perdente
        if (rule[1] === teamName) losses++;
      }
    });

    return losses;
  },

  sortTable(criteria) {
    this.currentSortCriteria = criteria;

    const sortedTeams = this.sortTeamsByCriteria(
        this.teamsData.teams,
        criteria,
      ),
      filteredTeams = this.filterTeamsBySearchTerm(sortedTeams);

    this.loadTableData(filteredTeams);
    this.highlightSelectedButton(criteria);
    this.displaySortingCriteria(criteria);

    if (this.currentFilter !== "all")
      this.filterTableByZone(this.currentFilter);
  },

  sortTeamsByCriteria(teams, criteria) {
    // Raggruppa per punti per poter calcolare i tiebreaker nel contesto corretto
    const grouped = {};
    teams.forEach((t) => {
      const key = t.points;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    return [...teams].sort((a, b) => {
      const aGoalDifference = a.goalsFor - a.goalsAgainst,
        bGoalDifference = b.goalsFor - b.goalsAgainst;

      switch (criteria) {
        case "points":
          return this.sortByPoints(
            a,
            b,
            aGoalDifference,
            bGoalDifference,
            grouped,
          );
        case "goalDifference":
          return this.sortByGoalDifference(aGoalDifference, bGoalDifference);
        case "name":
          return this.sortByName(a, b);
        case "goalsAgainst":
          if (a.goalsAgainst !== b.goalsAgainst)
            return a.goalsAgainst - b.goalsAgainst;
          return b.points - a.points;
        case "losses":
          if (a.losses !== b.losses) return a.losses - b.losses;
          return b.points - a.points;
        default:
          return this.sortByOtherCriteria(a, b, criteria);
      }
    });
  },

  sortByPoints(a, b, aGoalDifference, bGoalDifference, grouped) {
    // 1. Punti
    if (a.points !== b.points) return b.points - a.points;

    // 2. Scontri diretti (tiebreaker manuale) — solo se a pari punti
    const group = grouped[a.points] || [];
    if (
      group.length > 1 &&
      this.teamsData.tiebreakers &&
      this.teamsData.tiebreakers.length > 0
    ) {
      const scoreA = this.getTiebreakerScore(a.name, group);
      const scoreB = this.getTiebreakerScore(b.name, group);
      if (scoreA !== scoreB) return scoreA - scoreB; // meno sconfitte = meglio
    }

    // 3. Partite giocate (meno = meglio, ha una gara in mano)
    if (a.matchesPlayed !== b.matchesPlayed)
      return a.matchesPlayed - b.matchesPlayed;

    // 4. Differenza reti globale
    if (aGoalDifference !== bGoalDifference)
      return bGoalDifference - aGoalDifference;

    // 5. Gol fatti
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;

    // 6. Gol subiti
    if (a.goalsAgainst !== b.goalsAgainst)
      return a.goalsAgainst - b.goalsAgainst;

    // 7. Alfabetico
    return a.name.localeCompare(b.name);
  },

  sortByGoalDifference(aGoalDifference, bGoalDifference) {
    return bGoalDifference - aGoalDifference;
  },

  sortByName(a, b) {
    return a.name.localeCompare(b.name);
  },

  sortByOtherCriteria(a, b, criteria) {
    return (b[criteria] || 0) - (a[criteria] || 0);
  },

  highlightSelectedButton(criteria) {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach((button) => {
      button.classList.remove("selected");
      if (button.dataset.criteria === criteria)
        button.classList.add("selected");
    });
  },

  displaySortingCriteria(criteria) {
    const sortingText = document
      .getElementById("sorting-criteria")
      .querySelector("span");
    sortingText.textContent =
      this.criteriaLabels[criteria] || "Nessun criterio selezionato";
  },
});
