// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services'])

.run(function($ionicPlatform, $rootScope, AccountService) {

  AccountService.currentUser()
    .then(function(user) {
      $rootScope.user = user;
    });

  AccountService.getRoles().then(function(roles){
    console.log(roles);
    $rootScope.roles = roles;
  });

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });


})

.constant('$ionicLoadingConfig', {
  template: "<ion-spinner></ion-spinner>",
  hideOnStateChange : false
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('home', {
      url: '/',
      templateUrl: 'templates/home.html'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: "AccountController",
      controllerAs : "account"
    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'templates/signup.html',
      controller: "AccountController",
      controllerAs : "account"
    })
    .state('schedule-pickup', {
      cache : false,
      url: '/schedule-pickup',
      templateUrl: 'templates/schedule-pickup.html',
      controller: "SchedulePickupController",
      controllerAs : "ctrl"
    })
    .state('pickup-trash', {
      cache : false,
      url: '/pickup-trash',
      templateUrl: 'templates/pickup-trash.html',
      controller: "PickupTrashController",
      controllerAs : "ctrl"
    })

    .state('trashcans', {
      cache : false,
      url: '/trashcans',
      templateUrl: 'templates/trashcans.html',
      controller: "HomeController",
      controllerAs : "trashcan"
    })
    .state('new', {
      url: '/new',
      templateUrl: 'templates/new.html',
      controller: "TrashController",
      controllerAs : "new"
    })
    .state('edit', {
      url: '/trashcan/:id',
      templateUrl: 'templates/edit.html',
      controller: "TrashController",
      controllerAs : "edit"
    });



  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

});
