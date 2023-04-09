export const YouTrack = {
  url: null,
  auth: 'perm:c2tvcnpo.NTUtMg==.bgRklWEwpyCzp3hHMrH5bfg60RKsMb', // @todo: Add an interface to add token
  currentUser: null,

  init(data) {
    this.url = data.youtrack_url;
    this.currentUser = data.currentUser;
  },

  workItems: {
    getStarted: function () {
      const fields = 'id,created,issue(id,summary),text';
      const currentUserId = YouTrack.currentUser.id;
      // const currentUser = chrome.storage.sync.get("currentUser");
      console.log('currentUserAsync', currentUserId);

      $.ajax({
        url: YouTrack.url + 'workItems?fields=' + fields + '&author=me&query=timer_started_user_' + currentUserId + '_',
        headers: {
          accept: 'application/json',
          authorization: 'Bearer ' + YouTrack.auth
        },
        dataType: 'json',
        async: false
      })
    }
  }
};

export default YouTrack;