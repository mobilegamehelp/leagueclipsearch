async function fetchClipsInParallel(days, keyword, maxPages = 5) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    resultsDiv.innerHTML = ''; // Clear previous results
    loadingDiv.innerHTML = 'Fetching clips...'; // Show loading indicator

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();
    const keywords = keyword.trim().split(/\s+/); // Split keywords by spaces

    let seenClipIds = new Set(); // Track seen clip IDs to avoid duplicates
    let cursor = null; // Initial cursor
    let allClips = []; // Array to hold all fetched clips

    try {
        for (let i = 0; i < maxPages; i++) {
            const url = `https://api.twitch.tv/helix/clips?game_id=${GAME_ID}&started_at=${startDate}&ended_at=${endDate}&first=20${cursor ? `&after=${cursor}` : ''}`;

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
            allClips.push(...data.data); // Collect clips

            cursor = data.pagination?.cursor || null;
            if (!cursor) break; // Stop if no more pages are available
        }

        // Filter and display clips
        allClips
            .filter((clip) => !seenClipIds.has(clip.id))
            .forEach((clip) => {
                seenClipIds.add(clip.id);

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

        loadingDiv.innerHTML = 'Search complete. All results are displayed.';
        console.log('Fetching complete. Total unique clips found:', seenClipIds.size);
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        loadingDiv.innerHTML = 'An error occurred while fetching clips.';
        console.error('Error fetching clips:', error);
    }
}
