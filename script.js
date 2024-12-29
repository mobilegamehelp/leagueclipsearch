// Twitch API Credentials
const CLIENT_ID = 'gp762nuuoqcoxypju8c569th9wz7q5';
const ACCESS_TOKEN = '3vuurdpkcvjhc45wklp9a8f6hg7fhm';
const GAME_ID = '21779'; // League of Legends game ID
const MAX_CLIPS = 1000; // Limit the total clips fetched

// Helper function to fetch all clips (with pagination)
async function fetchAllClips(startDate, endDate) {
    let allClips = [];
    const seenClipIds = new Set();
    let cursor = null; // Pagination cursor
    let pageCount = 0; // Track the number of pages fetched

    try {
        do {
            pageCount++;
            if (allClips.length >= MAX_CLIPS) {
                console.log(`Reached maximum clip limit: ${MAX_CLIPS}`);
                break;
            }

            // Build the API URL with pagination
            let url = `https://api.twitch.tv/helix/clips?game_id=${GAME_ID}&started_at=${startDate}&ended_at=${endDate}&first=20`;
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

            // Remove duplicates
            const newClips = data.data.filter((clip) => !seenClipIds.has(clip.id));
            newClips.forEach((clip) => seenClipIds.add(clip.id));

            // Add unique clips
            allClips = allClips.concat(newClips);

            // Display the new clips incrementally
            newClips.forEach((clip) => {
                const clipDiv = document.createElement('div');
                clipDiv.className = 'clip';
                clipDiv.innerHTML = `
                    <h3>${clip.title}</h3>
                    <p><strong>Streamer:</strong> ${clip.broadcaster_name}</p>
                    <p><strong>Views:</strong> ${clip.view_count}</p>
                    <a href="${clip.url}" target="_blank">Watch Clip</a>
                `;
                document.getElementById('results').appendChild(clipDiv);
            });

            // Update cursor for next page
            cursor = data.pagination?.cursor || null;
            console.log(`Page ${pageCount}: Fetched ${newClips.length} unique clips.`);
        } while (cursor);

        console.log(`Total Unique Clips Fetched: ${allClips.length}`);
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
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Fetch all clips
        await fetchAllClips(startDate, endDate);

        console.log('Fetching complete.');
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
