(function (window, angular) {
    'use strict';

    angular.module('vm.utils.placeholderPolyfillDemo', ['vm.utils'])
        .controller('demoCtrl', [
            '$scope',
            '$interval',
            function ($scope, $interval) {
                var changed = false;

                $scope.testVal3 = 'This is a value on ng-model - delete';

                $scope.test1 = 'Dynamically set placeholder';

                $scope.isPolyfillNeeded = (function () {
                    var testElement = document.createElement('input');
                    return !('placeholder' in testElement);
                })();

                $interval(function () {
                    if ((changed = !changed)) {
                        $scope.test1 = 'Dynamically set placeholder';
                    }
                    else {
                        $scope.test1 = 'And it changes...';
                    }

                }, 3000);
            }
        ]);
})(window, window.angular);