// Twitch API Credentials
const CLIENT_ID = 'gp762nuuoqcoxypju8c569th9wz7q5';
const ACCESS_TOKEN = 'w5be0xdb02yj1t7elh0wvs055uh436';
const GAME_ID = '21779'; // League of Legends game ID

// Helper function to fetch clips for a specific cursor
async function fetchClipsForCursor(startDate, endDate, cursor = null) {
    let url = `https://api.twitch.tv/helix/clips?game_id=${GAME_ID}&started_at=${startDate}&ended_at=${endDate}&first=20`;
    if (cursor) url += `&after=${cursor}`;

    const response = await fetch(url, {
        headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
}

// Fetch all pages concurrently
async function fetchAllClipsConcurrently(startDate, endDate, keywords, maxPages = 5) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    loadingDiv.innerHTML = 'Fetching clips...'; // Show loading indicator

    let seenClipIds = new Set(); // Track seen clip IDs to avoid duplicates
    let cursor = null; // Pagination cursor
    let pageCount = 0;

    try {
        while (pageCount < maxPages) {
            const fetchPromises = [];
            const cursors = [cursor]; // Add initial cursor and additional cursors

            // Prepare requests for multiple pages
            for (let i = 0; i < maxPages; i++) {
                fetchPromises.push(fetchClipsForCursor(startDate, endDate, cursors[i]));
            }

            // Await all API responses
            const responses = await Promise.all(fetchPromises);
            let newCursor = null;

            responses.forEach((data) => {
                // Process each response
                const newClips = data.data.filter((clip) => !seenClipIds.has(clip.id));
                newClips.forEach((clip) => seenClipIds.add(clip.id));

                // Filter and display clips incrementally
                newClips.forEach((clip) => {
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

                // Update the cursor for the next set of requests
                newCursor = data.pagination?.cursor || null;
            });

            // Update cursor and increment page count
            cursor = newCursor;
            pageCount++;
            if (!cursor) break; // Stop if no more pages
        }

        console.log(`Fetching complete. Total unique clips found: ${seenClipIds.size}`);
        loadingDiv.innerHTML = 'Search complete. All results are displayed.'; // Stop loading message
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        loadingDiv.innerHTML = 'An error occurred while fetching clips.'; // Error message
        console.error('Error fetching clips:', error);
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

    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const keywords = keywordInput.trim().split(/\s+/);

    fetchAllClipsConcurrently(startDate, endDate, keywords);
});
