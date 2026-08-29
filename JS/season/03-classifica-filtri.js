// Filtro classifica per zona e generazione della legenda colori.
Object.assign(StandingsApp.prototype, {
  filterTableByZone(zone) {
    this.currentFilter = zone;
    this.highlightLegendItem(zone);

    const rows = document.querySelectorAll("#league-table tbody tr");

    if (zone === "champions") {
      rows.forEach((row) => {
        if (
          row.dataset.zone === "champions" ||
          row.dataset.zone === "championship"
        ) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
      return;
    }

    if (zone === "all") {
      rows.forEach((row) => {
        row.style.display = "";
      });
      return;
    }

    rows.forEach((row) => {
      if (row.dataset.zone === zone) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  },

  highlightLegendItem(zone) {
    const legendItems = document.querySelectorAll(".legend-item");
    legendItems.forEach((item) => {
      item.classList.remove("selected-legend");
    });

    if (zone !== "all") {
      const selectedItem = document.querySelector(`.legend-item.${zone}`);
      if (selectedItem) selectedItem.classList.add("selected-legend");
    }
  },

  generateLegend() {
    const legend = document.querySelector(".legend");
    legend.innerHTML = "";

    if (!this.zonesData.zones) return;

    this.zonesData.zones.forEach((zone) => {
      const legendItem = document.createElement("div");
      legendItem.className = `legend-item ${zone.name}`;
      legendItem.innerHTML = `
        <span class="legend-color" style="background-color: ${zone.color};"></span>
        <span>${zone.label}</span>
      `;
      legendItem.style.cursor = "pointer";
      legendItem.addEventListener("click", () => {
        this.filterTableByZone(zone.name);
      });
      legend.appendChild(legendItem);
    });

    const resetButton = document.createElement("div");
    resetButton.className = "legend-item reset";
    resetButton.innerHTML = `
      <span class="legend-color" style="background-color: #64748b;"></span>
      <span>Mostra tutte</span>
    `;
    resetButton.style.cursor = "pointer";
    resetButton.addEventListener("click", () => {
      this.filterTableByZone("all");
    });
    legend.appendChild(resetButton);
  },
});
