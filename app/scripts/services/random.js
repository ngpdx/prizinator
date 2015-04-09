'use strict';

angular.module('angularPrizinatorApp')
  .factory('random', function () {
    // an instance of Random (https://github.com/ckknight/random-js) that uses Math.random
    return new Random();
  });