(function (angular) {
'use strict';

/**
 * TODO:
 * 1. Fetch user stuff on page reload.
 * 2. Handle when token expires.
 * 3. Create some sort of accompanying directive.
 * 4.
 */
angular.module('prizinator.auth', [])
  .service('oauth', oauth);

function oauth($window, $q, $location) {
  var redirectUri = window.location.href;
  var clientId = '';
  var response = {};
  var scopes = [];
  var redirect = false;

  var service = {
    init: init,
    login: login,
    logout: logout
  };

  return service;

  function init(param) {
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

    var promise;
    if (redirect) {
      promise = redirectRoutine();
    } else {
      promise = popupRoutine();
    }

    return promise;
  }

  function login() {
    requestAuthorization();
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

  function setResponse(accessToken, error, deferred) {
    if (accessToken) {
      response = {accessToken: accessToken};
      deferred.resolve(response);
    } else {
      response = {error: error};
      deferred.reject(response);
    }
  }

  function popupRoutine() {
    if ($window.opener) {
      ppPopupRoutine();
    } else {
      var promise = ppMainWindowRoutine();
    }

    return promise;
  }

  /** Redirection within popup once the user authorizes our app. */
  function ppPopupRoutine() {
    var hash = $window.location.hash;
    var token = getHashValue(hash, 'access_token');
    var error = getHashValue(hash, 'error');
    localStorage.authAccessToken = token;
    localStorage.authError = error;
    $window.close();
  }

  /** Main window. Fetch customized URL from popup. */
  function ppMainWindowRoutine() {
    var deferred = $q.defer();

    angular.element($window).unbind('storage', store);
    angular.element($window).bind('storage', store);
    function store() {
      var token = localStorage.authAccessToken;
      var error = localStorage.authError;
      setResponse(token, error, deferred);
    }

    return deferred.promise;
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

  /** Return a promise for the sake of consistency. */
  function redirectRoutine() {
    var deferred = $q.defer();
    var hash = $window.location.hash;
    var token = getHashValue(hash, 'access_token');
    var error = getHashValue(hash, 'error');

    if (token || error) {
      setResponse(token, error, deferred);
    }

    $location.url($location.path());

    return deferred.promise;
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
