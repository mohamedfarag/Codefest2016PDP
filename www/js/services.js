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
      .get({
        page : 0,
        per_page : 0
      })
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
        }, function(err) {
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
}])

.factory('HistoryService', ["$rootScope", "$q", "TrashService", function($rootScope, $q, TrashService) {

  var results;

  function compareCount(a,b) {
    if (a.count < b.count)
      return -1;
    else if (a.count > b.count)
      return 1;
    else 
      return 0;
  }

  return {

    getHistory : function(criteria){
      criteria.from = criteria.from || new Date(0);
      criteria.to = criteria.to || new Date();
      var history;
      var trashcans;
      return Stamplay.Query("object", "history")
        .lessThanOrEqual("dt_create", criteria.to)
        .greaterThanOrEqual("dt_create", criteria.from)
        .pagination(0,0)
        .exec()
        .then(function(res){
          history = res.data;
          return TrashService.getAllTrashCans();
        })
        .then(function(res){
          trashcans = res.data;
          var trashMap = {};
          results = [];
          history.forEach(function(entry){
            var trashcanId = entry.trashcan[0];
            if(!trashMap[trashcanId]){
              trashMap[trashcanId] = 0;
            }
            trashMap[trashcanId] = trashMap[trashcanId] + entry.trashbags;
          });

          trashcans.forEach(function(trashcan){
            results.push({
              pointX : trashcan.pointX,
              pointY : trashcan.pointY,
              name : trashcan.trashcanName,
              count : trashMap[trashcan._id] || 0
            });
          });

          results.sort(compareCount).reverse();
          

        });
    },

    getResults : function(){
      return results;
    }

  };

}]);
