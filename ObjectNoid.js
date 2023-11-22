import { readFileSync, stat, open, write, close } from 'node:fs';
import { makeDebug } from './smallfuncs.js';
const debug = makeDebug('noid:object');
import { arkDataDictionary } from './arkDatabaseForKnex.js';

export class ObjectNameExists extends Error {
	constructor(...args) {
		super(...args);
	}
}

export class ObjectNoid {
	#name;
	#noidType;
	#internalCollections;
	#collectionNames;
	
	/**
	 * @param name	{String}	Case sensitive name
	 * @param base	{String}	Optional, if present it's the full path of a json file. If not the first parameter will be used as ./noid/<name>.json
	 * @param origin	{String}	Optional, only used if object is being created for the first time. Otherwise it will be loaded from the already existing .json file.
	 */
	constructor(name) {
		this.#name = name;
		this.#noidType = 'ObjectNoid';

		this.#internalCollections = {};
		//this.#collectionNames = [];
	}

	/**
	 * Produces a 'random sample' of this object, for test purposes.
	 */
	static sample(options) {
		return new ObjectNoid('ON' + Math.ceil(Math.random() * 10000));
	}
	
	get name() {
		return this.#name;
	}

	get noidType() {
		return this.#noidType;
	}

	/**
	 * @param {string}	colname	Collection name. Will be created inside this.#internalCollections. The name 'data' is suggested for the default.
	 * @param {string}	coltype	Collection type. One of these: Array, Map, Set, Object. Case-insensitive.
	 */
	createCollection(colname, coltype) {
		if (this.#internalCollections[colname])
			throw new ObjectNameExists(`Collection named ${colname} already exists in ObjectNoid ${this.#name}`);

		switch(coltype.toLowerCase()) {
		case 'array':
			this.#internalCollections[colname] = [];
			break;
		case 'map':
			this.#internalCollections[colname] = new Map();
			break;
		case 'set':
			this.#internalCollections[colname] = new Set();
			break;
		case 'object':
			this.#internalCollections[colname] = {};
			break;
		}
	}

	addCollectionRule() {
	}
}


/**
 * Keeps track of every object created by one of the subclasses.
 * @param {string}	name	Name of the object.
 * @param {string}	subclassname	Name of the subclass. Subclasses made by jsnoid will already be created with the proper configuration.
 */
const NoidJoinUs_list = new Map();
export class NoidJoinUs extends ObjectNoid {
	#subClassName;
	
	constructor(name, subclassname) {
		super(name);
		this.#noidType = 'NoidJoinUs';

		if (NoidJoinUs_list.has(subclassname)) {
			let sub = NoidJoinUs_list.get(subclassname);
			if (sub.has(name))
				throw new ObjectNameExists(name, subclassname);
		} else {
			NoidJoinUs_list.set(subclassname, new Map());
		}

		let sub = NoidJoinUs_list.get(subclassname);
		sub.set(name, this);
		this.#subClassName = subclassname;
	}

	/**
	 * @return {Map} List of all objects created of the indicated subclass.
	 */
	static us(subname) {
		if (!subname)
			subname = this.#subClassName;
		return NoidJoinUs_list.get(subname);
	}
}

export function makeNoidJoinUs(name) {
	return `import { NoidJoinUs } from 'jsnoid/ObjectNoid';\n\n`
		+ `export default class ${name} extends NoidJoinUs {\n`
		+ `\tconstructor(name) {\n`
		+ `\t\tsuper(name, '${name}');\n\n`
		+ `\t}\n\n`
		+ `static us() { return super.us('${name}'); }\n\n`;
		+ `}\n`;
}


/**
 * Represents a database table, with options to add Express routes, create views with forms and Bootstrap components. All in one object.
 * @param {string}	Object name, may be the same as the table name, but that's not mandatory.
 * @param {arkDataDictionary}	Defined in jsnoid/DatabaseForKnex.
 */
export class NoidDB extends ObjectNoid {
	#datadict;
	
	constructor(name, datadict) {
		super(name);
		this.#noidType = 'NoidDB';

		this.#datadict = datadict;
	}

	get datadict() {
		return this.#datadict;
	}
}


export function makeNoidDB(name) {
	return `import { NoidDB } from 'jsnoid/ObjectNoid';\nimport { arkDataDictionary } fom 'jsnoid/DatabaseForKnex';\n\n`
		+ `const datadict${name}\n= new arkDataDictionary('${name}', {\n`
		+ `\tfield1: 'increments',\n\tfield2: 'integer',\n\tfield3: ['string', 32]\n\t}, 'field1' );\n\n`
		+ `export default class ${name} extends NoidDB {\n`
		+ `\tconstructor(name) {\n`
		+ `\t\tsuper(name, datadict${name});\n\n`
		+ `\t}\n`
		+ `}\n`;
}
