import {resolve, dirname, basename} from 'path';
import fs from 'q-io/fs';
import getPatternManifests from './get-pattern-manifests';

const defaults = {
	isEnvironment: false,
	filters: {},
	log: function() {}
};

async function getPatterns(options, cache = null) {
	const settings = {...defaults, ...options};
	const {
		id,
		base,
		config,
		factory,
		transforms,
		filters,
		log,
		isEnvironment
	} = settings;

	let path = resolve(base, id);
	let search = resolve(path, 'pattern.json');

	// No patterns to find here
	if (!await fs.exists(path)) {
		return null;
	}

	// We are dealing with a directory listing
	if (!await fs.exists(search)) {
		search = path;
	}

	// Get all pattern ids
	let paths = await fs.listTree(search);
	let patternIDs = paths
		.filter((item) => basename(item) === 'pattern.json')
		.filter((item) => isEnvironment ? true : !item.includes('@environments'))
		.map((item) => dirname(item))
		.map((item) => fs.relativeFromDirectory(options.base, item));

	let manifests;
	let results = [];
	let errors = [];

	for (let patternID of patternIDs) {
		let readCacheID = `pattern:read:${patternID}`;
		log(`Initializing pattern "${patternID}"`);

		if (cache && cache.config.static && cache.staticRoot && await fs.exists(cache.staticRoot)) {
			let cachedPatternPath = resolve(cache.staticRoot, patternID, 'build.json');
			log(`Searching ${patternID} static cache at ${cachedPatternPath}`);

			if (await fs.exists(cachedPatternPath)) {
				try {
					results.push(JSON.parse(await fs.read(cachedPatternPath)));
					log(`Static cache hit for ${patternID} at ${cachedPatternPath}. Profit!`);
					continue;
				} catch (err) {
					log(`Error reading static cache version of ${patternID} at ${cachedPatternPath}`, err);
				}
			}

			log(`Static cache miss for ${patternID} at ${cachedPatternPath}, falling back to dynamic version`);
		}

		let pattern = await factory(patternID, base, config, transforms, filters);
		let cachedRead = cache && cache.config.read ? cache.get(readCacheID, false) : null;

		const manifests = await getPatternManifests(base);

		// Resolve dependent patterns
		let dependentPatterns = {};
		manifests.map((manifest) => {
			if (manifest.patterns) {
				for (let name of Object.keys(manifest.patterns)) {
					if (manifest.patterns[name] === patternID) {
						dependentPatterns[manifest.id] = manifest;
					}
				}
			}
		});
		pattern.manifest.dependentPatterns = dependentPatterns;

		if (options.task === 'meta') {
			results.push(pattern);
			continue;
		}

		if (!cachedRead) {
			log(`Reading pattern "${patternID}"`);
			await pattern.read();
		} else {
			log(`Using cached pattern read "${readCacheID}"`);
			pattern = cachedRead;
		}

		if (cache && cache.config.read) {
			cache.set(readCacheID, pattern.mtime, pattern);
		}

		if (options.task === 'read') {
			results.push(pattern);
		} else {
			results.push(await pattern.transform(!isEnvironment, isEnvironment));
		}
	}

	results = results.map((result) => {
		return typeof result.toJSON === 'function' ? result.toJSON() : result;
	});

	return results;
}

export default getPatterns;
