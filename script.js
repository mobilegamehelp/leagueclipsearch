// Twitch API Credentials
const CLIENT_ID = 'gp762nuuoqcoxypju8c569th9wz7q5';
const ACCESS_TOKEN = '3vuurdpkcvjhc45wklp9a8f6hg7fhm';

// Fetch all available games and populate the dropdown
async function fetchGames() {
    try {
        console.log("Fetching games..."); // Log when the fetchGames function is triggered
        
        const response = await fetch('https://api.twitch.tv/helix/games/top?first=100', {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
            },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        console.log('Fetched games:', data); // Log the fetched games data

        const gameSelect = document.getElementById('gameSelect');
        
        // Check if data contains games
        if (data.data && data.data.length > 0) {
            data.data.forEach((game) => {
                const option = document.createElement('option');
                option.value = game.id;
                option.textContent = game.name;
                gameSelect.appendChild(option);
            });
            console.log("Games added to dropdown");
        } else {
            console.log('No games found in response.');
            alert('No games found.');
        }
    } catch (error) {
        console.error('Error fetching games:', error);
        alert('Failed to load games.');
    }
}

// Helper function to fetch and display clips incrementally
async function fetchAllClips(gameId, startDate, endDate, keyword) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    loadingDiv.innerHTML = 'Fetching clips...'; // Show loading indicator

    let seenClipIds = new Set(); // Track seen clip IDs to avoid duplicates
    let cursor = null; // Pagination cursor
    let pageCount = 0; // Track the number of pages fetched

    try {
        do {
            pageCount++;

            // Build the API URL with pagination
            let url = `https://api.twitch.tv/helix/clips?game_id=${gameId}&started_at=${startDate}&ended_at=${endDate}&first=20`;
            if (cursor) url += `&after=${cursor}`;

            // Fetch the clips
            const response = await fetch(url, {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                },
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();

            // Remove duplicates by checking IDs
            const newClips = data.data.filter((clip) => !seenClipIds.has(clip.id));
            newClips.forEach((clip) => seenClipIds.add(clip.id));

            // Filter and display clips incrementally as they are fetched
            newClips.forEach((clip) => {
                // Only display if the clip title or broadcaster name matches the keyword
                if (clip.title.toLowerCase().includes(keyword.toLowerCase()) || clip.broadcaster_name.toLowerCase().includes(keyword.toLowerCase())) {
                    const clipDiv = document.createElement('div');
                    clipDiv.className = 'clip';
                    clipDiv.innerHTML = `
                        <h3>${clip.title}</h3>
                        <p><strong>Streamer:</strong> ${clip.broadcaster_name}</p>
                        <p><strong>Views:</strong> ${clip.view_count}</p>
                        <img src="${clip.thumbnail_url.replace('{width}', '120').replace('{height}', '90')}" alt="Thumbnail">
                        <a href="${clip.url}" target="_blank">Watch Clip</a>
                    `;
                    resultsDiv.appendChild(clipDiv);
                }
            });

            // Update cursor for next page
            cursor = data.pagination?.cursor || null;
            console.log(`Page ${pageCount}: Fetched ${newClips.length} clips, displaying ${newClips.filter(clip => clip.title.toLowerCase().includes(keyword.toLowerCase()) || clip.broadcaster_name.toLowerCase().includes(keyword.toLowerCase())).length} matching clips.`);
        } while (cursor);

        console.log(`Fetching complete. Total unique clips found: ${seenClipIds.size}`);
        loadingDiv.innerHTML = 'Search complete. All results are displayed.'; // Stop loading message
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        loadingDiv.innerHTML = 'An error occurred while fetching clips.'; // Error message
        console.error('Error fetching clips:', error);
    }
}

// Function to initiate the fetching process
async function fetchClips(days, keyword, gameId) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    resultsDiv.innerHTML = ''; // Clear previous results
    loadingDiv.innerHTML = 'Fetching clips...'; // Show loading indicator

    try {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        await fetchAllClips(gameId, startDate, endDate, keyword);

        console.log('Fetching complete.');
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        loadingDiv.innerHTML = 'An error occurred while fetching clips.'; // Error message
        console.error(error);
    }
}

// Event listener for the search button
document.getElementById('search').addEventListener('click', () => {
    const daysInput = document.getElementById('timeRange').value;
    const keywordInput = document.getElementById('keyword').value.trim();
    const gameSelect = document.getElementById('gameSelect');
    const gameId = gameSelect.value;

    const days = parseInt(daysInput, 10);

    if (isNaN(days) || days <= 0) {
        alert('Please enter a valid number of days.');
        return;
    }

    if (!keywordInput) {
        alert('Please enter a keyword to filter clips.');
        return;
    }

    if (!gameId) {
        alert('Please select a game.');
        return;
    }

    fetchClips(days, keywordInput, gameId);
});

// Fetch all games when the page loads
window.onload = function() {
    fetchGames();
};
