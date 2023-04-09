
// Callback function to execute when mutations are observed
const issuePageShown = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      const issueContainer = document.querySelector(".yt-issue-view:not(.tracker-button-initialized)");
      if (issueContainer !== null) {
        issueContainer.classList.add('tracker-button-initialized');
        addButtonToToolbar(issueContainer);
      }
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(issuePageShown);

// Start observing the target node for configured mutations
observer.observe(document.body, { childList: true, subtree: true });

const createButtonElement = () => {
  let button;
  button = document.createElement("button");
  button.type = 'button';
  button.classList.add('youtrack-timer-button');
  button.classList.add('button_aba4');
  button.classList.add('button_fc1d');
  button.classList.add('light_b3b0');
  button.innerHTML = 'Start timer';
  return button;
};

const addButtonToToolbar = async (issueContainer) => {
  const issueToolbar = issueContainer.querySelector(".yt-issue-toolbar");

  const issueId = issueContainer.querySelector(".js-issue-id").textContent
  const { currentUser, youtrack_url, authToken } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken']);
  YouTrackAPI.init({ currentUser, youtrack_url, authToken });
  const activeWorkItem = await YouTrackAPI.workItems.getActive();

  const buttonIsActive = activeWorkItem !== null && activeWorkItem.issue.idReadable === issueId;

  const timerButton = createButtonElement();
  timerButton.setAttribute('data-issue-id', issueId);
  timerButton.setAttribute('data-timer-active', buttonIsActive ? 1 : 0);
  if (buttonIsActive) {
    timerButton.innerHTML = 'Stop timer';
  }
  issueToolbar.appendChild(timerButton);
  timerButton.addEventListener("click", timerButtonClick);
}

const timerButtonClick = async (event) => {
  event.target.disabled = true;

  const { currentUser, youtrack_url, authToken } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken']);
  YouTrackAPI.init({ currentUser, youtrack_url, authToken });

  // Stop any active timers.
  await YouTrackAPI.workItems.stopActive();

  const buttonIsActive = parseInt(event.target.getAttribute('data-timer-active'));
  const issueId = event.target.getAttribute('data-issue-id');

  if (!buttonIsActive) {
    const activeWorkItem = await YouTrackAPI.workItems.startTimer(issueId);
    event.target.innerHTML = 'Stop timer';
    event.target.setAttribute('data-timer-active', 1);
    await chrome.runtime.sendMessage({ timer_status: 'on' });
  }
  else {
    event.target.innerHTML = 'Start timer';
    event.target.setAttribute('data-timer-active', 0);
    await chrome.runtime.sendMessage({ timer_status: 'off' });
  }

  event.target.disabled = false;
}


