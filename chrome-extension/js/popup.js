(function ($) {

  async function initPopup() {
    const { currentUser, youtrack_url, authToken } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken']);
    let workItems = [];
    let activeWorkItem = null;
    const timerId = `[timer_u${currentUser.id}]`;

    try {
      const fields = 'id,created,issue(id,summary),text';
      const url = youtrack_url + '/api/workItems';

      workItems = await $.ajax({
        url: url + '?fields=' + fields + '&author=me&query=' + timerId,
        headers: {
          accept: 'application/json',
          authorization: 'Bearer ' + authToken
        },
        dataType: 'json',
        async: false
      })

    } catch (error) {
      console.error('catchError', error);
      return;
    }

    $.each(workItems, async function(key, value) {
      if (value.text.includes(timerId)) {
        activeWorkItem = value;
         await chrome.storage.sync.set({
          activeWorkItem: value
        });
        return false;
      }
    });

    // Fill current task container.
    if (activeWorkItem !== null) {
      const total = Date.now() - activeWorkItem.created;
      var hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

      const formattedTime = hours + ":" + minutes;

      var $current_task = $(".active-tracking");
      $(".label", $current_task).text(activeWorkItem.issue.summary);
      $(".time", $current_task).text(formattedTime);

      //$(".time", $current_task).html(time_output(data.current.amount, data.current.estimate));

      $(".button .fa", $current_task).addClass("fa-pause");
      //$(".button .fa", $current_task).addClass("fa-play");
      // if (!data.current.active) {
      //   $(".task-active .fa", $current_task).removeClass("fa-play").addClass("fa-pause");
      // }
      // if (!data.current.active) {
      //   $(".task-active .fa", $current_task).removeClass("fa-play").addClass("fa-pause");
      // }
    }

    // Show timetracking container.
    $(".loading-page").fadeOut(200, function() {
      $(this).removeClass("processed");
      $(".current-task, .actions").animate({opacity: 1.0}, 300);
      $(".working-days").delay(150).animate({opacity: 1.0}, 700);
    });

    console.log('activeWorkItem', activeWorkItem);
  }

  // When popup opens.
  initPopup();

  // Click Stop button.
  $(".active-tracking .button").click(async function() {
    const { currentUser, youtrack_url, authToken, activeWorkItem } = await chrome.storage.sync.get(['youtrack_url', 'currentUser', 'authToken', 'activeWorkItem']);
    console.log('activeWorkItem', activeWorkItem)

    try {
      const itemId = activeWorkItem.id;
      const issueId = activeWorkItem.issue.id;
      const url = youtrack_url + '/api/issues/%issue_id%/timeTracking/workItems/'.replace('%issue_id%', issueId);
      const total = Date.now() - activeWorkItem.created;

      var workData = {
        text: activeWorkItem.issue.summary,
        duration: {
          minutes: parseInt((total / 1000 / 60).toFixed())
        },
        // worktype: {name: entry.task} // @todo: add worktype support.
      }

      console.log('workData', workData);

      const aaa = await $.ajax({
      //$.ajax({
        url: url + (itemId || ''),
        headers: {
          accept: 'application/json',
          authorization: 'Bearer ' + authToken
        },
        //method: itemId ? "PUT" : "POST",
        type: 'post',
        success: function (data) {
          console.log('success', data)
        },
        error: function (error) {
          console.log('error', error)
        },
        data: JSON.stringify(workData),
        dataType: 'json',
        async: false,
        contentType: 'application/json',
      })
      console.log('aaa', aaa);

    } catch (error) {
      console.error('catchError', error);
      return;
    }




  });


})(jQuery);
