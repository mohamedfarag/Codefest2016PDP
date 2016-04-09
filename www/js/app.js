// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngMap', 'ngCordova'])

.run(function($ionicPlatform, $rootScope, AccountService) {

  //TODO uncomment this to debug state transitions
  // $rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams){
  //   console.debug('$stateChangeStart to '+toState.name+'- fired when the transition begins. toState,toParams : \n',toState, toParams);
  // });
  // $rootScope.$on('$stateChangeError',function(event, toState, toParams, fromState, fromParams){
  //   console.debug('$stateChangeError - fired when an error occurs during transition.');
  //   console.debug(arguments);
  // });
  //   $rootScope.$on('$stateChangeSuccess',function(event, toState, toParams, fromState, fromParams){
  //   console.debug('$stateChangeSuccess to '+toState.name+'- fired once the state transition is complete.');
  // });
  //   $rootScope.$on('$viewContentLoaded',function(event){
  //   console.debug('$viewContentLoaded - fired after dom rendered',event);
  // });
  // $rootScope.$on('$stateNotFound',function(event, unfoundState, fromState, fromParams){
  //   console.debug('$stateNotFound '+unfoundState.name+' - fired when a state cannot be found by its name.');
  //   console.debug(unfoundState, fromState, fromParams);
  // });




  AccountService.currentUser()
    .then(function(user) {
      $rootScope.user = user;
    });

  AccountService.getRoles().then(function(roles){
    console.log(roles);
    $rootScope.roles = roles;
  });

  $rootScope.mapHeight = window.innerHeight - 44;

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
    }).state('criteria', {
      url: '/historySearch',
      templateUrl: 'templates/stats-criteria.html',
      controller: "StatsQueryController",
      controllerAs : "ctrl"
    }).state('stats', {
      url: '/history/{startTimestamp:int}/{endTimestamp:int}',
      templateUrl: 'templates/stats-result.html',
      controller: "StatsController",
      controllerAs : "ctrl"
    });



  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

});
