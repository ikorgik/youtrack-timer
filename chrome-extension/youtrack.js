(function() {
  var YoutrackProfile,
      bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    YoutrackProfile = (function() {
      function YoutrackProfile(host) {
        this.host = 'https://platform.harvestapp.com'; //host;
        this.addTimer = bind(this.addTimer, this);
        this.addTimers = bind(this.addTimers, this);
        this.projectNameSelector = [
          ".fsi-property .attribute.bold",            // full-screen view and edit
          "yt-issue-project"                          // agile popup, full-screen experimental view and edit
        ].join(", ");
        this.itemSelector = [
          ".toolbar_fsi",                             // full-screen view
          ".edit-issue-form",                         // full-screen edit
          ".yt-issue-layout"                          // agile popup, full-screen experimental view and edit
        ].join(", ");
        this.platformLoaded = false;
        this.interval = 250;
        this.loadHarvestPlatform();
        window.setInterval(this.addTimers, this.interval);
      }

      YoutrackProfile.prototype.loadHarvestPlatform = function() {
        var configScript, ph, platformConfig, platformScript;
        platformConfig = {
          applicationName: "Youtrack",
          permalink: "https://%ACCOUNT_ID%.myjetbrains.com/youtrack/issues/%PROJECT_ID%-%ITEM_ID%"
        };
        configScript = document.createElement("script");
        configScript.innerHTML = "window._harvestPlatformConfig = " + (JSON.stringify(platformConfig)) + ";";
        platformScript = document.createElement("script");
        platformScript.src = this.host + "/assets/platform.js";
        platformScript.async = true;
        ph = document.getElementsByTagName("script")[0];
        ph.parentNode.insertBefore(configScript, ph);
        ph.parentNode.insertBefore(platformScript, ph);
        return document.body.addEventListener("harvest-event:ready", (function (_this) {
          return function () {
            _this.platformLoaded = true;
            return _this.addTimers();
          };
        })(this));
      };

      YoutrackProfile.prototype.addTimers = function() {
        var item, items, _i, _len, _results;
        if (!this.platformLoaded) {
          return;
        }
        items = document.querySelectorAll(this.itemSelector);
        _results = [];
        for (_i = 0, _len = items.length; _i < _len; _i++) {
          item = items[_i];
          if (!item.querySelector(".harvest-timer")) {
            _results.push(this.addTimer(item));
          }
        }
        return _results;
      };

      YoutrackProfile.prototype.addTimer = function(item) {
        var data;
        data = this.getDataForTimer(item);
        if (/*this.isTodoCompleted(item) ||*/ this.notEnoughInfo(data)) {
          return;
        }
        this.buildTimer(item, data);
        return this.notifyPlatformOfNewTimers();
      };

      YoutrackProfile.prototype.getDataForTimer = function(item) {
        var summary, itemName, issueId, issueIdParts, projectName, projectId, itemId, host, accountId;
        summary = item.querySelector([
          ".issue-summary",                                               // full-screen view
          ".edit-issue-form__i__summary"                                  // full-screen edit
        ].join(", "));
        if (summary) {
          itemName = summary.textContent.trim();
        }
        else {
          summary = item.querySelector(".yt-issue-body__summary-common"); // agile popup, full-screen experimental view
          if (summary) {
              if (summary.value) {                                        // field being edited
                itemName = summary.value.trim();
              }
              else {
                itemName = summary.textContent.trim();                    // field not being edited
              }
          }
        }
        issueId = item.querySelector([
            ".issueId",                                                   // full screen view
            ".js-issue-id"                                                // agile popup, full-screen experimental view
        ].join(", ")).textContent.trim();
        itemName = issueId + ": " + itemName;
        issueIdParts = issueId.split('-');
        projectId = issueIdParts[0];
        projectName = document.querySelector(this.projectNameSelector).firstChild.textContent.trim();
        itemId = issueIdParts[1];
        host = document.location.host.split('.');
        accountId = host[0];
        return {
          account: {
            id: accountId
          },
          project: {
            id: projectId,
            name: projectName
          },
          item: {
            id: itemId,
            name: itemName
          }
        };
      };

      YoutrackProfile.prototype.isTodoCompleted = function(item) {
        // Does not work for agile popups but we don't use it anyway;
        // prefer to enable tracking time on closed issues
        return !!document.querySelector(".fsi-card.resolved");
      };

      YoutrackProfile.prototype.notEnoughInfo = function(data) {
        var _ref, _ref1;
        return !(((data != null ? (_ref = data.project) != null ? _ref.id : void 0 : void 0) != null) &&
            ((data != null ? (_ref1 = data.item) != null ? _ref1.id : void 0 : void 0) != null));
      };

      YoutrackProfile.prototype.buildTimer = function(item, data) {
        var timer;
        timer = document.createElement("div");
        timer.className = "harvest-timer";
        timer.style.marginRight = "4px";
        timer.setAttribute("id", "harvest-youtrack-timer-" + data.item.id);
        timer.setAttribute("data-account", JSON.stringify(data.account));
        timer.setAttribute("data-project", JSON.stringify(data.project));
        timer.setAttribute("data-item", JSON.stringify(data.item));
        var goAfter =
          item.querySelector('.star_fsi') ||            // full-screen view and edit
                                                        //   ('.issueId' also works pretty well for slightly different position)
          item.querySelector('yt-issues-more-actions'); // agile popup, experimental full-screen view
        return goAfter.parentNode.insertBefore(timer, goAfter.nextSibling);
      };

      YoutrackProfile.prototype.notifyPlatformOfNewTimers = function() {
        var evt;
        evt = new CustomEvent("harvest-event:timers:chrome:add");
        return document.querySelector("#harvest-messaging").dispatchEvent(evt);
      };

      return YoutrackProfile;

    })();

    chrome.runtime.sendMessage({
      type: "getHost"
    }, function(host) {
      return new YoutrackProfile(host);
    });

    chrome.runtime.sendMessage({
      type: 'youtrackLoaded'
    })

}).call(this);
