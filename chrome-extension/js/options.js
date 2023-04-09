const restoreOptions = async () => {
    const { youtrack_url, authToken } = await chrome.storage.sync.get(['youtrack_url', 'authToken']);
    document.getElementById('youtrack_url').value = youtrack_url;
    document.getElementById('youtrack_token').value = authToken;
}

const saveOptions = async (event) => {
    event.preventDefault();

    const youtrack_url = document.getElementById('youtrack_url').value;
    const authToken = document.getElementById('youtrack_token').value;

    await chrome.storage.sync.set({
        youtrack_url,
        authToken
    });

    YouTrackAPI.init({ youtrack_url, authToken });

    // Stop any active timers.
    const currentUser = await YouTrackAPI.users.getCurrent();

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