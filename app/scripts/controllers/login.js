(function (angular) {
'use strict';

angular.module('angularPrizinatorApp.auth', [])
  .controller('loginCtrl', loginCtrl);

function loginCtrl($scope, oauth, meetup, meetupConfiguration) {
  oauth.init({
    'clientId': meetupConfiguration.getClientId(),
    'redirect': true,
    'scopes': ['ageless']
  }).then(function () {
    fetch();
  });

  function fetch() {
    meetup.getUser().then(function (user) {
      var thumb = user.photo.thumb_link;
      $scope.thumb = {
        'background-image': 'url(\'' + thumb + '\')'
      };
    });
  }

  $scope.isLogged = oauth.isLogged;
  $scope.login = function () {
    oauth.login();
    oauth.get().then(function () {
      fetch();
    });
  };
  $scope.logout = function () {
    oauth.logout();
  };
}

})(angular);
