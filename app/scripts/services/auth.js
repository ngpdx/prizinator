(function (angular) {
'use strict';

angular.module('prizinator.auth', [])
  .service('oauth', oauth);

function oauth($window) {
  var redirectUri = window.location.href;
  var clientId = '';
  var accessToken = '';
  var scopes = [];
  var redirect = false;

  var service = {
    init: init,
    login: login,
    logout: logout
  };

  return service;

  function init(param) {
    if (redirect) {
      redirectRoutine();
    } else {
      popupRoutine();
    }

    /* We need a MeetUp consumer id to make the authorization request. */
    if (param.clientId) {
      clientId = param.clientId;
    }
    /* Not required, but allows us to further customize the request. */
    if (param.scopes) {
      scopes = param.scopes;
    }
    /* Redirect to a different URI (e.g. 'http://localhost/logged-in') */
    if (param.redirectUri) {
      redirectUri = param.redirectUri;
    }
    /* Leave redirect vs popup up to someone else. */
    if (typeof param.redirect === 'boolean') {
      redirect = param.redirect;
    }
  }

  function login() {
    var deferred = $q.defer();
    requestAuthorization();
    return deferred.promise;
  }

  function logout() {
    localStorage.clear();
  }

  function requestAuthorization() {
    var authUrl =
      'https://secure.meetup.com/oauth2/authorize/' +
      '?response_type=token' +
      '&client_id=' + clientId +
      '&scope=' + scopes.join(',') +
      '&redirect_uri=' + redirectUri;

    if (redirect) {
      /* MeetUp will redirect back to our app upon authorization or denial. */
      $window.location = authUrl;
    } else {
      openWindow(authUrl);
    }
  }

  function popupRoutine() {
    /* Redirected within popup once the user authorizes our app. */
    if ($window.opener) {
      var hash = $window.location.hash;
      var token = getHashValue(hash, 'access_token');
      var error = getHashValue(hash, 'error');
      localStorage.authAccessToken = token;
      localStorage.authError = error;
      $window.close();
    }
    /* Main window. Fetch customized URL from popup. */
    else {
      angular.element($window).bind('storage', function () {
        accessToken = localStorage.authAccessToken;
      });
    }
  }

  function openWindow(authUrl) {
    var height = 420;
    var width = 600;
    var top = (screen.height - height) / 2;
    var left = (screen.width - width) / 2;

    $window.open(authUrl, 'MeetUp',
      'height=' + height + ',' +
      'width=' + width + ',' +
      'top=' + top + ',' +
      'left=' + left + ',');
  }

  function redirectRoutine() {
    var hash = $window.location.hash;
    var userId = getHashValue(hash, 'user_id');
    if (userId) {
      localStorage.userId = userId;
    }
  }
}

function getHashValue(hash, param) {
  var segments = hash.slice(1, -1).split('&');
  for (var i = 0, len = segments.length; i < len; i++) {
    var pair = segments[i].split('=', 2);
    if (param === pair[0]) {
      return pair[1] || '';
    }
  }
  return '';
}

})(angular);
