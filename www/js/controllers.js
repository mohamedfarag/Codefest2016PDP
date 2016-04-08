angular.module('starter.controllers', [])

.controller('AccountController', ["AccountService", "$state", "$rootScope", "$ionicLoading", "$ionicPopup", 
  function(AccountService, $state, $rootScope, $ionicLoading, $ionicPopup) {

    var errorHandler = function(options) {
      $ionicPopup.alert({
        title: options.title,
        okType : 'button-assertive',
        okText : "Try Again"
      });
    };

    var vm = this;

    vm.login = function() {
      $ionicLoading.show();
      Stamplay.User.login(vm.user)
      .then(function(user) {
        $rootScope.user = user;
        $state.go("home");
      }, function() {
        $ionicLoading.hide();
        errorHandler({
          title : "<h4 class='center-align'>Incorrect Username or Password</h4>"
        });
      });
    };

    vm.signup = function() {
      if(!vm.user.givenRole){
        errorHandler({
          title : "<h4 class='center-align'>Role is Required</h4>"
        });
      }
      $ionicLoading.show();
      Stamplay.User.signup(vm.user)
      .then(function(user) {
        $rootScope.user = user;
        $state.go("home");
      }, function() {
        errorHandler({
          title : "<h4 class='center-align'>A Valid Email and Password is Required</h4>"
        });
        $ionicLoading.hide();
      });
    };

    vm.logout = function() {
      $ionicLoading.show();
      var jwt = window.location.origin + "-jwt";
      window.localStorage.removeItem(jwt);
      AccountService.currentUser()
      .then(function(user) {
        $rootScope.user = user;
        $ionicLoading.hide();
      }, function(error) {
        console.error(error);
        $ionicLoading.hide();
      })
    };
  }])

.controller('HomeController', ["TrashService", "$ionicLoading", function(TrashService,  $ionicLoading) {
  var vm = this;

  var findIndex = function(id) {
    return vm.trashcans.map(function(trashcan) {
      return trashcan._id;
    }).indexOf(id);
  };

  // Display loading indicator
  $ionicLoading.show();

  vm.setActive = function(id) {
    vm.active = id;
  };

  // Fetch Cans
  vm.fetch = function() {

    TrashService.getAllTrashCans()
    .then(
      function(response) {
        vm.trashcans = response.data;
        $ionicLoading.hide();
      }, function() {
        $ionicLoading.hide();
      });

  };

  vm.deleteTrashcan = function(id) {
    $ionicLoading.show();
    vm.trashcans.splice(findIndex(id), 1);
    TrashService.deleteTrashcan(id)
      .then(function() {
        $ionicLoading.hide();
      }, function() {
        $ionicLoading.hide();
      });
    };

  vm.addBag = function(trashcan) {
    $ionicLoading.show();
    TrashService.addBag(trashcan).then(function(){
      vm.fetch();
    }, function(){
      $ionicLoading.hide();
    });
  };

  vm.clearBags = function(trashcan) {
    $ionicLoading.show();
    TrashService.clearBags(trashcan).then(function(){
      vm.fetch();
    }, function(){
      $ionicLoading.hide();
    });
  };

}])

.controller('TrashController', ["TrashService", "$ionicLoading", "$rootScope", "$state", "$stateParams", function(TrashService,  $ionicLoading, $rootScope, $state, $stateParams) {
  var vm = this;

  if($stateParams.id) {
    $ionicLoading.show();
    TrashService.getTrashcan($stateParams.id)
    .then(function(data) {
      $ionicLoading.hide();
      vm.trashcan = data[0];
    }, function() {
      $ionicLoading.hide();
    });
  }

  // Add a can.
  vm.add = function() {
    $ionicLoading.show();
    vm.trashcan.trashbags = 0;
    TrashService.addNew(vm.trashcan)
    .then(function() {
      $ionicLoading.hide();
      $state.go("trashcans", {}, { reload: true });
    }, function() {
      $ionicLoading.hide();
    });
  };

  vm.save = function() {
    $ionicLoading.show();
    TrashService.updateTrashcan(vm.trashcan)
    .then(function() {
      $ionicLoading.hide();
      $state.go("trashcans", {}, { reload: true });
    }, function() {
      $ionicLoading.hide();
    });
  };







}])

.controller('StatsController', ["HistoryService", "$ionicLoading", "$rootScope", "$state", "$stateParams", function(HistoryService,  $ionicLoading, $rootScope, $state, $stateParams) {
  var vm = this;
  vm.criteria = {};
  vm.results = HistoryService.getResults();
  //vm.criteria.searchType = 'average';
  vm.search = function(){
    $ionicLoading.show();
    HistoryService.getHistory(vm.criteria).then(function(){
      $ionicLoading.hide();
      $state.go("stats");
    }, function(){
      $ionicLoading.hide();
    });
  };

}]);