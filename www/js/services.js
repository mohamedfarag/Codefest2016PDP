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
      return deffered.promise.then(function(response){
        var trashcans = response.data;
        trashcans.forEach(function(t){
          //specify position
          t.position = [t.latitude, t.longitude];

          //calculate wait time
          var rt= t.requestDate && new Date(t.requestDate);
          t.waitTimeInHours = rt && ((new Date().getTime() - rt.getTime()) /(60*60*1000));
        });

        return trashcans;
      });
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


    updateTrashcan : function(trashcan) {
      var deffered = $q.defer();
      Stamplay.Object("trashcan").update(trashcan._id, trashcan)
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
        .then(function(trashcans){
          var averageBagsPerDayTrashMap = {};
          var averageWaitingBagsTrashMap = {};
          var historyGroup = {};
          var oldestDate = new Date();
          history.forEach(function(entry){
            var trashcanId = entry.trashcan[0];

            if(!historyGroup[trashcanId]){
              historyGroup[trashcanId] = [];
            }
            historyGroup[trashcanId].push(entry);

            if(!averageBagsPerDayTrashMap[trashcanId]){
              averageBagsPerDayTrashMap[trashcanId] = 0;
            }
            averageBagsPerDayTrashMap[trashcanId] = averageBagsPerDayTrashMap[trashcanId] + entry.trashbags;
            oldestDate = Math.min(oldestDate, new Date(entry.dt_create));
          });

          var now = new Date();
          trashcans.forEach(function(trashcan){
            if(!historyGroup[trashcan._id]) {
              return;
            }
            historyGroup[trashcan._id].sort(function(a,b){
              return new Date(a.dt_create) - new Date(b.dt_create);
            });
            historyGroup[trashcan._id].push({dt_create: now});

            var avg = 0;
            var total = 0;
            for(var i = 0;i<historyGroup[trashcan._id].length-1;i++) {
              var duration = new Date(historyGroup[trashcan._id][i+1].dt_create).getTime() - new Date(historyGroup[trashcan._id][i].dt_create).getTime();
              total += duration;
              avg += duration * historyGroup[trashcan._id][i].trashbags;
            }
            averageWaitingBagsTrashMap[trashcan._id] = avg/total;
          });

          var partialDays = (criteria.to.getTime() - Math.max(criteria.from, oldestDate))/(24*60*60*1000);
          var days =  Math.floor(partialDays)+1;

          trashcans.forEach(function(trashcan){
            trashcan.stats = {
              total: averageBagsPerDayTrashMap[trashcan._id] || 0,
              averageBagsPerDay: (averageBagsPerDayTrashMap[trashcan._id] || 0)/days,
              averageWaitingBags: (averageWaitingBagsTrashMap[trashcan._id] || 0)
            };
          });

          trashcans.sort(function(a,b){
            return a.stats.averagePerDay - b.stats.averagePerDay;
          }).reverse();

          results = trashcans;
          return trashcans;
        });
    },

    getResults : function(){
      return results;
    }

  };

}])


.factory('ZoomService', ["$rootScope", "$q", "NgMap", "$window", function($rootScope, $q, NgMap, $window) {

     var WORLD_DIM = { height: 256, width: 256 };
     var ZOOM_MAX = 21;

     function latRad(lat) {
         var sin = Math.sin(lat * Math.PI / 180);
         var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
         return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
     }

     function zoom(mapPx, worldPx, fraction) {
         return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
     }

     function calculateBounds(points) {
       var maxLatitude = -100, minLatitude = 100,
           maxLongitude = -200, minLongitude = 200;

        points.forEach(function(p){
          maxLatitude = Math.max(maxLatitude, p.latitude);
          minLatitude = Math.min(minLatitude, p.latitude);
          maxLongitude = Math.max(maxLongitude, p.longitude);
          minLongitude = Math.min(minLongitude, p.longitude);
        });

        var ne = {
          latitude: maxLatitude, longitude: maxLongitude
        };
        var sw = {
          latitude: minLatitude, longitude: minLongitude
        };
        return [ne, sw];
     }

  return {

    getExtentFor : function(points, mapId){

        //HACK: this is a hack, there didn't seem to be anyway to
        //      determine the screen size of the map, so since all maps
        //      should be full screen, this is the work around
        var mapDim = {
          height: $window.innerHeight, width: $window.innerWidth
        };

        var bounds = calculateBounds(points);
        var ne = bounds[0];
        var sw = bounds[1];


        var latFraction = (latRad(ne.latitude) - latRad(sw.latitude)) / Math.PI;

        var lngDiff = ne.longitude - sw.longitude;
        var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

        var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
        var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

        var zoomLevel = Math.min(latZoom, lngZoom, ZOOM_MAX);

        var extent = {
          center: {
            latitude: (ne.latitude + sw.latitude)/2,
            longitude: (ne.longitude + sw.longitude)/2
          },
          zoom: zoomLevel
        };

        //NOTE: this returns a false because it is believed that the code needs
        //      to wait for the map before trying getting its width/height
        //      if that is fixed in the future, then a promise will have to be
        //      returned
        return $q.when(extent);
    }
  };

}])
;
