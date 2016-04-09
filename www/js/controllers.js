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
        $ionicLoading.hide();
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
        $ionicLoading.hide();
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

.controller('HomeController', ["TrashService", "$ionicLoading", "$ionicActionSheet", "$state", "ZoomService", function(TrashService,  $ionicLoading, $ionicActionSheet, $state, zoomService) {
  var vm = this;

  var findIndex = function(id) {
    return vm.trashcans.map(function(trashcan) {
      return trashcan._id;
    }).indexOf(id);
  };



  vm.setActive = function(id) {
    vm.active = id;
  };

  // Fetch Cans
  vm.fetch = function() {
    $ionicLoading.show();
    return TrashService.getAllTrashCans()
    .then(
      function(trashcans) {
        vm.trashcans = trashcans;
        vm.trashcans.forEach(addStandardTrashCanSymbology);

        return zoomService.getExtentFor(trashcans,'schedule-pickup-map').then(function(extent){
           vm.center = [extent.center.latitude, extent.center.longitude];
           vm.zoom = extent.zoom;
           return vm.trashcans;
        }).catch(function(e){
          console.error('failed to load extent', e);
        });
      }).finally(function(){
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

  vm.openActionSheet = function(e,trashcan){
    var sheet = $ionicActionSheet.show({
      buttons: [
        {text : 'Update'}
      ],
      destructiveText : 'Delete',
      cancelText : 'Cancel',
      cancel: function(){
        return true;
      },
      destructiveButtonClicked : function(){
        vm.deleteTrashcan(trashcan._id);
        return true;
      },
      buttonClicked : function(index){
        $state.go('edit', { id : trashcan._id });
        return true;
      }
    });
  };

  vm.fetch();

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
.controller('SchedulePickupController', ["TrashService", "$ionicLoading", "$rootScope", "$state", "$stateParams", "$ionicModal", "$scope","$cordovaGeolocation", "$ionicActionSheet",
  function(TrashService,  $ionicLoading, $rootScope, $state, $stateParams, $ionicModal, $scope,$cordovaGeolocation,$ionicActionSheet) {
    var vm = this;

    var deregregisterGeolocationUpdates = registerGeolocationUpdates(vm, $cordovaGeolocation, function(p){
      vm.center = [p.latitude, p.longitude];
    });
    addTrachcanFetch(vm, $ionicLoading, TrashService, addStandardTrashCanSymbology);

    function incrementBagCount(trashcan){
        console.log('incrementing count for ', trashcan.id);
        $ionicLoading.show();
        TrashService.addBag(trashcan).then(function(){
          return vm.fetch(false);
        }).finally(function(){
          $ionicLoading.hide();
        });
      }

     vm.scheduleTrashcan = function(e, trashcan) {

      var sheet = $ionicActionSheet.show({
        buttons: [
          {text : 'Add Bag'}
        ],
        cancelText : 'Cancel',
        titleText : 'Bags: ' + trashcan.trashbags,
        cancel: function(){
          return true;
        },
        buttonClicked : function(index){
          incrementBagCount(trashcan);
          return true;
        }
      });

     };

     $scope.$on('$destroy', function() {
       deregregisterGeolocationUpdates();
     });

     vm.fetch(true);

  }])
.controller('PickupTrashController', ["TrashService", "$ionicLoading", "$rootScope", "$state", "$stateParams", "$ionicModal", "$scope","$cordovaGeolocation", "$ionicActionSheet", "ZoomService",
  function(TrashService,  $ionicLoading, $rootScope, $state, $stateParams, $ionicModal, $scope, $cordovaGeolocation, $ionicActionSheet, zoomService) {
    var vm = this;

    vm.truck = {
      icon: "images/truck-marker.png"
    };

    var deregregisterGeolocationUpdates = registerGeolocationUpdates(vm, $cordovaGeolocation, function(p){
      vm.truck.position = [p.latitude, p.longitude];
    });
    addTrachcanFetch(vm, $ionicLoading, TrashService, addStandardTrashCanSymbology);

      function markBagsPickedUp(trashcan){
        console.log('picked up backs for ', trashcan.id);
        $ionicLoading.show();

        TrashService.clearBags(trashcan).then(function(){
          return vm.fetch(false);
        }).finally(function(){
          $ionicLoading.hide();
        });
      }


     vm.clearTrashcan = function(e, trashcan) {

      var sheet = $ionicActionSheet.show({
        buttons: [
          {text : 'Clear Bags'}
        ],
        cancelText : 'Cancel',
        titleText : 'Bags: ' + trashcan.trashbags,
        cancel: function(){
          return true;
        },
        buttonClicked : function(index){
          markBagsPickedUp(trashcan);
          return true;
        }
      });

     };

     $scope.$on('$destroy', function() {
       deregregisterGeolocationUpdates();
     });

     vm.fetch(true).then(function(trashcans){
       zoomService.getExtentFor(trashcans,'schedule-pickup-map').then(function(extent){
          vm.center = [extent.center.latitude, extent.center.longitude];
          vm.zoom = extent.zoom;
       }).catch(function(e){
         console.error('failed to load extent', e);
       });
     });

  }])

.controller('StatsQueryController', ["$state",
  function($state) {
  var vm = this;
  vm.criteria = {};
  vm.search = function(){
    var params = {
      startTimestamp: (vm.criteria.from || new Date(0)).getTime(),
      endTimestamp: (vm.criteria.to || new Date()).getTime(),
    };
    $state.go("stats", params);
    };
}])

.controller('StatsController', ["HistoryService", "$ionicLoading", "$rootScope", "$scope", "$state", "$stateParams", "$cordovaGeolocation", "ZoomService",
  function(HistoryService,  $ionicLoading, $rootScope, $scope, $state, $stateParams, $cordovaGeolocation, zoomService) {
  var vm = this;

  function fetch() {
    $ionicLoading.show();
    var criteria = {
      from: new Date($stateParams.startTimestamp),
      to: new Date($stateParams.endTimestamp)
    };
    return HistoryService.getHistory(criteria).then(function(trashcans){
      trashcans.forEach(addAveragePerDayTrashCanSymbology);
      vm.trashcans = trashcans;

      return zoomService.getExtentFor(trashcans).then(function(extent){
         vm.center = [extent.center.latitude, extent.center.longitude];
         vm.zoom = extent.zoom;
      });
    }, function(e){
      console.log('error loading stats',e);
    }).finally(function(){
      $ionicLoading.hide();
    });
  }
  fetch();
}])
;

function buildCirclePath(r) {
  //NOTE: taken from http://stackoverflow.com/a/10477334/388006
  var path = [
    "M 0, 0",
    "m -"+r+", 0",
    "a "+r+","+r+" 0 1,0 "+2*r+",0",
    "a "+r+","+r+" 0 1,0 -"+2*r+",0"].join(" ");
  return path;
}

function determineSymbolColor(trashcan){
  var symbolColor = 'royalblue';
  if(trashcan.category === 'Solar Compactor') {
    symbolColor = 'yellow';
  }
  return symbolColor;
}

function addAveragePerDayTrashCanSymbology(trashcan) {
    var radius = Math.ceil(Math.max(0.5,trashcan.stats.averagePerDay)*2);
    var color = determineSymbolColor(trashcan);
    trashcan.icon = {
        path:buildCirclePath(radius), strokeColor: color, fillColor: color, fillOpacity: 1
    };
}

function addStandardTrashCanSymbology(trashcan) {
    var statusColor = null;
    if(trashcan.trashbags > 0) {
      statusColor= (trashcan.waitTimeInHours > 4 ? 'red' : (trashcan.waitTimeInHours > 2 ? 'orange': null));
    }

    // if status color is not defined, then no highlight is needed
    var strokeOpacity = 1;
    var strokeWeight = 3;
    var r = 4;
    if(!statusColor) {
      statusColor = 'white';
      strokeOpacity = 0;
      strokeWeight=0;
    }
    r = r + strokeWeight/2;

    trashcan.icon = {
        path:buildCirclePath(r),
        strokeWeight:strokeWeight,strokeColor: statusColor, strokeOpacity: strokeOpacity,
        fillColor: determineSymbolColor(trashcan), fillOpacity: 1
    };
}

function registerGeolocationUpdates(vm, $cordovaGeolocation, cb) {
  var timestamp = new Date().getTime();
  var watchOptions = {timeout : 3000, enableHighAccuracy: false};
  var watch = $cordovaGeolocation.watchPosition(watchOptions);

  watch.then(
     null,

     function(err) {
        console.log(err)
     },

     function(position) {
       console.log('updated current pos', position);
       cb(position.coords);
     }
  );

  return function deregisterGeolocationUpdates(){
    watch.clearWatch();
  };
}


function addTrachcanFetch(vm, $ionicLoading, TrashService, augmenter) {
  vm.fetch = function(spinner) {
    if(spinner){
      $ionicLoading.show();
    }
    return TrashService.getAllTrashCans()
    .then(
      function(trashcans) {
        vm.trashcans = trashcans;

        //set symbology
        vm.trashcans.forEach(augmenter);
        return vm.trashcans;
      }).finally(function(){
        if(spinner){
          $ionicLoading.hide();
        }
      });
  };
}
