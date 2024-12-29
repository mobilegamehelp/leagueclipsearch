// Twitch API Credentials
const CLIENT_ID = 'gp762nuuoqcoxypju8c569th9wz7q5';
const ACCESS_TOKEN = '3vuurdpkcvjhc45wklp9a8f6hg7fhm';
const GAME_ID = '21779'; // League of Legends game ID

// Helper function to fetch all clips (with pagination)
async function fetchAllClips(startDate, endDate) {
    let allClips = [];
    let cursor = null; // Pagination cursor

    try {
        do {
            // Build the API URL with pagination
            let url = `https://api.twitch.tv/helix/clips?game_id=${GAME_ID}&started_at=${startDate}&ended_at=${endDate}&first=20`;
            if (cursor) {
                url += `&after=${cursor}`;
            }

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
            allClips = allClips.concat(data.data);

            // Update cursor for next page
            cursor = data.pagination?.cursor || null;
        } while (cursor);

        return allClips;
    } catch (error) {
        console.error('Error fetching clips:', error);
        throw error;
    }
}

// Function to filter and display clips
async function fetchClips(days, keyword) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = 'Fetching clips...';

    try {
        // Calculate the start and end date
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Fetch all clips
        const allClips = await fetchAllClips(startDate, endDate);
        console.log('Total Clips Fetched:', allClips.length);

        // Filter clips by keyword
        const filteredClips = allClips.filter((clip) =>
            clip.title.toLowerCase().includes(keyword.toLowerCase())
        );
        console.log('Filtered Clips:', filteredClips);

        if (filteredClips.length === 0) {
            throw new Error(`No clips found matching the keyword "${keyword}".`);
        }

        // Display the filtered clips
        resultsDiv.innerHTML = '';
        filteredClips.forEach((clip) => {
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
    const keywordInput = document.getElementById('keyword').value.trim();
    const days = parseInt(daysInput, 10);

    if (isNaN(days) || days <= 0) {
        alert('Please enter a valid number of days.');
        return;
    }

    if (!keywordInput) {
        alert('Please enter a keyword to filter clips.');
        return;
    }

    fetchClips(days, keywordInput);
});
