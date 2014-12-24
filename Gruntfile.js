module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      build: {
        src: ['dist/**/*'],
        filter: 'isFile',
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> v<%= pkg.version %>, created by: <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
      },
      build: {
        files: {
          'dist/<%= pkg.main %>-<%= pkg.version %>-<%= grunt.template.today("yyyymmddHHMMss") %>.min.js': [
            'js/jsvts.js',
            'js/objects/map.js',
            'js/objects/plotter.js',
            'js/objects/txtToMapParser.js',
            'js/objects/utils.js',
            'js/classes/stats.js',
            'js/classes/movable.js',
            'js/classes/renderable.js',
            'js/classes/segment.js',
            'js/classes/trafficFlowControl.js',
            'js/classes/stopLight.js',
            'js/classes/vehicle.js',
            'js/classes/tempVehicle.js',
            'js/classes/vehicleGenerator.js'
          ]
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load the plugin that provides the "concat" task.
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Load the plugin that provides the "clean" task.
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default task(s).
  grunt.registerTask('default', ['clean','uglify']);

};