(function(ng) {  angular.module('migrateApp')
  .filter('customFilter', ['$filter', function($filter) {
      var filterFilter = $filter('filter');
      var standardComparator = function standardComparator(obj, text) {
        text = ('' + text).toLowerCase();
        return ('' + obj).toLowerCase().indexOf(text) > -1;
      };

      return function customFilter(array, expression) {
        function customComparator(actual, expected) {

          var isBeforeActivated = expected.before;
          var isAfterActivated = expected.after;
          var isLower = expected.lower;
          var isHigher = expected.higher;
          var higherLimit;
          var lowerLimit;
          var itemDate;
          var queryDate;

          if (ng.isObject(expected)) {
            //exact match
            if (expected.distinct) {
              var  exptrectedItems = expected.distinct.split(',')
               for (var i = 0; i < exptrectedItems.length; i++) {
                if((typeof actual) == "string"){
                  if (actual.toLowerCase() === exptrectedItems[i].toLowerCase()) {
                    return true;
                  }
                }
              }
              return false;
            }

            //matchAny
            if (expected.matchAny) {
              if (expected.matchAny.all) {
                return true;
              }

              if (!actual) {
                return false;
              }

              for (var i = 0; i < expected.matchAny.items.length; i++) {
                if((typeof actual) == "string"){
                  if (actual.toLowerCase() === expected.matchAny.items[i].toLowerCase()) {
                    return true;
                  }
                }
                else{
                   if (actual === expected.matchAny.items[i]) {
                    return true;
                  }
                }
              }

              return false;
            }

            //date range
            if (expected.before || expected.after) {
              try {
                if (isBeforeActivated) {
                  higherLimit = expected.before;

                  itemDate = new Date(actual);
                  queryDate = new Date(higherLimit);

                  if (itemDate > queryDate) {
                    return false;
                  }
                }

                if (isAfterActivated) {
                  lowerLimit = expected.after;


                  itemDate = new Date(actual);
                  queryDate = new Date(lowerLimit);

                  if (itemDate < queryDate) {
                    return false;
                  }
                }

                return true;
              } catch (e) {
                return false;
              }

            } else if (isLower || isHigher) {
              //number range
              if (isLower) {
                higherLimit = expected.lower;

                if (actual > higherLimit) {
                  return false;
                }
              }

              if (isHigher) {
                lowerLimit = expected.higher;
                if (actual < lowerLimit) {
                  return false;
                }
              }

              return true;
            }
            //etc

            return true;

          }
          return standardComparator(actual, expected);
        }

        var output = filterFilter(array, expression, customComparator);
        return output;
      };
    }]);

})(angular);
