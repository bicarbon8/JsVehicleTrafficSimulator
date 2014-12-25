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
        mangle: true,
        compress: true,
        sourceMap: true,
        // beautify: true,
      },
      build: {
        files: {
          'dist/<%= pkg.main %>.min.js': [
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
    },
    copy: {
      build: {
        src: 'dist/<%= pkg.main %>.min.js',
        dest: 'dist/<%= pkg.main %>-<%= pkg.version %>-<%= grunt.template.today("yyyymmddHHMMss") %>.min.js'
      }
    },
    qunit: {
      all: ['tests/*.html']
    }
  });

  // Load the plugin that provides the "copy" task.
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load the plugin that provides the "clean" task.
  grunt.loadNpmTasks('grunt-contrib-clean');

  // This plugin provides the "qunit" task.
  grunt.loadNpmTasks('grunt-contrib-qunit');

  // Default task(s).
  grunt.registerTask('default', ['clean','uglify','copy','qunit']);

};