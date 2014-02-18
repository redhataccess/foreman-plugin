/*
# Copyright 2013 Red Hat, Inc.
#
# This software is licensed to you under the GNU General Public
# License as published by the Free Software Foundation; either version
# 2 of the License (GPLv2) or (at your option) any later version.
# There is NO WARRANTY for this software, express or implied,
# including the implied warranties of MERCHANTABILITY,
# NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
# have received a copy of GPLv2 along with this software; if not, see
# http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
*/
var access_client_id = 'redhat-client=redhat-access-plugin-foreman-0.0.1'
var portal_hostname = 'access.redhat.com';
var strata_hostname = 'api.' + portal_hostname;
var result_index = 0;
var baseAjaxParams2 = {
  accepts: {
    jsonp: 'application/json,text/json'
  },
  crossDomain: true,
  type: 'GET',
  method: 'GET',
  headers: {
    Accept: 'application/json,text/json'
  },
  xhrFields: {
    withCredentials: true
  },
  contentType: 'application/json',
  data: {},
  dataType: 'jsonp'
};
(function($) {


  $(document).ready(function() {

    checkLogIn();
    $(window).on("focus", checkLogIn); // automatically recheck if the user navigates way from page
    $(document).on('submit', '#rh-search', function(evt) {
      //console("on subbmit");
      doSearch($('#rhSearchStr').val());
      evt.preventDefault();
    });
  });

  function setLoginStatus(loginName, status) {
    if (status) {
      $("#rhSearchStr").prop('disabled', false);
      $('#logged-in').html("Logged in to the Red Hat Customer Portal as " + loginName +
        ".&nbsp;&nbsp;<a href='https://www.redhat.com/wapps/sso/logout.html?redirect=https://access.redhat.com/logout' target='_blank'>Log Out </a>" +
        "&nbsp;&nbsp;<a href='http://access.redhat.com'> Visit Customer Portal</a>");

    } else {
      $("#rhSearchStr").prop('disabled', true);
      var ssoPage = 'https://www.redhat.com/wapps/sso/login.html?redirect=https://access.redhat.com/home';
      $('#logged-in').html("<div style='color: #bd362f;'>Not logged in to the Red Hat Customer Portal. <a href=" + ssoPage + " target='_blank'>Please sign in </a ></div>");

    }

  }

  function checkLogIn() {
    // Set up stuff for RHN/Strata queries
    //console.log("on ready");

    var authAjaxParams = $.extend({
      url: 'https://' + portal_hostname +
        '/services/user/status?jsoncallback=?',
      success: function(auth) {
        'use strict';
        if (auth.authorized) {
          setLoginStatus(auth.name, true);
        } else {
          setLoginStatus(null, false);
        }
      }
    }, baseAjaxParams2);

    // See if we are logged in to RHN or not
    $.ajax(authAjaxParams);

  }



  function onFailure(response, status, xhr) {
    console.log(response);
    console.log(status);
    console.log(xhr);
  }

  function doSearch(searchStr) {

    clearResults();
    strata.diagnose(searchStr,
      function(response) {
        addResult(response, result_index)
        appendResultText(response, result_index);
        result_index++;
      },
      onFailure,
      11
    );

  }


  function clearResults(response, index) {
    $('#solutions').html(''); 
    $('#solution').html('');
  }

  function addResult(response, index) {

    var result_item = "<div class='list-group-item'>" + "<a data-toggle='collapse' data-parent='#solution' href='#soln" + index + "'>" + response.title + "</a>" + "</div>"
    $('#solutions').append(result_item);
  }

  function appendResultText(response, index) {
    var panel = "<div class='panel' style='border:0'>";
    panel = panel + "<div id=soln" + index + " class='panel-collapse collapse'>" + "<div class='panel-body'>";

    var environment_html = response.environment.html;
    var issue_html = response.issue.html;
    var resolution_html = '';
    if (response.resolution !== undefined) {
      resolution_html = response.resolution.html;
    }
    var solution_html = "<h3>Environment</h3>" + environment_html + "<h3>Issue</h3>" + issue_html + "<h3>Resolution</h3>" + resolution_html;
    panel = panel + solution_html;
    panel = panel + "</div></div></div>"

    $('#solution').append(panel);
  }

  function getSelectedText() {
    var t = '';
    if (window.getSelection) {
      t = window.getSelection();
    } else if (document.getSelection) {
      t = document.getSelection();
    } else if (document.selection) {
      t = document.selection.createRange().text;
    }
    return t;
  }


})(jQuery);