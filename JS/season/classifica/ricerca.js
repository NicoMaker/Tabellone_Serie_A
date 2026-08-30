// Ricerca squadre per nome, con piccolo debounce visivo tramite lo stato di loading.
Object.assign(StandingsApp.prototype, {
  filterTeamsBySearchTerm(teams) {
    return this.searchTerm
      ? teams.filter((team) =>
          team.name.toLowerCase().includes(this.searchTerm.toLowerCase()),
        )
      : teams;
  },

  searchTeams(term) {
    this.searchTerm = term.trim();
    this.showLoading(true);

    setTimeout(() => {
      const filteredTeams = this.teamsData.teams.filter((team) =>
        team.name.toLowerCase().includes(this.searchTerm.toLowerCase()),
      );

      this.loadTableData(filteredTeams);
      this.showLoading(false);

      if (filteredTeams.length === 0) this.showNoResults();
    }, 300);
  },
});
