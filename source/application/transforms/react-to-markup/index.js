import * as React from 'react';

export default function createReactRendererFactory(application) {
	const config = application.configuration.transforms['react-to-markup'] || {};

	return async function renderReactComponent(file, demo) {
		if (file.demoBuffer) {
			file.demoBuffer = renderMarkup(file.demoBuffer.toString('utf-8'), config.opts)
		} else {
			file.buffer = renderMarkup(file.buffer.toString('utf-8'), config.opts);
		}
		return file;
	}
}

function renderMarkup(source, opts) {
	// ...'require' module...
	const moduleScope = {exports:{}};
	const method = opts.static ? React.renderToStaticMarkup : React.renderToString;
	const fn = new Function('module', 'exports', 'require', source);
	fn(moduleScope, moduleScope.exports, require);

	// ...finally render markup
	return method(React.createElement(moduleScope.exports));
}
