// ===========================
// WHATSAPP SHARE - CLASSIFICA COMPLETA
// ===========================
Object.assign(StandingsApp.prototype, {
  shareStandingsOnWhatsApp() {
    if (!this.teamsData.teams || this.teamsData.teams.length === 0) {
      alert("Carica prima i dati della classifica!");
      return;
    }

    const sortedTeams = this.sortTeamsByCriteria(this.teamsData.teams, "points");
    const seasonBadge = document.querySelector(".season-badge");
    const seasonTitle = seasonBadge
      ? seasonBadge.textContent.trim()
      : "Serie A";
    const seasonHasChampion =
      this.teamsData.champion && this.teamsData.champion.trim() !== "";
    const statusText = seasonHasChampion
      ? "*CLASSIFICA FINALE*"
      : "*CLASSIFICA ATTUALE*";

    let dateText = "";
    if (seasonHasChampion && this.teamsData.endDate) {
      dateText = this.teamsData.endDate;
    } else {
      const today = new Date();
      const day = today.getDate().toString().padStart(2, "0");
      const month = today.toLocaleString("it-IT", { month: "long" });
      const year = today.getFullYear();
      dateText = `${day} ${month} ${year}`;
    }

    let message = `${statusText}\n`;
    message += `*${seasonTitle}*\n`;
    message += `${dateText}\n`;
    message += `${"=".repeat(40)}\n\n`;

    sortedTeams.forEach((team, index) => {
      const position = index + 1;
      const goalDiff = team.goalsFor - team.goalsAgainst;
      const goalDiffText = goalDiff > 0 ? `+${goalDiff}` : goalDiff.toString();
      const zone = this.getTeamZone(position);
      const zoneLabel = this.getZoneLabel(zone);
      const zoneText = zoneLabel ? ` [${zoneLabel}]` : "";

      message += `${position}. ${team.name}${zoneText}\n`;
      message += `   Pt: ${team.points} | G: ${team.matchesPlayed} | V: ${team.wins} | P: ${team.draws} | S: ${team.losses}\n`;
      message += `   GF: ${team.goalsFor} | GS: ${team.goalsAgainst} | DR: ${goalDiffText}\n\n`;
    });

    message += `${"=".repeat(40)}\n`;
    message += `Serie A Archive - Classifica completa`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");
  },
});
