const YouTrackAPI = {
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
            const fields = 'fields=id,created,issue(id,idReadable,summary,project(id,name)),text';
            const currentUserId = YouTrackAPI.currentUser.id;
            const timerId = `[timer_u${currentUserId}]`
            const url = YouTrackAPI.url + '/api/workItems' + `?${fields}` + '&author=me&query=' + timerId;
            const response = await fetch(url, {
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${YouTrackAPI.authToken}`,
                },
                method: 'GET',
            });

            let activeWorkItem = null;
            if (response.ok) {
                const workItems = await response.json();
                workItems.forEach((element, index) => {
                    if (element.text.includes(timerId)) {
                        activeWorkItem = element;
                        return;
                    }
                });
            }
            return activeWorkItem;
        },
        stopActive: async (description = '') => {
            const activeWorkItem = await YouTrackAPI.workItems.getActive();
            if (activeWorkItem === null) {
                return null;
            }

            const itemId = activeWorkItem.id;
            const issueId = activeWorkItem.issue.id;
            const url = YouTrackAPI.url + `/api/issues/${issueId}/timeTracking/workItems/${itemId}`;
            const totalTime = Date.now() - activeWorkItem.created;
            const minutes = parseInt((totalTime / 1000 / 60).toFixed());

            var workData = {
                text: description || activeWorkItem.issue.summary,
                duration: {
                    minutes: minutes < 1 ? 1 : minutes,
                },
                // worktype: {name: entry.task} // @todo: add worktype support.
            }

            const response = await fetch(url, {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    authorization: `Bearer ${YouTrackAPI.authToken}`,
                },
                method: 'POST',
                body: JSON.stringify(workData),
            });
            return response;
        },

        startTimer: async (issueId) => {
            const url = YouTrackAPI.url + `/api/issues/${issueId}/timeTracking/workItems`;

            const text = `(DON'T CHANGE) Timer [timer_u${YouTrackAPI.currentUser.id}] started.`;
            var workData = {
                text: text,
                // text: `timer_started_user_${YouTrackAPI.currentUser.id}_`,
                duration: {
                    minutes: 1
                },
                // worktype: {name: entry.task} // @todo: add worktype support.
            }

            const response = await fetch(url, {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    authorization: `Bearer ${YouTrackAPI.authToken}`,
                },
                method: 'POST',
                body: JSON.stringify(workData),
            });
            return response;
        }
    }
};
