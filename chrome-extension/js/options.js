const restoreOptions = async () => {
    const { youtrack_url, authToken, youtrackFavorite } = await chrome.storage.sync.get(['youtrack_url', 'authToken', 'youtrackFavorite']);
    document.getElementById('youtrack_url').value = youtrack_url || '';
    document.getElementById('youtrack_token').value = authToken || '';
    document.getElementById('youtrack_favorite').value = youtrackFavorite || '';
}

const saveOptions = async (event) => {
    event.preventDefault();

    let currentUser = null;
    const youtrack_url = document.getElementById('youtrack_url').value;
    const authToken = document.getElementById('youtrack_token').value;
    const youtrackFavorite = document.getElementById('youtrack_favorite').value;

    await chrome.storage.sync.set({
        youtrack_url,
        authToken,
        youtrackFavorite
    });

    YouTrackAPI.init({ youtrack_url, authToken });

    try {
        currentUser = await YouTrackAPI.users.getCurrent();
    }
    catch (e) {
        console.error(e);
    }

    if (currentUser !== null) {
        // Save current user to the storage.
        await chrome.storage.sync.set({
            currentUser: currentUser
        });

        // Update status to let user know options were saved.
        document.getElementById('status').innerHTML = 'Successfully connected to YouTrack server.';
        document.getElementById('status').style.color = 'green';
    }
    else {
        document.getElementById('status').innerHTML = "There is a problem connecting to YouTrack server. Check parameters and try again.";
        document.getElementById('status').style.color = 'red';
    }
}

restoreOptions();

// Save button click.
document.getElementById('options-form').addEventListener('submit', saveOptions);