import { readFileSync } from 'node:fs';

/*function ask(msg) {
	process.stdout.write(msg + '(y/n/q)?');
	process.stdin.on('data', (data) => {
		r = data.toString().trim();
		if (r === 'y' || r === 'n' || r === 'q') {
			process.stdin.end();
			return r;
		}
	});
}

exports.ask = ask;*/

export class ObjectNoid {
	#name;
	#data;
	
	/**
	 * @param name Case sensitive name
	 * @param base If string, it's the path of a json file
	 */
	constructor(name, base) {
		this.#name = name;
		this.#data = null;
		if (typeof base == 'string') {
			// load json file
			this.loadJson(base);
		}
	}

	loadJson(filepath) {
		let jdata = JSON.parse(readFileSync(filepath, 'utf8'));
		this.#data = jdata;

		/*
		let o = this;
		for (i in o) {
			if (this.hasOwn(i))
				o[i] = jdata[i];
			else if (this.hasOwn(`#${i}`))
				o[`#${i}`] = jdata[i];
		}
		console.log('#name', this.#name);
		*/
	}

	name() {
		return this.#name;
	}

	getData() {
		return this.#data;
	}
}

//exports.ObjectNoid = ObjectNoid;
