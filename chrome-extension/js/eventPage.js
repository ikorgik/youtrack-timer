requirejs.config(requirejsConfig);
requirejs(['jquery', 'api', 'utils'],
function ($, api, utils) {

  var importedStr = "imported from Harvest"
  var checkInProgress = []
  var checkDate = []
  var ytLoginAttempt = false


  chrome.alarms.clearAll(function () {
    chrome.alarms.create('hourly', { periodInMinutes: 60 })
  })

  function reactivateAlarm (cb) {
    chrome.alarms.getAll(function (alarms) {
      var hourlyAlarm = alarms.filter(function (alarm) {
        return alarm.name == 'hourly'
      })[0]
      if (new Date(hourlyAlarm.scheduledTime) < new Date) {
        chrome.alarms.clear('hourly', function () {
          chrome.alarms.create('hourly', {periodInMinutes: 60})
          cb && cb()
        })
      }
    })
  }

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.type == 'youtrackLoaded') {
      reactivateAlarm(process)
    }
  })

  chrome.alarms.onAlarm.addListener(function (alarm) {
    switch(alarm.name) {
      case 'hourly':
        process()
        break;
      case 'checkInProgress':
        checkInProgress.forEach(function (id) {
          process(id)
        })
        break;
      case 'possiblyOffline':
        checkDate.forEach(function (date) {
          process(null, date)
        })
    }
  })

  chrome.browserAction.onClicked.addListener(function () {
    reactivateAlarm()
    process()
  })

  function process (id, date) {
    if (!api.isOptionsPresent()) { return }

    updateTitle()

    var cDate = date || +new Date
    var cDateKey = checkDate.indexOf(cDate)
    if(cDateKey) {
      delete checkDate[cDateKey]
      if (!checkDate.join('')) {
        checkDate = []
      }
    }

    api.harvest.time.get(id, date, function (data) {
      // if within first hour of today - check yesterday
      data = data && (data.day_entries || [data]) || []

      if (!data.length) {
        if (!date && (new Date).getHours() < 1) {
          var yesterday = +new Date - utils.DAY_IN_MS
          return process(null, yesterday)
        }
        return
      }
      data.forEach(function (entry, index) {

        // Set the delay between update requests, otherwise "Spent time" calculated wrongly.
        // @todo: enhance functionality.
        setTimeout(function () {
          processEntry(entry);
        }, index * 300);
      })

    }, function () { // TODO count errors, on 10 - show red icon ?
      addOfflineAlarm(date, 2) // if offline than we won't spam any server, since this is the first request
    })

  }

  function processEntry(entry) {
    var issueId = (entry.notes || '').match(/^([A-Z]+-\d+)/)
    if (!issueId) { return } // not YT entry

    issueId = issueId[1]

    var checkingIdKey = checkInProgress.indexOf(entry.id)
    if (checkingIdKey) {
      delete checkInProgress[checkingIdKey]
      if (!checkInProgress.join('')) {
        checkInProgress = []
      }
    }

    if (entry.timer_started_at) { // unfinished
      if (!checkInProgress.includes(entry.id))
        checkInProgress.push(entry.id)
      chrome.alarms.get('checkInProgress', function (alarm) {
        if (!alarm) {
          chrome.alarms.create('checkInProgress', {delayInMinutes: 10})
        }
        updateTitle()
      })
    }

    api.youtrack.workItem.getAll(issueId, function (data) { // TODO possibly cache issueId
      ytLoginAttempt = false
      var workData = {
        text: importedStr + '; (' + entry.id + ')',
        date: +new Date(entry.spent_at),
        duration: {
          minutes: parseInt((entry.hours * 60).toFixed())
        },
        // worktype: {name: entry.task} // @todo: add worktype support.
      }
      // if no such entry add new
      var ytEntry = data.filter(function (ytEntry) {
        return ~(ytEntry.text || '').indexOf(entry.id)
      })[0]

      var _addOrEdit = function (ytEntryId) {
        api.youtrack.workItem.editOrAdd(issueId, ytEntryId, workData, null, function (xhr) {
          if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
            return // JSON parse error, actual success
          }
          var data = xhr.responseJSON || {}
          // TODO there is possibility to know which workTypes are present on the server -
          // - may be useful to cache available projects and worktypes
          // if no worktype - add w/o it
          if (xhr.status == 400 && data.value == "Worktype [" + workData.worktype.name + "] is not attached to project.") {
            delete workData.worktype
            api.youtrack.workItem.editOrAdd(issueId, ytEntryId, workData, null, function () {
              addOfflineAlarm(workData.date) // TODO no need to make request with worktype again
            })
          } else {
            addOfflineAlarm(workData.date)
          }

        })
      }

      if (ytEntry) {
        if (ytEntry.duration != workData.duration) {
          _addOrEdit(ytEntry.id)
        }
      } else {
        _addOrEdit()
      }
    }, function (xhr) {
      switch (xhr.status) {
        case 403:
          if (ytLoginAttempt || $('iframe.yt-relogin').length) { return }
          ytLoginAttempt = true
          $('<iframe class="yt-relogin">').appendTo('body').one('load', function () {
            setTimeout(function () { $(this).remove() }.bind(this), 3e4)
          }).attr('src', api.youtrack.url(true))
          addOfflineAlarm(date, 1)
          break;
        case 404: // TODO issue id is not found / have not access
          break;
        default:
          addOfflineAlarm(date)
      }
    })
  }

  function updateTitle() {
    chrome.alarms.getAll(function (a) {
      var closestScheduledTime = a.map(function (entry) {
        return entry.scheduledTime
      }).sort()[0]
      var d = new Date(closestScheduledTime)
      var parsedDate = d.getHours() + ":" + d.getMinutes()
      chrome.browserAction.setTitle({title: "next sync on " + parsedDate + ". Click to Instant sync"})
    })
  }

  function addOfflineAlarm(date, delay) {
    delay = delay || 30
    checkDate.push(date)
    chrome.alarms.get('possiblyOffline', function (alarm) {
      if (!alarm) {
        chrome.alarms.create('possiblyOffline', {delayInMinutes: delay})
      }
      updateTitle();
    })
  }

});
