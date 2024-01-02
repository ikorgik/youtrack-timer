
const initPopup = async () => {
  let activeWorkItem = null;
  const { currentUser, youtrack_url, authToken, youtrackFavorite } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken', 'youtrackFavorite']);
  YouTrackAPI.init({ currentUser, youtrack_url, authToken });

  document.getElementsByClassName('loading-page')[0].style.display = 'block';
  try {
    activeWorkItem = await YouTrackAPI.workItems.getActive();
    console.log('activeWorkItem', activeWorkItem)
  }
  catch (e) {
    document.getElementsByClassName('missed-options-page')[0].style.display = 'block';
  }

  document.getElementsByClassName('timesheets-link')[0].href = document.getElementsByClassName('timesheets-link')[0].href.replace('https://_host_', youtrack_url);

  if (activeWorkItem === null) {
    document.getElementsByClassName('no-active-timers')[0].style.display = 'block';

    await chrome.runtime.sendMessage({ timer_status: 'off' });
  }
  else {
    document.getElementsByClassName('no-active-timers')[0].style.display = 'none';

    const total = Date.now() - activeWorkItem.created;
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const formattedHours = hours < 10 ? '0' + hours : hours;
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    document.getElementsByClassName('issue-id')[0].innerHTML = activeWorkItem.issue.idReadable;
    document.getElementsByClassName('issue-id')[0].href = document.getElementsByClassName('issue-id')[0].href
        .replace('https://_host_', youtrack_url)
        .replace('_issue_id_', activeWorkItem.issue.idReadable);
    document.getElementsByClassName('issue-summary')[0].innerHTML = activeWorkItem.issue.summary;
    document.getElementsByClassName('project')[0].innerHTML = activeWorkItem.issue.project.name;
    document.getElementsByClassName('time')[0].innerHTML = formattedHours + ':' + formattedMinutes;

    document.getElementsByClassName('active-timer')[0].style.display = 'block';

    document.getElementsByClassName('stop-timer')[0].addEventListener("click", stopButtonClick);
    document.getElementsByClassName('cancel')[0].addEventListener("click", () => { window.close(); });

    await chrome.runtime.sendMessage({ timer_status: 'on' });
  }

  // Output list of favorite issues.
  const favoriteToolbar = document.querySelector(".favorite-issues:not(.initialized)");
  if (youtrackFavorite !== '' && youtrackFavorite !== undefined && favoriteToolbar !== null) {
    favoriteToolbar.classList.add('initialized');

    const favoriteIssueIds = youtrackFavorite.split(',');
    favoriteIssueIds.forEach((issueId) => {
      let timerButton = document.createElement('button');
      timerButton.type = 'button';
      timerButton.classList.add('youtrack-timer-button');
      timerButton.innerHTML = issueId;

      timerButton.setAttribute('data-issue-id', issueId);
      favoriteToolbar.appendChild(timerButton);
      timerButton.addEventListener('click', timerButtonClick);
    });
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

const timerButtonClick = async (event) => {
  event.target.disabled = true;

  const { currentUser, youtrack_url, authToken } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken']);
  YouTrackAPI.init({ currentUser, youtrack_url, authToken });

  // Stop any active timers.
  await YouTrackAPI.workItems.stopActive();

  const issueId = event.target.getAttribute('data-issue-id');

  await YouTrackAPI.workItems.startTimer(issueId);
  await chrome.runtime.sendMessage({ timer_status: 'on' });

  event.target.disabled = false;
  initPopup();
}

window.addEventListener("DOMContentLoaded", (event) => {
  // Initialize popup when opened.
  initPopup();
});

