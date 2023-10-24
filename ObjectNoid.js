import { readFileSync, stat, open, write, close } from 'node:fs';
import debugM from 'debug';
const debug = debugM('jsnoid:objectnoid');

export default class ObjectNoid {
	#name;
	#origin;
	#originDatatype;
	#originMode;
	data;
	
	/**
	 * @param name	{String}	Case sensitive name
	 * @param base	{String}	Optional, if present it's the full path of a json file. If not the first parameter will be used as ./noid/<name>.json
	 * @param origin	{String}	Optional, only used if object is being created for the first time. Otherwise it will be loaded from the already existing .json file.
	 */
	constructor(name, base, origin, datatype, mode) {
		this.#name = name;

		let filepath = base || `./noid/${name}.json`;
		// test if json already exists
		debug('filepath', filepath);
		stat(filepath, (err, s) => {
			if (err) {
				// checking parameter combos
				debug(`name ${name} base ${base} origin ${origin} datatype ${datatype} mode ${mode}`);
				if (origin == 'data' && datatype == '/') {
					datatype = 'map';
				}
				if (origin == 'data') {
					let origin_datatype = ['array', 'object', 'map'];
					if (origin_datatype.indexOf(datatype.toLowerCase()) < 0) {
						throw new Error('ObjectNoid: when origin is data, datatype must be one of: ' + origin_datatype.join(', '));
					}
					switch (datatype.toLowerCase()) {
					case 'array':
						this.data = [];
						break;
					case 'object':
						this.data = {};
						break;
					default:
						this.data = new Map();
						break;
					}
				}
				debug(`name ${name} base ${base} origin ${origin} datatype ${datatype} mode ${mode}`);
				debug(this.data);

				this.#origin = origin;
				this.#originDatatype = datatype;
				this.#originMode = mode;

				this.#createJson(filepath);
			} else {
				debug('constructor, call loadJson', filepath);
				this.loadJson(filepath);
			}
		});
	}

	/**
	 * Creates the .json file inside /noid/
	 */
	#createJson(filepath) {
		if (!filepath)
			filepath = `./noid/${this.#name}.json`;
		
		let filecontents = {
			origin: this.#origin,
			datatype: this.#originDatatype,
			mode: this.#originMode
		};
		if (this.#origin == 'data') {
			if (this.#originDatatype == 'map') {
				filecontents.data = {};
				debug('this.data', this.data);
				this.data.forEach((value, key) => {
					filecontents.data[key] = value;
				});
			} else
				filecontents.data = this.data;
		}
		debug(filecontents);

		open(filepath, 'w', 0o640, (err, fd) => {
			if (err) {
				console.error(err);
				process.exit(12);
			} else {
				let content = JSON.stringify(filecontents);
				debug(content);
				write(fd, content, null, null, (err, written, str) => {
					if (err) {
						console.error(`Error writing ${filepath}`);
						console.error(err);
						process.exit(13);
					} else {
						close(fd, (err) => {
							if (err) {
								console.error(`Error closing ${filepath}`);
								console.error(err);
								process.exit(14);
							} else
								this.loadJson(filepath);
						});
					}
				});
			}
		});
	}
	
	loadJson(filepath) {
		let jdata = JSON.parse(readFileSync(filepath, 'utf8'));
		debug('loadJson', jdata);
		this.#origin = jdata.origin;
		this.#originDatatype = jdata.datatype;
		this.#originMode = jdata.mode;

		if (jdata.origin == 'data') {
			if (jdata.datatype == 'map') {
				this.data = new Map();
				for (i in jdata.data)
					this.data.set(i, jdata.data[i]);
			} else
				this.data = jdata.data;
		}
		
		return this;
	}

	/**
	 * Currently works for origin:data and datatype:map
	 */
	addData(newdata, datatype) {
		debug('addData this.#origin', this.#origin, 'this.#originDatatype', this.#originDatatype);
		if (this.#origin == 'data' && this.#originDatatype == 'map') {
			switch (datatype) {
			case 'map':
				newdata.forEach((value, key) => {
					this.data.set(key, value);
				});
				break;
			case 'object':
				for (i in newdata)
					this.data.set(i, newdata[i]);
			}
		}
		this.#createJson();
	}
	
	name() {
		return this.#name;
	}

}
