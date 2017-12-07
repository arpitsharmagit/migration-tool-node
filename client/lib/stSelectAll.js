angular.module('migrateApp')
.directive('stSelectAll', function () {
      return {
        restrict: 'E',
        template: '<input type="checkbox" ng-model="isAllSelected" />',
        scope: {
          all: '='
        },
        link: function (scope, element, attr) {

          scope.$watch('isAllSelected', function () {
            angular.forEach(scope.all, function (val) {
              val.isSelected = scope.isAllSelected;
            })
          });

          scope.$watch('all', function (newVal, oldVal) {
            if (oldVal) {
              angular.forEach(oldVal, function (val) {
                val.isSelected = false;
              });
            }

            scope.isAllSelected = false;
          });
        }
      }
    });