// Function to create a season card HTML
function createSeasonCard(season) {
    const currentBadge = season.status === 'current' ? '<div class="current-badge">In corso</div>' : '';
    const championBadge = season.champion ? `<div class="champion-badge">${season.champion}</div>` : '';

    return `
        <a href="${season.url}" class="season-card">
            ${currentBadge}
            <div class="season-card-header">
                <img src="${season.logo}" alt="Stagione ${season.year}">
                <div class="season-year">${season.year}</div>
            </div>
            <div class="season-card-content">
                ${championBadge}
                <h3>${season.title}</h3>
            </div>
        </a>
    `;
}

// Function to load and display seasons from JSON file
async function loadSeasons() {
    const seasonsGrid = document.getElementById('seasonsGrid');

    try {
        // Fetch data from JSON file
        const response = await fetch('JS/seasons-data.json', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Clear loading message
        seasonsGrid.innerHTML = '';

        // Sort seasons by year (most recent first)
        const sortedSeasons = data.seasons.sort((a, b) => {
            const yearA = parseInt(a.year.split('-')[0]);
            const yearB = parseInt(b.year.split('-')[0]);
            return yearB - yearA;
        });

        // Check if seasons array is empty
        if (sortedSeasons.length === 0) {
            seasonsGrid.innerHTML = '<div class="error-message">Nessuna stagione trovata.</div>';
            return;
        }

        // Create and append season cards
        sortedSeasons.forEach(season => {
            seasonsGrid.innerHTML += createSeasonCard(season);
        });

        console.log(`Caricate ${sortedSeasons.length} stagioni con successo`);

    } catch (error) {
        console.error('Errore nel caricamento delle stagioni:', error);

        // Show different error messages based on error type
        let errorMessage = 'Errore nel caricamento delle stagioni.';

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Impossibile caricare il file seasons-data.json. Verifica che il file esista.';
        } else if (error.name === 'SyntaxError') {
            errorMessage = 'Il file JSON contiene errori di sintassi.';
        } else if (error.message.includes('404')) {
            errorMessage = 'File seasons-data.json non trovato.';
        }

        seasonsGrid.innerHTML = `<div class="error-message">${errorMessage}</div>`;
    }
}

// Function to refresh seasons data (useful for future features)
function refreshSeasons() {
    const seasonsGrid = document.getElementById('seasonsGrid');
    seasonsGrid.innerHTML = '<div class="loading-message">Ricaricamento stagioni...</div>';
    loadSeasons();
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Inizializzazione pagina Generale Stagioni');
    loadSeasons();
});

// Optional: Add event listener for online/offline status
window.addEventListener('online', function () {
    console.log('Connessione ripristinata');
    refreshSeasons();
});

window.addEventListener('offline', function () {
    console.log('Connessione persa');
});