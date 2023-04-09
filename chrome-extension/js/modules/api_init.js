define(['jquery', 'utils'],
function ($, utils) {
  var youtrack = {
    url: utils._f,
    auth: 'perm:c2tvcnpo.NTUtMg==.bgRklWEwpyCzp3hHMrH5bfg60RKsMb', // @todo: Add an interface to add token
    currentUser: null
    // see: https://www.jetbrains.com/help/youtrack/devportal/Manage-Permanent-Token.html
    // see: https://www.jetbrains.com/help/youtrack/devportal/authentication-with-permanent-token.html
  }

  function reInitOptions (cb) {
    chrome.storage.sync.get(['youtrack_url', 'currentUser'], function (data) {
      youtrack.url = function (clean) { return data.youtrack_url + (clean ? '' : '/api/') }
      youtrack.currentUser = data.currentUser;
      console.log('reInitOptions')
      ;(cb || utils._f)()
    })
  }
  //reInitOptions()

  function isOptionsPresent() {
    console.log('youtrack', youtrack);
    return youtrack.url() && youtrack.currentUser;
  }

  // used to check YT url
  youtrack.projectIds = {
      url: function () {
        return this.url() + 'admin/projects/'
      }.bind(youtrack),
      get: function (success, error) {
        $.ajax({
          url: this.url(),
          headers: {
            accept: 'application/json',
            authorization: 'Bearer ' + youtrack.auth
          },
          success: success,
          error: error,
          dataType: 'json',
        })
      }
  }

  // used to check YT url
  youtrack.workItems = {
      url: function () {
        return this.url() + 'workItems'
      }.bind(youtrack),
      getStarted: function (success, error) {
        const fields = 'id,created,issue(id,summary),text';
        const currentUserId = youtrack.currentUser.id;
        // const currentUser = chrome.storage.sync.get("currentUser");
        console.log('currentUserAsync', currentUserId);

        $.ajax({
          url: this.url() + '?fields=' + fields + '&author=me&query=timer_started_user_' + currentUserId + '_',
          headers: {
            accept: 'application/json',
            authorization: 'Bearer ' + youtrack.auth
          },
          success: success,
          error: error,
          dataType: 'json',
        })
      }
  }

  // Get current user data.
  youtrack.users = {
      url: function () {
        return this.url() + 'users/me'
      }.bind(youtrack),
      getCurrent: function (success, error) {
        $.ajax({
          url: this.url() + '?fields=id,fullName',
          headers: {
            accept: 'application/json',
            authorization: 'Bearer ' + youtrack.auth
          },
          success: success,
          error: error,
          dataType: 'json',
        })
      }
  }

  youtrack.workItem = {
    url: function (issueId) {
      return this.url() + 'issues/%issue_id%/timeTracking/workItems/'.replace('%issue_id%', issueId)
    }.bind(youtrack),
    getAll: function (issueId, success, error) {
      $.ajax({
        url: this.url(issueId) + '?fields=text,id',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer ' + youtrack.auth
        },
        dataType: 'json',
        success: success,
        error: error,
      })
    },
    editOrAdd: function (issueId, itemId, data, success, error) {
      $.ajax({
        url: this.url(issueId) + (itemId || ''),
        headers: {
          accept: 'application/json',
          authorization: 'Bearer ' + youtrack.auth
        },
        method: itemId ? "PUT" : "POST",
        success: success,
        error: error,
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
      })
    }
  }

  return {
    isOptionsPresent: isOptionsPresent,
    reInitOptions: reInitOptions,
    youtrack: youtrack
  }
});
