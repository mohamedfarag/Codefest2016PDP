angular.module('starter.services', [])

.factory('AccountService', ["$q", function($q) {
  return {
    currentUser : function() {
      var def = $q.defer();
      Stamplay.User.currentUser()
      .then(function(response) {
        if(response.user === undefined) {
          def.resolve(false);
        } else {
          def.resolve(response.user);
        }
      }, function() {
        def.reject();
      }
    );
    return def.promise;
  },

    getRoles : function(){
      return Stamplay.User.getRoles().then(function(res){
        var result = {};
        res.data.forEach(function(role){
          result[role.name] = role._id;
        });
        return result;
      });
    }
};
}])


.factory('TrashService', ["$rootScope", "$q", function($rootScope, $q) {

  return {

    addBag : function(trashcan){
      var codeBlock = new Stamplay.Codeblock('updateTrashbags');
      return codeBlock.run({
        trashcanId : trashcan._id,
        count : ++trashcan.trashbags
      });
    },

    clearBags : function(trashcan){
      var codeBlock = new Stamplay.Codeblock('updateTrashbags');
      return codeBlock.run({
        trashcanId : trashcan._id,
        count : 0
      });
    },

    getAllTrashCans : function() {
      var deffered = $q.defer();

      Stamplay.Object("trashcan")
      .get()
      .then(function(response) {
        deffered.resolve(response);
      }, function(err) {
        deffered.reject(err);
      });
      return deffered.promise;
    },

    deleteTrashcan : function(id) {
      var deffered = $q.defer();
      Stamplay.Object("trashcan").remove(id)
      .then(function(response) {
        deffered.resolve(response);
      }, function(err) {
        deffered.reject(err);
      });
      return deffered.promise;
    },

    addNew : function(trashcan) {
      var deffered = $q.defer();
      Stamplay.Object("trashcan").save(trashcan)
      .then(function(response) {
        deffered.resolve(response);
      }, function(err) {
        deffered.reject(err);
      });
      return deffered.promise;
    },

    getTrashcan : function(id) {
        var deffered = $q.defer();
        Stamplay.Object("trashcan").get({ _id : id })
        .then(function(response) {
          deffered.resolve(response.data);
        }, function(error) {
          deffered.reject(err);
        });
        return deffered.promise;
    },


    updateTrashcan : function(task) {
      var deffered = $q.defer();
      Stamplay.Object("trashcan").update(task._id, task)
      .then(function(response) {
        deffered.resolve(response);
      }, function(err) {
        deffered.reject(err);
      });
      return deffered.promise;
    }

  };
}]);
