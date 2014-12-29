module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    files: {
	    base: [
			"js/jsvts.js",
			"js/objects/map.js",
			"js/objects/plotter.js",
			"js/objects/txtToMapParser.js",
			"js/objects/utils.js",
			"js/classes/stats.js",
			"js/classes/movable.js",
			"js/classes/renderable.js",
			"js/classes/segment.js",
			"js/classes/trafficFlowControl.js",
			"js/classes/stopLight.js",
			"js/classes/vehicle.js",
			"js/classes/tempVehicle.js",
			"js/classes/vehicleGenerator.js"
		],
		dependencies: [
			"dependencies/three-r69.js",
			"dependencies/OrbitControls.js",
			"dependencies/helvetiker_regular.typeface.js"
		],
		tests: "tests/allTests.html"
	},
    clean: {
      build: {
        src: ['dist/**/*'],
        filter: 'isFile',
      },
    },
    uglify: {
      options: {
        mangle: true,
        compress: true,
        sourceMap: true,
      },
      build: {
        options: {
          banner: '/*! <%= pkg.name %> v<%= pkg.version %>, created by: <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n'
        },
        files: {
          'dist/<%= pkg.main %>.min.js': ['<%= files.base %>']
        }
      },
      buildWithDeps: {
        options: {
          banner: '/*! <%= pkg.name %> v<%= pkg.version %>, created by: <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>, includes three.js dependencies from: http://github.com/mrdoob/three.js/ */\n'
        },
        files: {
          'dist/<%= pkg.main %>-deps.min.js': ['<%= files.dependencies %>','<%= files.base %>']
        }
      }
    },
    qunit: {
      all: ['<%= files.tests %>']
    },
    copy: {
      examples: {
        expand: true,
        cwd: 'dist/',
        flatten: true,
        src: '<%= pkg.main %>-deps.*', 
        dest: 'examples/js/',
        filter: 'isFile'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load the plugin that provides the "clean" task.
  grunt.loadNpmTasks('grunt-contrib-clean');

  // This plugin provides the "qunit" task.
  grunt.loadNpmTasks('grunt-contrib-qunit');

  // Load the plugin that provides the "copy" task.
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['clean','uglify','qunit','copy']);

};