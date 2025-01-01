// Twitch API Credentials
const CLIENT_ID = 'gp762nuuoqcoxypju8c569th9wz7q5';
const ACCESS_TOKEN = 'w5be0xdb02yj1t7elh0wvs055uh436';
const GAME_ID = '21779'; // League of Legends game ID

// Helper function to fetch and display clips incrementally
async function fetchAllClips(startDate, endDate, keywords) {
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

            // Remove duplicates by checking IDs
            const newClips = data.data.filter((clip) => !seenClipIds.has(clip.id));
            newClips.forEach((clip) => seenClipIds.add(clip.id));

            // Filter and display clips incrementally as they are fetched
            newClips.forEach((clip) => {
                // Check if all keywords are present (case-insensitive) in the title or broadcaster name
                const matchesKeywords = keywords.every((keyword) =>
                    clip.title.toLowerCase().includes(keyword.toLowerCase()) || 
                    clip.broadcaster_name.toLowerCase().includes(keyword.toLowerCase())
                );

                if (matchesKeywords) {
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
            console.log(`Page ${pageCount}: Fetched ${newClips.length} clips, displaying ${newClips.filter(clip => keywords.every(keyword => clip.title.toLowerCase().includes(keyword.toLowerCase()) || clip.broadcaster_name.toLowerCase().includes(keyword.toLowerCase()))).length} matching clips.`);
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
async function fetchClips(days, keyword) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    resultsDiv.innerHTML = ''; // Clear previous results
    loadingDiv.innerHTML = 'Fetching clips...'; // Show loading indicator

    try {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Split the keyword into an array of keywords
        const keywords = keyword.trim().split(/\s+/); // Split by spaces and remove any extra whitespace

        if (keywords.length === 0) {
            alert('Please enter a valid keyword.');
            return;
        }

        await fetchAllClips(startDate, endDate, keywords);

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
