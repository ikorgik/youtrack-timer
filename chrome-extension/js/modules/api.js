define(['jquery', 'utils'],
function ($, utils) {
  var youtrack = {
    url: utils._f,
    auth: 'perm:c2tvcnpo.NTUtMg==.bgRklWEwpyCzp3hHMrH5bfg60RKsMb' // @todo: Add an interface to add token
    // see: https://www.jetbrains.com/help/youtrack/devportal/Manage-Permanent-Token.html
    // see: https://www.jetbrains.com/help/youtrack/devportal/authentication-with-permanent-token.html
  }

  var harvest = {
    url: utils._f,
    auth: utils._f
  }

  function reInitOptions (cb) {
    chrome.storage.sync.get(['youtrack_url', 'harvest_url', 'harvest_login', 'harvest_password'], function (data) {
      youtrack.url = function (clean) { return data.youtrack_url + (clean ? '' : '/api/') }
      harvest.url = function () { return data.harvest_url }
      harvest.auth = function () { return btoa(data.harvest_login + ':' + data.harvest_password) }

      ;(cb || utils._f)()
    })
  }
  reInitOptions()

  function isOptionsPresent() {
    return youtrack.url() && harvest.url() && harvest.auth()
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

  harvest.time = {
    url: function () {
      return this.url() + '/daily/'
    }.bind(harvest),
    get: function (id, date, success, error) {
      var url = this.url()

      if (id) {
        url += 'show/' + id

      } else if (date) {
        var d = new Date(date)
        url += +utils.dayOfYear(d) + '/' + d.getFullYear()
      }
      $.ajax({
        url: url + '?slim=1',
        headers: {
          accept: 'application/json',
          authorization: 'Basic ' + harvest.auth()
        },
        dataType: 'json',
        success: success,
        error: error
      })
    }

  }

  return {
    isOptionsPresent: isOptionsPresent,
    reInitOptions: reInitOptions,
    youtrack: youtrack,
    harvest: harvest
  }
});
