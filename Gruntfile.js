module.exports = function(grunt){
	grunt.initConfig({
		clean: {
			dist: ['dist']
		},

		browserify: {
			dist: {
				files: {
					'dist/cal-ed-explorer.js': ['scripts/init.js']
				}
			}
		},
		
		uglify: {
			dist: {
				files: {
					'dist/cal-ed-explorer.js': ['dist/cal-ed-explorer.js']
				}
			}
		},

		compass: {
			dist: {
				options: {
					sassDir: 'styles',
					cssDir: 'dist'
				}
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	
	grunt.registerTask('build', [
		'clean',
		'browserify',
		'uglify',
		'compass'
	]);
	grunt.registerTask('default', 'build');
};