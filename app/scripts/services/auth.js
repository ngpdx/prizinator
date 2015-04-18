(function (angular) {
'use strict';

angular.module('angularPrizinatorApp.auth')
  .service('oauth', oauth);

function oauth($window, $q, $location) {
  var site = 'https://secure.meetup.com/';
  var authPath = 'oauth2/authorize/';
  var redirectUri = window.location.href;
  var clientId = '';
  var scopes = [];
  var redirect = false;
  var logged = false;

  var service = {
    init: init,
    login: login,
    logout: logout,
    isLogged: isLogged,
    isExpired: isExpired,
    get: get,
    getUser: getUser
  };

  return service;

  function init(param) {
    /* We need a MeetUp consumer id to make the authorization request. */
    if (typeof param.clientId === 'string') {
      clientId = param.clientId;
    }
    /* Not required, but allows us to further customize the request. */
    if (param.scopes instanceof Array) {
      scopes = param.scopes;
    }
    /* Redirect to a different URI (e.g. 'http://localhost/logged-in') */
    if (typeof param.redirectUri === 'string') {
      redirectUri = param.redirectUri;
    }
    /* Leave redirect vs popup up to someone else. */
    if (typeof param.redirect === 'boolean') {
      redirect = param.redirect;
    }
    if (typeof param.site === 'string') {
      site = param.site;
    }
    if (typeof param.authPath === 'string') {
      authPath = param.authPath;
    }

    if (redirect) {
      redirectRoutine();
    } else {
      intermPopupRoutine();
    }

    return get();
  }

  function get() {
    var promise;
    if (isExpired()) {
      promise = authRoutine();
    } else {
      promise = localRoutine();
      logged = true;
    }
    return promise;
  }

  /** Leave a buffer between now and the actual expiration. */
  function isExpired() {
    var user = getUser();
    if (!user || !user.expiresIn) {
      return true;
    }
    var timestamp = getTimestamp();
    /* Doesn't seem to be up to two weeks with ageless scope. */
    var expiresIn = parseInt(user.expiresIn) * 1000;
    var expiration = timestamp + expiresIn - 1000;
    var now = Date.now();
    return expiration < now;
  }

  function localRoutine() {
    var deferred = $q.defer();
    var user = getUser();
    resolve(user, deferred);
    return deferred.promise;
  }

  function authRoutine() {
    var promise;
    if (redirect) {
      var user = redirectRoutine();
      /* Return a promise for the sake of consistency. */
      var deferred = $q.defer();
      resolve(user, deferred);
      promise = deferred.promise;
    } else {
      promise = popupRoutine();
    }
    return promise;
  }

  /** Main window. Fetch customized URL from popup. */
  function popupRoutine() {
    var deferred = $q.defer();

    /* Return promise in case init isn't called first. */
    if ($window.opener) {
      return deferred.promise;
    }

    angular.element($window).unbind('storage', store);
    angular.element($window).bind('storage', store);
    function store(event) {
      var key = event.key || event.originalEvent.key;
      if (key === 'authUser') {
        var user = getUser();
        resolve(user, deferred);
      }
    }

    return deferred.promise;
  }

  /** Redirection within popup once the user authorizes our app. */
  function intermPopupRoutine() {
    if ($window.opener) {
      var user = getHashValues();
      storeUser(user);
      $window.close();
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
    var user = getHashValues();
    if (user.error || user.accessToken) {
      storeUser(user);
      $location.url($location.path());
    }
    return user;
  }

  function login() {
    requestAuthorization();
  }

  function logout() {
    localStorage.clear();
    logged = false;
  }

  function requestAuthorization() {
    var authUrl =
      site + authPath +
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

  function resolve(user, deferred) {
    if (user.accessToken) {
      deferred.resolve(user);
      logged = true;
    } else {
      deferred.reject(user);
    }
  }

  function storeUser(user) {
    var timestamp = Date.now();
    var json = JSON.stringify(user);
    localStorage.setItem('authTimestamp', timestamp);
    localStorage.setItem('authUser', json);
  }

  function getUser() {
    var user = localStorage.getItem('authUser');
    return JSON.parse(user);
  }

  function getTimestamp() {
    var timestamp = localStorage.getItem('authTimestamp');
    return parseInt(timestamp);
  }

  function isLogged() {
    return logged;
  }
}

function toCamelCase(value) {
  return value.replace(/(\_[a-z])/, function (v) {
    return v.toUpperCase().replace('_', '');
  });
}

function getHashValues() {
  var hash = window.location.hash;
  var result = {};
  var segments = hash.slice(1, hash.length).split('&');
  for (var i = 0, len = segments.length; i < len; i++) {
    var pair = segments[i].split('=', 2);
    var key = toCamelCase(pair[0]);
    var value = pair[1] || '';
    result[key] = value;
  }
  return result;
}

})(angular);
