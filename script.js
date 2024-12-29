// Twitch API Credentials
const CLIENT_ID = 'gp762nuuoqcoxypju8c569th9wz7q5';
const ACCESS_TOKEN = '3vuurdpkcvjhc45wklp9a8f6hg7fhm';
const GAME_ID = '21779'; // League of Legends game ID

// Helper function to fetch clips
async function fetchClips(days) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = 'Fetching clips...';

    try {
        // Calculate the start and end date
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Make the API request
        const response = await fetch(
            `https://api.twitch.tv/helix/clips?game_id=${GAME_ID}&started_at=${startDate}&ended_at=${endDate}`,
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
        resultsDiv.innerHTML = '';
        data.data.forEach((clip) => {
            const clipDiv = document.createElement('div');
            clipDiv.className = 'clip';
            clipDiv.innerHTML = `
                <h3>${clip.title}</h3>
                <p><strong>Streamer:</strong> ${clip.broadcaster_name}</p>
                <p><strong>Views:</strong> ${clip.view_count}</p>
                <a href="${clip.url}" target="_blank">Watch Clip</a>
            `;
            resultsDiv.appendChild(clipDiv);
        });
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        console.error(error);
    }
}

// Event listener for the search button
document.getElementById('search').addEventListener('click', () => {
    const daysInput = document.getElementById('timeRange').value;
    const days = parseInt(daysInput, 10);

    if (isNaN(days) || days <= 0) {
        alert('Please enter a valid number of days.');
        return;
    }

    fetchClips(days);
});
