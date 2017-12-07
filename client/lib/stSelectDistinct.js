angular.module('migrateApp')
   .directive('stSelectDistinct', [function() {
     return {
       restrict: 'E',
       require: '^stTable',
       scope: {
         collection: '=',
         predicateExpression: '='
       },
       template: '<select ng-model="selectedOption" ng-change="optionChanged(selectedOption)" ng-options="opt for opt in distinctItems"></select>',
       link: function(scope, element, attr, table) {

         scope.$watch('collection', function(newValue) {

           if (newValue) {
             var temp = [];
             scope.distinctItems = ['All'];
             angular.forEach(scope.collection, function(item) {
               var value = item;
               if (value && value.trim().length > 0 && temp.indexOf(value) === -1) {
                 temp.push(value);
               }
             });
             temp.sort();

             scope.distinctItems = scope.distinctItems.concat(temp);
             scope.selectedOption = scope.distinctItems[0];
             scope.optionChanged(scope.selectedOption);
           }
         }, true);

         scope.optionChanged = function(selectedOption) {

           var query = {};
           query.distinct = selectedOption;

           if (query.distinct === 'All') {
             query.distinct = '';
           }

           if(query.distinct == 'All - Failed'){
           query.distinct = "Error - Missing File,Error - Ingest Timeout";
         }

           table.search(query, "");
         };
       }
     }
   }])
