describe('vm.utils', function () {
    'use strict';

    describe('DIR: placeholder', function () {

        beforeEach(function () {
            module('vm.utils');

            inject(function ($injector) {
                this.scope = $injector.get('$rootScope').$new();
                this.compile = $injector.get('$compile');
                this.q = $injector.get('$q');
                this.timeout = $injector.get('$timeout');

                this.scope.testModel = '';
                this.element = '<input ng-model="testModel" placeholder="test placeholder" />';

                this.compileDirective = function () {
                    this.element = this.compile(this.element)(this.scope);
                    this.scope.$digest();
                    this.timeout.flush();
                };
                this.placeholderClass = 'vm-utils-placeholder-polyfill';
            });
        });

        it('should use the scope of the invoking element', function () {
            this.compileDirective();
            expect(this.element.scope()).toBe(this.scope);
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
                this.compileDirective();
                expect(this.element.val()).toBe('');
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
                this.compileDirective();
                expect(this.element.val()).toBe('test placeholder');
                expect(this.scope.testModel).toBe('');
                expect(this.element.hasClass(this.placeholderClass)).toBe(true);
            });
            it('should not be used if the input element has a value', function () {
                this.element = '<input placeholder="test placeholder" value="Test Value" />';
                this.compileDirective();
                expect(this.element.val()).toBe('Test Value');
                expect(this.element.hasClass(this.placeholderClass)).toBe(false);
            });
            it('should not start out displayed if the input element is bound to ng-model with a truthy value', function () {
                this.scope.testModel = 'TestInitialVal';
                this.compileDirective();
                expect(this.element.val()).toBe('TestInitialVal');
                expect(this.element.hasClass(this.placeholderClass)).toBe(false);
            });
            it('should update the placeholder text if the placeholder attribute value changes', function () {
                this.scope.testPlaceholder = 'Test 1';
                this.element = '<input ng-model="testModel" ng-attr-placeholder="{{testPlaceholder}}" />';
                this.compileDirective();
                expect(this.element.hasClass(this.placeholderClass)).toBe(true);
                expect(this.element.val()).toBe('Test 1');
                this.scope.testPlaceholder = 'Test 2';
                this.scope.$digest();
                this.timeout.flush();
                expect(this.element.val()).toBe('Test 2');
            });
            it('should show/hide the placeholder correctly depending on the element value', function () {
                this.compileDirective();
                expect(this.element.val()).toBe('test placeholder');
                expect(this.scope.testModel).toBe('');
                expect(this.element.hasClass(this.placeholderClass)).toBe(true);

                this.element.triggerHandler('focus');
                expect(this.element.val()).toBe('');
                expect(this.element.hasClass(this.placeholderClass)).toBe(false);
                this.element.val('Changed');
                this.element.triggerHandler('blur');
                expect(this.element.hasClass(this.placeholderClass)).toBe(false);

                this.element.triggerHandler('focus');
                expect(this.element.hasClass(this.placeholderClass)).toBe(false);
                this.element.val('');
                this.element.triggerHandler('blur');
                this.timeout.flush();
                expect(this.element.hasClass(this.placeholderClass)).toBe(true);
                expect(this.element.val()).toBe('test placeholder');
            });

            describe('CASE: input element is a child of form element', function () {
                var elementForm;

                beforeEach(function () {
                    this.element = '<form><input ng-model="testModel" placeholder="test placeholder" /></form>';
                    this.compileDirective();
                    this.elementForm = this.element;
                    this.element = this.elementForm.find('input');
                });

                it('should hide placeholder on form.submit', function () {
                    expect(this.element.val()).toBe('test placeholder');
                    expect(this.element.hasClass(this.placeholderClass)).toBe(true);

                    this.elementForm.triggerHandler('submit');
                    expect(this.element.val()).toBe('');
                    expect(this.element.hasClass(this.placeholderClass)).toBe(false);
                });
                it('should show placeholder on form.reset', function () {
                    this.element.triggerHandler('focus');
                    this.element.val('Changed');
                    this.element.triggerHandler('blur');
                    expect(this.element.hasClass(this.placeholderClass)).toBe(false);

                    this.elementForm.triggerHandler('reset');
                    this.timeout.flush();
                    expect(this.element.val()).toBe('test placeholder');
                    expect(this.element.hasClass(this.placeholderClass)).toBe(true);
                });
            });

            describe('CASE: input element is of type password', function () {
                beforeEach(function () {
                    this.scope.testInterpolated = 'testVal';
                    this.element = '<input type="password" placeholder="password placeholder" name={{testInterpolated}} id="test-id" />';
                    this.compileDirective();
                });

                it('should create a substitute input of type text and use it as the placeholder', function () {
                    expect(this.element.next().val()).toBe('password placeholder');
                });
                it('should copy the element\'s attributes to the substitute element and update them on change', function () {
                    expect(this.element.attr('id')).toBe('test-id');
                    expect(this.element.attr('name')).toBe('testVal');

                    this.scope.testInterpolated = 'Changed Val';
                    this.scope.$digest();
                    expect(this.element.attr('name')).toBe('Changed Val');
                });
                it('should perform hide placeholder by hiding the element and showing the substitute', function () {
                    //set the display css property - it does not get a default in the test framework for some reason
                    this.element.next().triggerHandler('focus');
                    this.element.css('display', 'block');
                    this.element.triggerHandler('blur');

                    expect(this.element.css('display')).toBe('none');
                    expect(this.element.next().css('display')).toBe('block');

                    this.element.next().triggerHandler('focus');
                    expect(this.element.css('display')).toBe('block');
                    expect(this.element.next().css('display')).toBe('none');
                });
                it('should remove the substitute element on scope destroy', function () {
                    expect(this.element.next().attr('type')).toBe('text');
                    this.scope.$broadcast('$destroy');
                    this.scope.$digest();
                    expect(this.element.next().length).toBe(0);
                });
            });
        });
    });
});
