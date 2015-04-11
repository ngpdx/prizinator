'use strict';

/**
 * @ngdoc overview
 * @name angularPrizinatorApp
 * @description
 * # angularPrizinatorApp
 *
 * Main module of the application.
 */
angular
  .module('angularPrizinatorApp', [
    'angularPrizinatorApp.auth',
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'oauth'
  ])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    }).hashPrefix('!');
  });
