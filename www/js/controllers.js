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

.controller('HomeController', ["TrashService", "$ionicLoading", "$ionicActionSheet", "$state", function(TrashService,  $ionicLoading, $ionicActionSheet, $state) {
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
    TrashService.getAllTrashCans()
    .then(
      function(trashcans) {
        vm.trashcans = trashcans;
        vm.trashcans.forEach(addStandardTrashCanSymbology);
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
.controller('SchedulePickupController', ["TrashService", "$ionicLoading", "$rootScope", "$state", "$stateParams", "$ionicModal", "$scope","$cordovaGeolocation",
  function(TrashService,  $ionicLoading, $rootScope, $state, $stateParams, $ionicModal, $scope,$cordovaGeolocation) {
    var vm = this;


        var watchOptions = {timeout : 3000, enableHighAccuracy: false};
        var watch = $cordovaGeolocation.watchPosition(watchOptions);

        watch.then(
           null,

           function(err) {
              console.log(err)
           },

           function(position) {
             vm.center = [position.coords.latitude,position.coords.longitude];
           }
        );

    vm.center = null;

    vm.fetch = function(spinner) {
      if(spinner){
        $ionicLoading.show();
      }
      TrashService.getAllTrashCans()
      .then(
        function(trashcans) {
          vm.trashcans = trashcans;

          //set symbology
          vm.trashcans.forEach(addStandardTrashCanSymbology);
        }).finally(function(){
          if(spinner){
            $ionicLoading.hide();
          }
        });

    };


    var modalScope = $scope.$new();
    modalScope.incrementBagCount =  function(){
        console.log('incrementing count for ', modalScope.trashcan.id);
        $ionicLoading.show();
        TrashService.addBag(modalScope.trashcan).then(function(){
          return vm.fetch(false);
        }).finally(function(){
          $ionicLoading.hide();
          modalPopup.hide();
        });
      };
    modalScope.closeModal = function(){
      modalPopup.hide();
    };

    var modalPopup;
    $ionicModal.fromTemplateUrl('templates/schedule-pickup-modal.html', {
       scope: modalScope,
       animation: 'slide-in-up'
     }).then(function(modal) {
       modalPopup = modal;
     });
     vm.scheduleTrashcan = function(e, trashcan) {
       modalScope.trashcan = trashcan;
       modalPopup.show();
     };

     $scope.$on('$destroy', function() {
       watch.clearWatch();
       modalPopup.remove();
     });

     vm.fetch(true);

  }])
.controller('PickupTrashController', ["TrashService", "$ionicLoading", "$rootScope", "$state", "$stateParams", "$ionicModal", "$scope","$cordovaGeolocation",
  function(TrashService,  $ionicLoading, $rootScope, $state, $stateParams, $ionicModal, $scope, $cordovaGeolocation) {
    var vm = this;


    var watchOptions = {timeout : 3000, enableHighAccuracy: false};
    var watch = $cordovaGeolocation.watchPosition(watchOptions);

    watch.then(
       null,

       function(err) {
          console.log(err)
       },

       function(position) {
         vm.center = [position.coords.latitude,position.coords.longitude];
       }
    );



    vm.center = null;

    vm.fetch = function(spinner) {
      if(spinner){
        $ionicLoading.show();
      }
      TrashService.getAllTrashCans()
      .then(
        function(trashcans) {
          vm.trashcans = trashcans;

          //set symbology
          vm.trashcans.forEach(addStandardTrashCanSymbology);
        }).finally(function(){
          if(spinner){
            $ionicLoading.hide();
          }
        });

    };

    var modalScope = $scope.$new();
    modalScope.markBagsPickedUp =  function(){
        console.log('picked up backs for ', modalScope.trashcan.id);
        $ionicLoading.show();

        TrashService.clearBags(modalScope.trashcan).then(function(){
          return vm.fetch(false);
        }).finally(function(){
          $ionicLoading.hide();
          modalPopup.hide();
        });
      };
    modalScope.closeModal = function(){
      modalPopup.hide();
    };

    var modalPopup;
    $ionicModal.fromTemplateUrl('templates/pickup-trash-modal.html', {
       scope: modalScope,
       animation: 'slide-in-up'
     }).then(function(modal) {
       modalPopup = modal;
     });
     vm.clearTrashcan = function(e, trashcan) {
       modalScope.trashcan = trashcan;
       modalPopup.show();
     };

     $scope.$on('$destroy', function() {

          watch.clearWatch();
       modalPopup.remove();
     });

     vm.fetch(true);

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

}])
;

function addStandardTrashCanSymbology(trashcan) {
    var color = 'grey';
    if(trashcan.trashbags > 0) {
      color= (trashcan.waitTimeInHours > 4 ? 'red' : (trashcan.waitTimeInHours > 2 ? 'orange': 'blue'));
    }

    trashcan.icon = {
        path:'CIRCLE', scale: 4, strokeColor: color
    };
}
