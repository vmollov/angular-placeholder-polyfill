# AngularJS Placeholder Polyfill

A polyfill for the HTML 5 placeholder attribute in AngularJS.


* Works with ngModel
* Works on text, password, and all other input fields
* Works with interpolated values 
* Works on placeholder and ng-attr-placeholder
* No dependency on jquery

## Using
Include your preferred script from the dist folder and list the module vm.utils as a dependency in your angular application. The directive will detect the browser's capability and exit if a placeholder polyfill is not needed.  
You can use css to style the placeholder by targeting class vm-utils-placeholder-polyfill, which will automatically be added to the element when the placeholder is displayed.

## Testing
```BASH
npm test
```
