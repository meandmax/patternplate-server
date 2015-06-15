import fetch from 'isomorphic-fetch';

import {resolve, normalize, basename, extname} from 'path';
import fs from 'q-io/fs';
import marked from 'marked';
import {promisify} from 'bluebird';

export default function indexRouteFactory (application, configuration) {
	const markdown = promisify(marked);

	return async function indexRoute () {
		let routeConfig = application.configuration.routes.enabled;
		let serverConfig = application.configuration.server;
		let base = `http://${serverConfig.host}:${serverConfig.port}`;

		let routes = Object.keys(routeConfig)
			.filter((routeName) => routeConfig[routeName].enabled === true)
			.map(function getRoutes (routeName) {
				return {'name': routeName, 'path': routeConfig[routeName].path, 'uri': `${base}${application.router.url(routeName)}`};
			});

		let response = await fetch(`${base}${application.router.url('meta')}`, {'headers': {'accepty-type': 'application/json'}});
		let meta = await response.json();

		let readmePath = resolve(application.runtime.patterncwd || application.runtime.cwd, 'patterns', 'README.md');
		var readme = '';

		if (await fs.exists(readmePath)) {
			let readMeSource = await fs.read(readmePath);
			readMeSource = readMeSource.toString('utf-8');
			readme = await markdown(readMeSource);
		}

		let buildPath = resolve(application.runtime.patterncwd || application.runtime.cwd, 'build');
		let buildAvailable = await fs.exists(buildPath);
		let builds = [];

		if (buildAvailable) {
			let list = await fs.listTree(buildPath);
			list = list.filter((item) => item !== buildPath);

			builds = list.map((buildItemPath) => {
				let fragments = basename(buildItemPath, extname(buildItemPath)).split('-');
				return {
					'path': fs.relativeFromDirectory(buildPath, buildItemPath),
					'environment': fragments[1],
					'revision': fragments[2],
					'version': fragments[3]
				};
			});
		}

		this.type = 'json';
		this.body = Object.assign({}, {
			'name': application.configuration.pkg.name,
			'version': application.configuration.pkg.version,
			'environment': application.configuration.environment,
			'host': serverConfig.host,
			'port': serverConfig.port,
			'routes': routes,
			'meta': meta,
			'readme': readme,
			'builds': builds
		});
	};
}
