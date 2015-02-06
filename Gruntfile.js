module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    files: {
        js: [
          "js/jsvts.js",
          "js/helpers/utils.js",
          /** main controllers **/
          "js/clock.js",
          "js/map.js",
          "js/plotter.js",
          "js/txtToMapParser.js",
          /** renderable objects **/
          "js/objects/movable.js",
          "js/objects/renderable.js",
          "js/objects/segment.js",
          "js/objects/vehicle.js",
          "js/objects/tempVehicle.js",
          "js/objects/trafficFlowControl.js",
          "js/objects/stopLight.js",
          "js/objects/vehicleGenerator.js",
        ],
        tests: "tests/AllTests.html",
    },
    clean: {
      tests: ['dist']
    },
    qunit: {
      all: ['<%= files.tests %>']
    },
    uglify: {
      options: {
        mangle: true,
        compress: true,
        sourceMap: true,
      },
      build: {
        options: {
          banner: '/*! <%= pkg.name %> v<%= pkg.version %>, created by: <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */'
        },
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= files.js %>']
        }
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['clean', 'qunit', 'uglify']);

};
