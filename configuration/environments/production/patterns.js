'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports['default'] = {
	'formats': {
		'js': {
			'name': 'Script',
			'transforms': ['browserify', 'uglify']
		}
	},
	'cache': true
};
module.exports = exports['default'];