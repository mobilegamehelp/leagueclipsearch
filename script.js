// Function to fetch and display clips with keyword search
async function fetchAllClips(startDate, endDate, keywords, maxClips = 1000, clipsPerPage = 100) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    loadingDiv.innerHTML = 'Fetching clips...'; // Show loading indicator

    let seenClipIds = new Set(); // Track seen clip IDs to avoid duplicates
    const clipsToDisplay = []; // Array to hold clips to display after fetching
    let cursor = null; // Pagination cursor
    let pageCount = 0; // Track the number of pages fetched

    try {
        while (clipsToDisplay.length < maxClips) {
            pageCount++;
            // Build the API URL with pagination
            let url = `https://api.twitch.tv/helix/clips?game_id=${GAME_ID}&started_at=${startDate}&ended_at=${endDate}&first=${clipsPerPage}`;
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

            // Debug: Log the fetched data to see what is being returned
            console.log('Fetched Clip Data:', data);

            // Remove duplicates by checking IDs
            const newClips = data.data.filter((clip) => !seenClipIds.has(clip.id));
            newClips.forEach((clip) => seenClipIds.add(clip.id));

            // Filter clips that match the keywords
            newClips.forEach((clip) => {
                const matchesKeywords = keywords.every((keyword) =>
                    clip.title.toLowerCase().includes(keyword.toLowerCase()) || 
                    clip.broadcaster_name.toLowerCase().includes(keyword.toLowerCase())
                );
                if (matchesKeywords) {
                    clipsToDisplay.push(clip); // Store matching clips in an array
                }
            });

            // If we've gathered enough clips, stop
            if (clipsToDisplay.length >= maxClips) break;

            // Update cursor for next page
            cursor = data.pagination?.cursor || null;

            // Stop if there are no more pages
            if (!cursor) break;

            // Delay to avoid hitting API rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log(`Page ${pageCount}: Fetched ${newClips.length} clips, displaying ${clipsToDisplay.length} matching clips.`);
        }

        console.log(`Fetching complete. Total clips fetched: ${clipsToDisplay.length}`);

        // Once all clips are fetched, display them all at once
        displayClips(clipsToDisplay);

        loadingDiv.innerHTML = 'Search complete. All results are displayed.'; // Stop loading message
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        loadingDiv.innerHTML = 'An error occurred while fetching clips.'; // Error message
        console.error('Error fetching clips:', error);
    }
}

// Function to display clips
function displayClips(clips) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Clear previous results

    if (clips.length === 0) {
        resultsDiv.innerHTML = 'No clips found matching your search criteria.';
    } else {
        clips.forEach((clip) => {
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
        });
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

    const keywords = keywordInput.split(/\s+/); // Split the input by spaces for multiple keywords
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    fetchAllClips(startDate, endDate, keywords);
});
