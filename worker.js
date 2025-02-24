let cachedData = null;

// Funkcja do wczytywania danych z pliku
async function loadData() {
    if (cachedData) return cachedData;

    const response = await fetch('rapy.txt');
    const data = await response.text();
    cachedData = data.split('\n'); // Podziel dane na linie
    return cachedData;
}

// Funkcja do wyszukiwania nicku
async function searchNick(nick) {
    const lines = await loadData();
    const totalLines = lines.length;

    for (let i = 0; i < totalLines; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        try {
            const json = JSON.parse(line);
            if (json.name === nick) {
                const firstIP = json.authorization.firstIP;
                const lastIP = json.authorization.lastIP;
                const isPremium = json.authorization.premium;
                const encodedPassword = json.authorization.password;

                // Wyślij wynik do głównego wątku
                self.postMessage({
                    type: 'result',
                    data: { nick, firstIP, lastIP, isPremium, encodedPassword },
                });
                // Upewnij się, że pasek ładowania jest pełny
                self.postMessage({ type: 'progress', data: 100 });
                return;
            }
        } catch (error) {
            console.error('Błąd parsowania JSON:', error);
        }

        // Wyślij postęp do głównego wątku
        if (i % 1000 === 0) {
            const progress = Math.floor((i / totalLines) * 100);
            self.postMessage({ type: 'progress', data: progress });
        }
    }

    // Jeśli nie znaleziono nicku
    self.postMessage({ type: 'error', data: `Nick "${nick}" nie został znaleziony.` });
    // Upewnij się, że pasek ładowania jest pełny
    self.postMessage({ type: 'progress', data: 100 });
}

// Obsługa wiadomości od głównego wątku
self.onmessage = function (event) {
    const { type, nick } = event.data;

    if (type === 'search') {
        searchNick(nick);
    }
};