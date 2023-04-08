requirejs.config(requirejsConfig);
requirejs(['jquery', 'api'],
function ($, api) {

  var $youtrackUrl = $('#youtrack_url')
  var $youtrackAuth = $('#youtrack_auth')

  function toggleState ($el, state) {
    $el.parent('label').removeClass('error success').addClass(state)
  }

// Saves options to chrome.storage
  function saveOptions(e) {
    e.preventDefault()

    chrome.storage.sync.set({
      youtrack_url: $youtrackUrl.val()
    }, function () {
      api.reInitOptions(function () {

        api.youtrack.currentUser.get(function (currentUser) {
          toggleState($youtrackUrl, 'success');

          // Save current user to the storage.
          chrome.storage.sync.set({
            currentUser: currentUser
          });

        }, function (xhr) {
          if (xhr.status == 401) {
            toggleState($youtrackAuth, 'error')
            toggleState($youtrackUrl, 'success')
          } else {
            toggleState($youtrackUrl, 'error')
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
      youtrack_url: ''
    }, function (items) {
      $youtrackUrl.val(items.youtrack_url);
    });
  }

  restoreOptions()
  $('form').submit(saveOptions)
});
