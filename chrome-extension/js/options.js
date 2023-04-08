requirejs.config(requirejsConfig);
requirejs(['jquery', 'api'],
function ($, api) {

  var $youtrackUrl = $('#youtrack_url')
  var $youtrackAuth = $('#youtrack_auth')
  var $harvestUrl = $('#harvest_url')
  var $harvestLogin = $('#harvest_login')
  var $harvestPassword = $('#harvest_password')

  function toggleState ($el, state) {
    $el.parent('label').removeClass('error success').addClass(state)
  }

// Saves options to chrome.storage
  function saveOptions(e) {
    e.preventDefault()

    chrome.storage.sync.set({
      youtrack_url: $youtrackUrl.val(),
      harvest_url: $harvestUrl.val(),
      harvest_login: $harvestLogin.val(),
      harvest_password: $harvestPassword.val()
    }, function () {
      api.reInitOptions(function () {

        api.youtrack.projectIds.get(function () {
          toggleState($youtrackUrl, 'success')
        }, function (xhr) {
          if (xhr.status == 401) {
            toggleState($youtrackAuth, 'error')
            toggleState($youtrackUrl, 'success')
          } else {
            toggleState($youtrackUrl, 'error')
          }
        })

        api.harvest.time.get(null, null, function () {
          toggleState($([$harvestUrl[0], $harvestLogin[0], $harvestPassword[0]]), 'success')
        }, function (xhr) {
          if (xhr.status == 401) {
            toggleState($harvestUrl, 'success')
            toggleState($([$harvestLogin[0], $harvestPassword[0]]), 'error')
          } else {
            toggleState($harvestUrl, 'error')
            toggleState($([$harvestLogin[0], $harvestPassword[0]]), '')
          }

        })
      })

      // Update status to let user know options were saved.
      var status = $('#status');
      status.text('Options saved.');
      setTimeout(function () {
        status.text('');
      }, 750);
    });
  }

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
  function restoreOptions() {
    // Use default values
    chrome.storage.sync.get({
      youtrack_url: '',
      harvest_url: '',
      harvest_login: '',
      harvest_password: ''
    }, function (items) {
      $youtrackUrl.val(items.youtrack_url);
      $harvestUrl.val(items.harvest_url);
      $harvestLogin.val(items.harvest_login);
      $harvestPassword.val(items.harvest_password);
    });
  }


  restoreOptions()
  $('form').submit(saveOptions)

});
