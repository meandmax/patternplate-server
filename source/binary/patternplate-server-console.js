#!/usr/bin/env node
/*eslint-disable no-process-env */

import 'babel-core/polyfill';
import minimist from 'minimist';

import server from '../';

async function start (options) {
	const mode = 'console';
	const settings = {...options, mode};
	const command = settings._[1];

	const application = await server(settings);
	await application.run(command, settings);
}

const args = minimist(process.argv.slice(1));

start(args)
	.catch(err => {
		setTimeout(() => {
			throw err;
		});
	});
