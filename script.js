async function fetchAllClips(startDate, endDate, keywords) {
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    loadingDiv.innerHTML = 'Fetching clips...';

    let seenClipIds = new Set();
    let cursor = null;
    const itemsPerPage = 100; // Adjust as needed, up to 100

    try {
        do {
            let url = `https://api.twitch.tv/helix/clips?game_id=${GAME_ID}&started_at=${startDate}&ended_at=${endDate}&first=${itemsPerPage}`;
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

            const data = await response.json();

            const newClips = data.data.filter((clip) => !seenClipIds.has(clip.id));
            newClips.forEach((clip) => seenClipIds.add(clip.id));

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

            cursor = data.pagination?.cursor || null;

            // Delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 100)); // Adjust delay as needed

        } while (cursor);

        loadingDiv.innerHTML = 'Search complete. All results are displayed.';
    } catch (error) {
        resultsDiv.innerHTML = `Error: ${error.message}`;
        loadingDiv.innerHTML = 'An error occurred while fetching clips.';
        console.error('Error fetching clips:', error);
    }
}
