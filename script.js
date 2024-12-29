async function fetchAllClips(startDate, endDate, keywords, maxPages = 100, clipsPerPage = 100) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    loadingDiv.innerHTML = 'Fetching clips...'; // Show loading indicator

    let seenClipIds = new Set(); // Track seen clip IDs to avoid duplicates
    let cursor = null; // Pagination cursor
    let pageCount = 0; // Track the number of pages fetched
    const clipsToDisplay = []; // Array to hold clips to display after fetching

    try {
        do {
            if (pageCount >= maxPages) break; // Stop after maxPages to prevent long search times

            pageCount++;

            // Build the API URL with pagination
            let url = `https://api.twitch.tv/helix/clips?game_id=${GAME_ID}&started_at=${startDate}&ended_at=${endDate}&first=${clipsPerPage}`; // Request more clips per page
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

            // Log the raw clip data for debugging
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

            // Update cursor for next page
            cursor = data.pagination?.cursor || null;
            console.log(`Page ${pageCount}: Fetched ${newClips.length} clips, displaying ${clipsToDisplay.length} matching clips.`);
        } while (cursor);

        console.log(`Fetching complete. Total unique clips found: ${seenClipIds.size}`);

        // Once all clips are fetched, display them all at once
        displayClips(clipsToDisplay);

        loadingDiv.innerHTML = 'Search complete. All results are displayed.'; // Stop loading message
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        loadingDiv.innerHTML = 'An error occurred while fetching clips.'; // Error message
        console.error('Error fetching clips:', error);
    }
}
