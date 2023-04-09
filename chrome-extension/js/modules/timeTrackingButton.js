const TimeTrackingButton = {
    url: null,
    authToken: null,
    currentUser: null,

    init(data) {
        this.url = data.youtrack_url;
        this.currentUser = data.currentUser;
        this.authToken = data.authToken;
    },

    users: {
        getCurrent: async function () {
            const fields = 'fields=id,fullName';
            const url = YouTrackAPI.url + '/api/users/me' + `?${fields}`;

            const response = await fetch(url, {
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${YouTrackAPI.authToken}`,
                },
                method: 'GET',
            });

            if (response.ok) {
                const payload = await response.json();
                console.log('getCurrent', payload);
                return payload;
            }
        }
    },

    workItems: {
        getActive: async function () {
            const fields = 'fields=id,created,issue(id,summary),text';
            const currentUserId = YouTrackAPI.currentUser.id;
            const url = YouTrackAPI.url + '/api/workItems' + `?${fields}` + '&author=me&query=timer_started_user_' + currentUserId + '_';
            const response = await fetch(url, {
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${YouTrackAPI.authToken}`,
                },
                method: 'GET',
            });

            if (response.ok) {
                const workItems = await response.json();
                let activeWorkItem = null;

                workItems.forEach((element, index) => {
                    if (element.text === 'timer_started_user_' + currentUserId + '_') {
                        activeWorkItem = element;
                        return;
                    }
                });

                return TimeTrackingButton;
            }
        }
    }
};
