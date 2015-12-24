(function (window, angular, undefined) {
    'use strict';

    /**
     * @ngdoc directive
     * @name vm.utils.directive:placeholder
     * @restrict A
     * @requires $timeout
     * @param {string} placeholder The value to set to the placeholder
     * @description
     * Polyfill for the HTML5 placeholder attribute
     */

    angular.module('vm.utils', [])
        .directive('placeholder',  [
            '$timeout',
            function ($timeout) {
                return {
                    restrict: 'A',
                    require: '?ngModel',
                    link: function (scope, element, attrs, ngModelCtrl) {

                        // if the polyfill is not needed exit
                        if ('placeholder' in document.createElement('input')) {
                            return;
                        }

                        var placeholderClass = 'vm-utils-placeholder-polyfill',
                            placeholderText,
                            isDisplayed = false,
                            isElementFocused = false,

                            /** The form potentially containing the element */
                            elementForm = element[0].form ? angular.element(element[0].form) : undefined,

                            /** Designates whether the element is of type password */
                            isPasswordInput = (function () {
                                var type = element.prop('type');

                                return type && type.toLowerCase() === 'password';
                            })(),

                            /** In most of the cases placeholderElement === element.  The exception is when input type is password */
                            placeholderElement = isPasswordInput ?
                                (function createPasswordPlaceholder () {
                                    var substituteElement = angular.element('<input type="text" />');

                                    //copy element's attributes over
                                    Object.keys(attrs.$attr).forEach(function (attrKey) {
                                        //skip the ones we know we don't need
                                        if (attrKey === 'ngModel' || attrKey === 'type' || attrKey === 'placeholder' || attrKey === 'value') {
                                            return;
                                        }

                                        if (element.attr(attrs.$attr[attrKey]).match(/{{.*}}/)) {
                                            //attribute is interpolated - observe it
                                            attrs.$observe(attrKey, function () {
                                                substituteElement.attr(attrKey, element.attr(attrKey));
                                            });
                                        }
                                        else {
                                            //copy the attribute
                                            substituteElement.attr(attrKey, element.attr(attrKey));
                                        }
                                    });

                                    substituteElement.addClass(placeholderClass);
                                    element.after(substituteElement);

                                    return substituteElement;
                                })() :

                                element,

                            /** The display value to which the placeholderElement will be set */
                            elementDisplayValue = element.css('display'),

                            /** Updates the placeholder text if placeholder is displayed */
                            updatePlaceholderValue = function updatePlaceholderValue () {

                                if (isDisplayed) {
                                    $timeout(function () {
                                        placeholderElement.val(placeholderText);
                                    });
                                }

                            },

                            /** Hides the placeholder */
                            hidePlaceholder = function hidePlaceholder () {

                                if (isPasswordInput) {
                                    element.css('display', elementDisplayValue);
                                    placeholderElement.css('display', 'none');
                                    element[0].focus();
                                }

                                if (isDisplayed) {
                                    element.val('');
                                }

                                element.removeClass(placeholderClass);
                                isDisplayed = false;
                            },

                            /** Determines whether the placeholder can be displayed */
                            showPlaceholder = function showPlaceholder (formReset) {

                                if ((!isDisplayed && !isElementFocused && !element.val()) || formReset) {

                                    if (isPasswordInput) {
                                        elementDisplayValue = element.css('display');
                                        element.css('display', 'none');
                                        placeholderElement.css('display', elementDisplayValue);
                                    }

                                    element.addClass(placeholderClass);
                                    isDisplayed = true;
                                }

                                updatePlaceholderValue();
                            },

                            /** on form submit hide the placeholder so no placeholder values get submitted */
                            vmUtilsFormSubmitHandler = function vmUtilsFormSubmitHandler () {
                                hidePlaceholder();
                                placeholderElement.remove();
                            },

                            /** on form reset show the placeholders */
                            vmUtilsFormResetHandler = showPlaceholder.bind(null, true),

                            /** Binds the necessary event listeners */
                            bindEventListeners = function bindEventListeners () {
                                placeholderElement.on('focus', function () {
                                    isElementFocused = true;
                                    hidePlaceholder();
                                });
                                element.on('blur', function () {
                                    isElementFocused = false;
                                    showPlaceholder();
                                });

                                if (elementForm) {
                                    elementForm.on('submit', vmUtilsFormSubmitHandler);
                                    elementForm.on('reset', vmUtilsFormResetHandler);
                                }

                            },

                            /** Unbinds the event listeners attached to elements which might not be cleaned up automatically on $destroy */
                            unbindEventListeners = function unbindEventListeners () {

                                if (isPasswordInput) {
                                    placeholderElement.remove();
                                }

                                if (elementForm) {
                                    elementForm.off('submit', vmUtilsFormSubmitHandler);
                                    elementForm.off('reset', vmUtilsFormResetHandler);
                                }
                            },

                            /** Initializes the directive */
                            init = function init () {
                                placeholderText = attrs.placeholder;

                                //give ngModelCtrl a chance to process if it was set then set observer
                                $timeout(function () {
                                    attrs.$observe('placeholder', function (newValue) {
                                        placeholderText = newValue;
                                        showPlaceholder();
                                    });
                                });

                                //if ng-model was set, it's initial value will not be considered a placeholder
                                if (ngModelCtrl) {
                                    ngModelCtrl.$formatters.push(function (modelValue) {

                                        if (modelValue) {
                                            $timeout(hidePlaceholder);
                                        }
                                        else {
                                            $timeout(showPlaceholder);
                                        }

                                        return modelValue;
                                    });
                                }

                                bindEventListeners();
                                scope.$on('$destroy', unbindEventListeners);
                            };

                        init();

                        //todo: remove
                        console.log(elementForm);
                    }
                };
            }
        ]);
})(window, window.angular);
