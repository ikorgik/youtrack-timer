
const initPopup = async () => {
  const { currentUser, youtrack_url, authToken } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken']);
  YouTrackAPI.init({ currentUser, youtrack_url, authToken });

  const activeWorkItem = await YouTrackAPI.workItems.getActive();

  if (activeWorkItem === null) {
    document.getElementsByClassName('no-active-timers')[0].style.display = 'block';

    await chrome.runtime.sendMessage({ timer_status: 'off' });
  }
  else {
    const total = Date.now() - activeWorkItem.created;
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const formattedHours = hours < 10 ? '0' + hours : hours;
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    document.getElementsByClassName('issue-summary')[0].innerHTML = activeWorkItem.issue.summary;
    document.getElementsByClassName('project')[0].innerHTML = activeWorkItem.issue.project.name;
    document.getElementsByClassName('time')[0].innerHTML = formattedHours + ':' + formattedMinutes;

    document.getElementsByClassName('active-timer')[0].style.display = 'block';

    document.getElementsByClassName('stop-timer')[0].addEventListener("click", stopButtonClick);
    document.getElementsByClassName('cancel')[0].addEventListener("click", () => { window.close(); });

    await chrome.runtime.sendMessage({ timer_status: 'on' });
  }

  document.getElementsByClassName('loading-page')[0].style.display = 'none';
};

const stopButtonClick = async (event) => {
  const { currentUser, youtrack_url, authToken } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken']);
  YouTrackAPI.init({ currentUser, youtrack_url, authToken });

  const description = document.getElementById('description').value;

  // Stop any active timers.
  await YouTrackAPI.workItems.stopActive(description);

  await chrome.runtime.sendMessage({ timer_status: 'off' });

  window.close();
}

window.addEventListener("DOMContentLoaded", (event) => {
  // Initialize popup when opened.
  initPopup();
});

