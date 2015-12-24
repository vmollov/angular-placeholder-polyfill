module.exports = function (config) {
    config.set({

        basePath: './',

        files: [
            'node_modules/angular/angular.js',
            'node_modules/angular-mocks/angular-mocks.js',
            'src/*.js',
            'test/**/*.spec.js'
        ],

        autoWatch: true,

        frameworks: ['jasmine'],

        preprocessors: {
            'src/**/*.js': ['coverage']
        },

        browsers: ['Chrome'],

        plugins: [
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-coverage',
            'karma-jasmine',
            'karma-junit-reporter'
        ]

    });
};
