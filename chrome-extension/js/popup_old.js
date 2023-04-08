(function ($) {

  // Get extention settings.
  chrome.storage.sync.get({
    erpalHost: 'https://erpal.your-site.com',
    hoursPerDay: '8'
  }, function(items) {
    var host = items.erpalHost;
    var day_limit = parseFloat(items.hoursPerDay);

    var url = host + "/services/session/token";
    var tt_url = host + "/rest/projects/timetracking/statistics.json";

    $.ajax({
      url: url,
      type: "get",
      dataType: "text",
      error: function (jqXHR, textStatus, errorThrown) {
        $(".error-page")
          .addClass("processed")
          .find(".messages")
          .html('Please define correct "ERPAL host". <br /> Go to extensions page (chrome://extensions) and click "Options" for extension.');
        console.log(errorThrown);
      },
      success: function (token) {
        $.ajax({
          url : tt_url,
          type : "post",
          dataType : "json",
          crossDomain: true,
          cache: false,
          beforeSend: function (request) {
            request.setRequestHeader("X-CSRF-Token", token);
          },
          error : function(data) {
            if (data.status == 403) {
              $(".loading-page").fadeOut(200, function() {

                $(".login-page")
                  .addClass("processed")
                  .find("a.login")
                  .attr("href", host);
              });
            }
            else {
              console.log("Error", data);
            }
          },
          success : function(data) {
            // Fill current task container.
            if (data.current.title != undefined) {
              var $current_task = $(".current-task");
              $(".label", $current_task).text(data.current.title);
              $(".time", $current_task).html(time_output(data.current.amount, data.current.estimate));

              $(".task-active .fa", $current_task).addClass("fa-play");
              if (!data.current.active) {
                $(".task-active .fa", $current_task).removeClass("fa-play").addClass("fa-pause");
              }
            }

            var week_limit = day_limit * 5;
            var month_limit = data.working_days.all * day_limit;

            // Fill details container.
            var $details = $(".details");
            $(".week .time", $details).html(time_output(data.week, week_limit));
            $(".month .time", $details).html(time_output(data.month, month_limit));

            // Fill working days container.
            var rest_time = month_limit - parseFloat(data.month);
            if (data.day > day_limit && (data.working_days.all - data.working_days.current > 1)) {
              // Set next day if day time more then day limit.
              data.working_days.current++;
            }
            else {
              rest_time += parseFloat(data.day);
            }
            var rest_days = data.working_days.all - data.working_days.current;
            if (rest_days < 1) {
              rest_days = 1;
            }
            var rest_time_days = rest_time / rest_days;
            var rest_text = rest_days + " * " + rest_time_days.toTime();
            $(".working-days .time").html(time_output(data.working_days.current, data.working_days.all, false, rest_text));

            // Fill chart container.
            var percent = data.day / day_limit * 100;
            var rest = day_limit - data.day;
            var $chart = $(".chart");
            $chart.attr("data-percent", percent);
            $(".chart-time", $chart).html(parseFloat(data.day).toTime());
            $(".chart-limit", $chart).html(day_limit.toTime());
            $(".chart-rest", $chart).html(rest.toTime());
            $chart.easyPieChart({
              barColor: "#97D5B6"
            });

            // Show timetracking container.
            $(".loading-page").fadeOut(200, function() {
              $(this).removeClass("processed");
              $(".current-task, .actions").animate({opacity: 1.0}, 300);
              $details.animate({opacity: 1.0}, 700);
              $(".working-days").delay(150).animate({opacity: 1.0}, 700);
            });

            // Adds behaviour for actions links.
            $("a.tt-link").attr("href", host + "/projects/timetrackings/tmp");
            $("a.close").click(function (event) {
              window.close();
            });
          }
        });
      }
    });
  });

  /**
   * Theming function to output time in "current / limit (rest)" format.
   */
  var time_output = function(current, limit, to_time, rest) {
    to_time = (to_time == undefined) ? true : to_time;

    if (rest == undefined) {
      rest = parseFloat(limit) - parseFloat(current);
    }
    if (to_time) {
      current = parseFloat(current).toTime();
      limit = parseFloat(limit).toTime();
      rest = parseFloat(rest).toTime();
    }
    var output = "";
    output += "<span class=''>" + current + "</span>";
    output += " / ";
    output += "<span class=''>" + limit + "</span>";
    output += "<span class='rest'> (" + rest + ")</span>";
    return output;
  }

  /**
   * Converts float number to time format.
   */
  Number.prototype.toTime = function() {
    var positive = (this < 0) ? '-' : '';
    var val = Math.abs(this);
    var minutes = (val % 1).toFixed(2) * 60;
    minutes = minutes.toFixed();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    return positive + Math.trunc(val) + ':' + minutes;
  };

})(jQuery);
