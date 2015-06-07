'use strict';

angular.module('app', [
  'ngRoute',
  'firebase'
])
.config(($routeProvider) => {
  $routeProvider
    .when('/', {
      controller: 'mainCtrl',
      templateUrl: 'main.html'
    });
})
.run(() => {

})
.controller('mainCtrl', ($scope, $firebaseObject) => {
    // var ref = new Firebase('https://<YOUR-FIREBASE-APP>.firebaseio.com/data');

    // download the data into a local $scope object
    // $scope.data = $firebaseObject(ref);

    // download the data into a local object
    // var syncObject = $firebaseObject(ref);

    // synchronize the object with a three-way data binding
    // syncObject.$bindTo($scope, "data");
});

