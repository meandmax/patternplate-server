import {resolve} from 'path';

const routes = {
	'path': [
		'application/routes',
		'application/patternplate-server/routes'
	],
	'enabled': {
		'index': {
			'enabled': true,
			'path': '/'
		},
		'meta': {
			'enabled': true,
			'path': '/meta/',
			'options': {
				'key': 'patterns'
			}
		},
		'pattern': {
			'enabled': true,
			'path': '/pattern/:id+',
			'options': {
				'key': 'patterns',
				'maxage': 3600000
			}
		},
		'script': {
			'enabled': true,
			'path': '/script/:path+'
		},
		'demo': {
			'enabled': true,
			'path': '/demo/:id+'
		},
		'build': {
			'enabled': true,
			'path': '/build/:path*'
		},
		'static': {
			'options': {
				'root': [
					resolve(__dirname, '../', 'static'),
					resolve(process.cwd(), 'static')
				]
			}
		}
	}
};

export default routes;
