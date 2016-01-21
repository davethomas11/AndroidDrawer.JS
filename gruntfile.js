/*
Dave Thomas
Jan 2016

Added simply just for automating task of minifying js files after changes are made

To run:

Step 1. ( have grunt installed locally ) Skip if you already have grunt-cli
npm install -g grunt-cli

Step 2. ( install grunt dependencies )
npm install

Step 3. ( run grunt to output minified js )
grunt

*/

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            dist: {
                files: {
                    'android.drawer+ng.min.js': [
                        "android.drawer.js",
                        "android.drawer.angular.js"
                    ]
                },
                options: {
                    beautify: false,
                    mangle: false,
                    sourceMap: false
                }
            }
        },

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', [
        'uglify'
    ]);
};