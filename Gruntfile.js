module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    files: {
        js: [
          "js/jsvts.js",
          /** main controllers **/
          "js/objects/utils.js",
          "js/objects/map.js",
          "js/objects/plotter.js",
          "js/objects/txtToMapParser.js",
          /** renderable objects **/
          "js/classes/movable.js",
          "js/classes/renderable.js",
          "js/classes/segment.js",
          "js/classes/vehicle.js",
          "js/classes/tempVehicle.js",
          "js/classes/trafficFlowControl.js",
          "js/classes/stopLight.js",
          "js/classes/vehicleGenerator.js",
          "js/classes/stats.js",
        ],
        tests: "tests/AllTests.html",
    },
    clean: {
      dist: ['dist/*']
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
