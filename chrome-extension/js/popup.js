
const initPopup = async (activeWorkItemId = null) => {
  let activeWorkItem = null;
  let recentWorkItems = [];
  let favoriteIssues = [];
  let todaysWorkItems = [];
  const { currentUser, youtrack_url, authToken, youtrackFavorite } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken', 'youtrackFavorite']);
  YouTrackAPI.init({ currentUser, youtrack_url, authToken });

  document.getElementsByClassName('loading-page')[0].style.display = 'block';
  try {
    activeWorkItem = activeWorkItemId !== null
        ? await YouTrackAPI.workItems.getById(activeWorkItemId)
        : await YouTrackAPI.workItems.getActive();

    recentWorkItems = await YouTrackAPI.workItems.getRecentIssues();
    favoriteIssues = await YouTrackAPI.issues.getByIds(youtrackFavorite);

    const today = new Date().setHours(0,0,0,0);
    todaysWorkItems = await YouTrackAPI.workItems.getRecent(today);
  }
  catch (e) {
    document.getElementsByClassName('missed-options-page')[0].style.display = 'block';
  }

  document.getElementsByClassName('timesheets-link')[0].href = document.getElementsByClassName('timesheets-link')[0].href.replace('https://_host_', youtrack_url);

  if (activeWorkItem === null) {
    document.getElementsByClassName('no-active-timers')[0].style.display = 'block';
    document.getElementsByClassName('active-timer')[0].style.display = 'none';

    await chrome.runtime.sendMessage({ timer_status: 'off' });
  }
  else {
    document.getElementsByClassName('no-active-timers')[0].style.display = 'none';

    showActiveTimer(activeWorkItem, youtrack_url);

    await chrome.runtime.sendMessage({ timer_status: 'on' });
  }

  if (youtrackFavorite !== '' && youtrackFavorite !== undefined) {
    showFavoriteIssues(favoriteIssues, recentWorkItems);
  }

  updateTrackedTodayTime(todaysWorkItems, activeWorkItem);

  document.getElementsByClassName('loading-page')[0].style.display = 'none';
};

const stopButtonClick = async (event) => {
  event.target.disabled = true;

  const { currentUser, youtrack_url, authToken } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken']);
  YouTrackAPI.init({ currentUser, youtrack_url, authToken });

  const description = document.getElementById('description').value;

  // Stop any active timers.
  await YouTrackAPI.workItems.stopActive(description);

  await chrome.runtime.sendMessage({ timer_status: 'off' });

  //window.close();
  initPopup();
  event.target.disabled = false;
}

const timerButtonClick = async (event) => {
  event.target.disabled = true;

  const { currentUser, youtrack_url, authToken } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken']);
  YouTrackAPI.init({ currentUser, youtrack_url, authToken });

  // Stop any active timers.
  await YouTrackAPI.workItems.stopActive();

  const issueId = event.target.getAttribute('data-issue-id');

  const startedWorkItem = await YouTrackAPI.workItems.startTimer(issueId);
  await chrome.runtime.sendMessage({ timer_status: 'on' });

  event.target.disabled = false;
  initPopup(startedWorkItem.id);
}

const showActiveTimer = (activeWorkItem, youtrack_url) => {
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
}

const updateTrackedTodayTime = (todaysWorkItems, activeWorkItem) => {
  let todaysMinutes = 0;
  todaysWorkItems.forEach((issue) => {
    todaysMinutes += issue.duration.minutes;
  });

  const activeWorkItemDuration = activeWorkItem !== null ? Date.now() - activeWorkItem.created : 0;
  const total = todaysMinutes * 60 * 1000 + activeWorkItemDuration;
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const formattedHours = hours < 10 ? '0' + hours : hours;
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

  document.getElementsByClassName('today-time')[0].innerHTML = formattedHours + ':' + formattedMinutes;

  // @todo: show todays text in icon as badge.
  const badgeText = hours > 0 ? hours + 'h' : '';
  chrome.action.setBadgeText({text: badgeText});
}

const showFavoriteIssues = (favoriteIssues, recentWorkItems) => {
  // Output list of favorite issues.
  const favoriteToolbar = document.querySelector(".favorite-issues:not(.initialized)");
  if (favoriteToolbar === null) {
    return;
  }

  favoriteToolbar.classList.add('initialized');
  const issuesList = favoriteIssues;

  recentWorkItems.forEach((issue) => {
    let index = favoriteIssues.findIndex((item) => item.id === issue.id);
    if (index === -1) {
      issuesList.push(issue);
    }
  });

  issuesList.forEach((issue) => {
    let timerButton = document.createElement('a');
    // timerButton.type = 'button';
    timerButton.classList.add('youtrack-timer-button');
    timerButton.innerHTML = issue.idReadable + ' ' + issue.summary;
    if (timerButton.innerHTML.length > 58) {
      timerButton.innerHTML = timerButton.innerHTML.slice(0, 58).trim() + '...';
    }

    timerButton.setAttribute('data-issue-id', issue.idReadable);

    let listItem = document.createElement('div');
    listItem.appendChild(timerButton);

    favoriteToolbar.appendChild(listItem);
    timerButton.addEventListener('click', timerButtonClick);
  });
}


window.addEventListener("DOMContentLoaded", (event) => {
  // Initialize popup when opened.
  initPopup();
});

