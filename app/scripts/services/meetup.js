'use strict';

/**
 * @ngdoc function
 * @name angularPrizinatorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularPrizinatorApp
 */
angular.module('angularPrizinatorApp')
  .service('meetupConfiguration', function () {
    var _baseUri = 'https://api.meetup.com/';
    var _key = null;
    this.getBaseUri = function () {
      return _baseUri;
    };
    this.setBaseUri = function (value) {
      _baseUri = value;
    };
    this.getKey = function () {
      return _key;
    };
    this.setKey = function (value) {
      _key = value;
    };
  })
  .service('meetup', function ($http, meetupConfiguration, oauth,  random) {
    this.getEvents = function (groupUrlname) {
      return $http.get(meetupConfiguration.getBaseUri() + 'events?group_urlname=' + groupUrlname + '&key=' + meetupConfiguration.getKey())
        .then(function (response) {
          return response.data;
        })
        .then(function (data) {
          return data.results;
        });
    };

    this.getUser = function () {
      var params = {
        callback:'JSON_CALLBACK',
        access_token: oauth.getUser().accessToken
      };
      return $http.jsonp(meetupConfiguration.getBaseUri() + '2/member/self', {params: params})
        .then(function (response) {
          return response.data;
        });
    };

    this.getRsvpNames = function (eventId) {
      return $http.get(meetupConfiguration.getBaseUri() + 'rsvps?event_id=' + eventId + '&key=' + meetupConfiguration.getKey())
        .then(function (response) {
          return response.data;
        })
        .then(function (data) {
          return data.results.map(function (rsvp) {
            return {
              name: rsvp.member.name,
              bio: rsvp.member.bio,
              photo: rsvp.member_photo.thumb_link
            };
          });
        })
        .then(function (names) {
          return random.shuffle(names);
        });
    };
  });
