chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.timer_status === null) {
        return;
      }

      chrome.action.setIcon({
        path: {
          '19': `images/youtrack-timer-toolbar-${request.timer_status}@19px.png`,
          '38': `images/youtrack-timer-toolbar-${request.timer_status}@38px.png`,
        },
      })

      const title = request.timer_status === 'on' ? 'View the running YouTrack timer' : 'Start a YouTrack timer'
      chrome.action.setTitle({ title })
    }
);