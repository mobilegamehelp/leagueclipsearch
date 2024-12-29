// Twitch API Credentials
const CLIENT_ID = 'gp762nuuoqcoxypju8c569th9wz7q5';
const ACCESS_TOKEN = '3vuurdpkcvjhc45wklp9a8f6hg7fhm';

// Helper function to fetch clips
async function fetchClips(days, gameId, keyword) {
    const resultsDiv = document.getElementById('results');
    const statusDiv = document.getElementById('status');
    
    // Check if elements are available before modifying
    if (!resultsDiv || !statusDiv) {
        console.error('Missing results or status divs.');
        return;
    }

    resultsDiv.innerHTML = 'Fetching clips...';
    statusDiv.innerHTML = 'Searching for clips...';

    try {
        // Calculate the start and end date
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Make the API request
        const response = await fetch(
            `https://api.twitch.tv/helix/clips?game_id=${gameId}&started_at=${startDate}&ended_at=${endDate}`,
            {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );

        // Check for errors in the response
        if (!response.ok) {
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }

        // Parse the JSON response
        const data = await response.json();
        if (!data.data || data.data.length === 0) {
            throw new Error('No clips found for the specified time range.');
        }

        // Display the clips
        resultsDiv.innerHTML = ''; // Clear previous results

        // Filter clips based on the keyword if provided
        const filteredClips = data.data.filter((clip) =>
            clip.title.toLowerCase().includes(keyword.toLowerCase())
        );

        if (filteredClips.length === 0) {
            resultsDiv.innerHTML = 'No clips found with the specified keyword.';
        } else {
            filteredClips.forEach((clip) => {
                const clipDiv = document.createElement('div');
                clipDiv.className = 'clip';
                clipDiv.innerHTML = `
                    <h3>${clip.title}</h3>
                    <p><strong>Streamer:</strong> ${clip.broadcaster_name}</p>
                    <p><strong>Views:</strong> ${clip.view_count}</p>
                    <a href="${clip.url}" target="_blank">Watch Clip</a>
                    <br>
                    <img src="${clip.thumbnail_url.replace('-{width}x{height}', '')}" alt="Clip Thumbnail" width="200">
                `;
                resultsDiv.appendChild(clipDiv);
            });
        }

        statusDiv.innerHTML = 'Search complete!';
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        console.error(error);
        statusDiv.innerHTML = 'Error occurred.';
    }
}

// Helper function to fetch games
async function fetchGames() {
    try {
        console.log("Fetching games...");

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

        console.log('Fetched games:', data);

        const gameSelect = document.getElementById('gameSelect');
        
        if (!gameSelect) {
            console.error('Game select dropdown not found!');
            return;
        }
        
        // Check if data contains games
        if (data.data && data.data.length > 0) {
            console.log('Games available:', data.data.length);

            // Sort games alphabetically by name
            data.data.sort((a, b) => a.name.localeCompare(b.name));

            // Append the sorted games to the dropdown
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

// Event listener for the search button
document.getElementById('search').addEventListener('click', () => {
    const daysInput = document.getElementById('timeRange').value;
    const keywordInput = document.getElementById('keyword').value;
    const gameSelect = document.getElementById('gameSelect');
    const gameId = gameSelect.value;

    const days = parseInt(daysInput, 10);
    
    if (isNaN(days) || days <= 0) {
        alert('Please enter a valid number of days.');
        return;
    }

    if (!gameId) {
        alert('Please select a game to search.');
        return;
    }

    fetchClips(days, gameId, keywordInput);
});

// Fetch games when the page loads
window.onload = fetchGames;
