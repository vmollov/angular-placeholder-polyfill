describe('vm.utils', function () {
    'use strict';

    describe('DIR: placeholder', function () {
        var scope, element, $compile, $q, $timeout,
            placeholderClass = 'vm-utils-placeholder-polyfill',

            compileDirective = function () {
                element = $compile(element)(scope);
                scope.$digest();
                $timeout.flush();
            };

        beforeEach(function () {
            module('vm.utils');

            inject(function ($injector) {
                scope = $injector.get('$rootScope').$new();
                $compile = $injector.get('$compile');
                $q = $injector.get('$q');
                $timeout = $injector.get('$timeout');

                scope.testModel = '';
                element = '<input ng-model="testModel" placeholder="test placeholder" />';
            });
        });

        it('should use the scope of the invoking element', function () {
            compileDirective();
            expect(element.scope()).toBe(scope);
        });

        describe('CASE: placeholder is provided by HTML and polyfill is not needed', function () {
            beforeEach(function () {
                var originalCreateElement = document.createElement;
                spyOn(document, 'createElement').and.callFake(function (elementType) {
                    var newElement = originalCreateElement.call(document, elementType);
                    newElement.placeholder = '';

                    return newElement;
                });
            });
            afterEach(function () {
                document.createElement.and.callThrough();
            });

            it('should exit without doing anything', function () {
                compileDirective();
                expect(element.val()).toBe('');
            });
        });

        describe('CASE: placeholder is not provided and polyfill is needed', function () {
            beforeEach(function () {
                var originalCreateElement = document.createElement;
                spyOn(document, 'createElement').and.callFake(function (elementType) {
                    var newElement = originalCreateElement.call(document, elementType);
                    if ('placeholder' in newElement) {
                        newElement = {};
                    }

                    return newElement;
                });
            });
            afterEach(function () {
                document.createElement.and.callThrough();
            });

            it('should use the value of the element as a placeholder without interfering with ngModel', function () {
                compileDirective();
                expect(element.val()).toBe('test placeholder');
                expect(scope.testModel).toBe('');
                expect(element.hasClass(placeholderClass)).toBe(true);
            });
            it('should not be used if the input element has a value', function () {
                element = '<input placeholder="test placeholder" value="Test Value" />';
                compileDirective();
                expect(element.val()).toBe('Test Value');
                expect(element.hasClass(placeholderClass)).toBe(false);
            });
            it('should not start out displayed if the input element is bound to ng-model with a truthy value', function () {
                scope.testModel = 'TestInitialVal';
                compileDirective();
                expect(element.val()).toBe('TestInitialVal');
                expect(element.hasClass(placeholderClass)).toBe(false);
            });
            it('should update the placeholder text if the placeholder attribute value changes', function () {
                scope.testPlaceholder = 'Test 1';
                element = '<input ng-model="testModel" ng-attr-placeholder="{{testPlaceholder}}" />';
                compileDirective();
                expect(element.hasClass(placeholderClass)).toBe(true);
                expect(element.val()).toBe('Test 1');
                scope.testPlaceholder = 'Test 2';
                scope.$digest();
                $timeout.flush();
                expect(element.val()).toBe('Test 2');
            });
            it('should show/hide the placeholder correctly depending on the element value', function () {
                compileDirective();
                expect(element.val()).toBe('test placeholder');
                expect(scope.testModel).toBe('');
                expect(element.hasClass(placeholderClass)).toBe(true);

                element.triggerHandler('focus');
                expect(element.val()).toBe('');
                expect(element.hasClass(placeholderClass)).toBe(false);
                element.val('Changed');
                element.triggerHandler('blur');
                expect(element.hasClass(placeholderClass)).toBe(false);

                element.triggerHandler('focus');
                expect(element.hasClass(placeholderClass)).toBe(false);
                element.val('');
                element.triggerHandler('blur');
                $timeout.flush();
                expect(element.hasClass(placeholderClass)).toBe(true);
                expect(element.val()).toBe('test placeholder');
            });

            describe('CASE: input element is a child of form element', function () {
                var elementForm;

                beforeEach(function () {
                    element = '<form><input ng-model="testModel" placeholder="test placeholder" /></form>';
                    compileDirective();
                    elementForm = element;
                    element = elementForm.find('input');
                });

                it('should hide placeholder on form.submit', function () {
                    expect(element.val()).toBe('test placeholder');
                    expect(element.hasClass(placeholderClass)).toBe(true);

                    elementForm.triggerHandler('submit');
                    expect(element.val()).toBe('');
                    expect(element.hasClass(placeholderClass)).toBe(false);
                });
                it('should show placeholder on form.reset', function () {
                    element.triggerHandler('focus');
                    element.val('Changed');
                    element.triggerHandler('blur');
                    expect(element.hasClass(placeholderClass)).toBe(false);

                    elementForm.triggerHandler('reset');
                    $timeout.flush();
                    expect(element.val()).toBe('test placeholder');
                    expect(element.hasClass(placeholderClass)).toBe(true);
                });
            });

            describe('CASE: input element is of type password', function () {
                beforeEach(function () {
                    scope.testInterpolated = 'testVal';
                    element = '<input type="password" placeholder="password placeholder" name={{testInterpolated}} id="test-id" />';
                    compileDirective();
                });

                it('should create a substitute input of type text and use it as the placeholder', function () {
                    expect(element.next().val()).toBe('password placeholder');
                });
                it('should copy the element\'s attributes to the substitute element and update them on change', function () {
                    expect(element.attr('id')).toBe('test-id');
                    expect(element.attr('name')).toBe('testVal');

                    scope.testInterpolated = 'Changed Val';
                    scope.$digest();
                    expect(element.attr('name')).toBe('Changed Val');
                });
                it('should perform hide placeholder by hiding the element and showing the substitute', function () {
                    //set the display css property - it does not get a default in the test framework for some reason
                    element.next().triggerHandler('focus');
                    element.css('display', 'block');
                    element.triggerHandler('blur');

                    expect(element.css('display')).toBe('none');
                    expect(element.next().css('display')).toBe('block');

                    element.next().triggerHandler('focus');
                    expect(element.css('display')).toBe('block');
                    expect(element.next().css('display')).toBe('none');
                });
                it('should remove the substitute element on scope destroy', function () {
                    expect(element.next().attr('type')).toBe('text');
                    scope.$broadcast('$destroy');
                    scope.$digest();
                    expect(element.next().length).toBe(0);
                });
            });
        });
    });
});
