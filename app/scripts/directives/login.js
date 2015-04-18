(function (angular) {
'use strict';

angular.module('angularPrizinatorApp.auth')
  .directive('piLogin', login);

function login() {
  return {
    restrict: 'E',
    controller: 'loginCtrl',
    templateUrl: 'views/login.html',
    scope: false
  };
}

})(angular);
