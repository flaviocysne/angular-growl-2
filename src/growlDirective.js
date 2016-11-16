angular.module("angular-growl").directive("growl", [
  function () {
    "use strict";

    return {
      restrict: 'A',
      templateUrl: 'templates/growl/growl.html',
      replace: false,
      scope: {
        reference: '@',
        inline: '=',
        limitMessages: '=',
        styles: '=', // custom css styles defined as json for each severity name {success: 'alert-thumbs-up'}
        icons: '=' // custom icon styles defined as json for each severity name {success: 'icon-thumbs-up'}
      },
      controller: ['$scope', '$interval', 'growl', 'growlMessages',
        function ($scope, $interval, growl, growlMessages) {
          $scope.referenceId = $scope.reference || 0;

          growlMessages.initDirective($scope.referenceId, $scope.limitMessages);
          $scope.growlMessages = growlMessages;
          $scope.inlineMessage = angular.isDefined($scope.inline) ? $scope.inline : growl.inlineMessages();

          $scope.$watch('limitMessages', function (limitMessages) {
            var directive = growlMessages.directives[$scope.referenceId];
            if (!angular.isUndefined(limitMessages) && !angular.isUndefined(directive)) {
              directive.limitMessages = limitMessages;
            }
          });

          //Cancels all promises within message upon deleting message or stop deleting.
          $scope.stopTimeoutClose = function (message) {
            if (!message.clickToClose) {
              angular.forEach(message.promises, function (promise) {
                $interval.cancel(promise);
              });
              if (message.close) {
                growlMessages.deleteMessage(message);
              } else {
                message.close = true;
              }
            }
          };

          $scope.alertClasses = function (message) {
            var _alertClasses = {
              'alert-dismissable': !message.disableCloseButton
            };

            for (var _severity in growl.severityNames()) {
              var _style = $scope.styles === undefined || $scope.styles[_severity] === undefined ? growl.styleClasses()[_severity] : $scope.styles[_severity];
              _alertClasses[_style] = message.severity === _severity;
            }

            return _alertClasses;
          };

          $scope.iconClasses = function (message) {
            var _iconClasses = {};

            for (var _severity in growl.severityNames()) {
              var _icon = $scope.icons === undefined || $scope.icons[_severity] === undefined ? growl.iconClasses()[_severity] : $scope.icons[_severity];
              _iconClasses[_icon] = message.severity === _severity;
            }

            return _iconClasses;
          };

          $scope.showCountDown = function (message) {
            return !message.disableCountDown && message.ttl > 0;
          };

          $scope.wrapperClasses = function () {
            var classes = {};
            classes['growl-fixed'] = !$scope.inlineMessage;
            classes[growl.position()] = true;
            return classes;
          };

          $scope.computeTitle = function (message) {
            var ret = {
              'success': 'Success',
              'error': 'Error',
              'info': 'Information',
              'warn': 'Warning'
            };
            return ret[message.severity];
          };
        }
      ]
    };
  }
]);

angular.module("angular-growl").run(['$templateCache', function ($templateCache) {
  "use strict";
  if ($templateCache.get('templates/growl/growl.html') === undefined) {
    $templateCache.put("templates/growl/growl.html",
      '<div class="growl-container" ng-class="wrapperClasses()">' +
      '<div class="growl-item alert" ng-repeat="message in growlMessages.directives[referenceId].messages" ng-class="alertClasses(message)" ng-click="stopTimeoutClose(message)">' +
      '<button type="button" class="close" data-dismiss="alert" aria-hidden="true" ng-click="growlMessages.deleteMessage(message)" ng-if="!message.disableCloseButton">&times;</button>' +
      '<button type="button" class="close" aria-hidden="true" ng-if="showCountDown(message)">{{message.countdown}}</button>' +
      '<span ng-class="iconClasses(message)" aria-hidden="true" ng-if="!message.disableIcons"></span>' +
      '<h4 class="growl-title" ng-if="message.title" ng-bind="message.title"></h4>' +
      '<span class="growl-message" ng-bind-html="message.text"></span>' +
      '</div>' +
      '</div>'
    );
  }
}]);
