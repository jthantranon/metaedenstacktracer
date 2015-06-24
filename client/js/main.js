/// Creates Angular App "theApp" as "app"
var app = angular.module("theApp", []);

/// Creates "theApp" controller "theController"
app.controller("theController", ["$scope","$http", function($scope,$http){
    console.log('Welcome to a new start. Happy coding. Yours Truly, UniConStudios.');
    $scope.test = 'This is a successful angular test. If you see this $scope is working!'
}]);