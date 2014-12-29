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
        mangle: true,
        compress: true,
        sourceMap: true,
      },
      build: {
        options: {
          banner: '/*! <%= pkg.name %> v<%= pkg.version %>, created by: <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n'
        },
        files: {
          'dist/<%= pkg.main %>.min.js': ['<%= pkg.files.base %>']
        }
      },
      buildWithDeps: {
        options: {
          banner: '/*! <%= pkg.name %> v<%= pkg.version %>, created by: <%= pkg.author %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>, includes three.js dependencies from: http://github.com/mrdoob/three.js/ */\n'
        },
        files: {
          'dist/<%= pkg.main %>-deps.min.js': ['<%= pkg.files.dependencies %>','<%= pkg.files.base %>']
        }
      }
    },
    qunit: {
      all: ['<%= pkg.files.test %>']
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