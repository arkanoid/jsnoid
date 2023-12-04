import { readFileSync, stat, open, write, close } from 'node:fs';
//import { makeDebug } from './smallfuncs.js';
//const debug = makeDebug('noid:object');
import { arkDataDictionary } from './arkDatabaseForKnex.js';

export class ObjectNameExists extends Error {
	constructor(...args) {
		super(...args);
	}
}

const ObjectNoidList = new Map();

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
	constructor(name, noidType) {
		this.#name = name;
		this.#noidType = noidType || 'ObjectNoid';

		this.#internalCollections = {};
		//this.#collectionNames = [];

		ObjectNoidList.set(name, this);
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
		super(name, 'NoidJoinUs');
		//this.#noidType = 'NoidJoinUs';

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


export class NoidExpress extends ObjectNoid {
	#routes = [];
	
	constructor(name) {
		super(name, 'NoidExpress');

		// routes and methods. All routes will start with /${this noid name}
		this.addRoute('get', '/', this.webGetIndex);	// need to define method webGetIndex
	}

	addRoute(method, url, func) {
		this.#routes.push({ method: method, url: url, func: func });
	}

	/**
	 * Tests if page request is Ajax.
	 * @param {object}	First argument received by a router function
	 * @return {boolean	True if the request is Ajax, false if it's a 'normal' page load.
	 */
	isAjax(req) {
		return (req.xhr || req.headers.accept.indexOf('json') > -1);
	}

	/**
	 * Create all routes defined in this object in Express
	 */
	expressCreateRoutes(app, router) {
		this.#routes.forEach((r) => {
			switch(r.method) {
			case 'get':
				router.get(r.url, r.func);
				break;
			case 'post':
				router.post(r.url, r.func);
				break;
			}
		});
		app.use('/' + this.name, this.expressRouter(router));
	}

	webGetIndex(req, res, next) {
		if (this.isAjax(req))
			res.send({ data: 'some result from a db query or any other data' });
		else
			res.render('pagename', {
				user: req.user, mydata: 'any data I need'
			});
	}
}


/**
 * Represents a database table, with options to add Express routes, create views with forms and Bootstrap components. All in one object.
 * @param {string}	Object name, may be the same as the table name, but that's not mandatory.
 * @param {arkDataDictionary}	Defined in jsnoid/DatabaseForKnex.
 * @param {class}	Class used for creating a record. Inherited from ObjectNoid.
 */
export class NoidDB extends NoidExpress {
	#datadict;
	#knex;
	#DB;
	#rawRecords;
	#records;
	#recordClass;
	
	constructor(name, datadict, recordClass) {
		super(name, 'NoidDB');
		//this.#noidType = 'NoidDB';

		this.#datadict = datadict;
		this.#knex = null;
		this.#DB = null;
		this.#rawRecords = [];
		this.#records = [];
		this.#recordClass = recordClass;
	}

	set knex(k) {
		this.#knex = k;
	}

	get knex() {
		if (!this.#knex) {
			let k = ObjectNoidList.get('knex');
			if (k) {
				this.#knex = k;
				if (!this.#DB)
					this.#DB = new arkBaseDBClass(this.knex, this.#datadict.tableName, this.#datadict);
			} else
				throw new Error('No Noid called knex found, and no knex object supplied to ' + this.name);
		}

		return this.#knex;
	}

	get(fields, where, callback) {
		let k;
		
		if (!this.#DB)
			k = this.knex;
			
		let row = this.#DB.findFirst(where, fields, callback); // fields and where switch places
		this.#rawRecords = [ row ];
		let rec = new this.#recordClass(row);
		this.#records = [ rec ];
		return this;
	}

	get record() {
		return this.#records[0];
	}
	
	list(fields, where, order) {
		let k;
		
		if (!this.#DB)
			k = this.knex;

		this.#rawRecords = this.#DB.list(fields, where, order);
		this.#records = this.#rawRecords.map(r => { return new this.#recordClass(r); });
		return this;
	}
	
	get records() {
		return this.#records;
	}

	listWithWhereClauses(fields, whereClauses, order) {
		let k;
		
		if (!this.#DB)
			k = this.knex;

		return this.#DB.listWithWhereClauses(fields, whereClauses, order);
	}

	insert(fields) {
		return this.#DB.insert(fields);
	}

	update(fields, where) {
		return this.#DB.update(fields, where);
	}

	get datadict() {
		return this.#datadict;
	}
}

/**
 * Represents a database table, but viewed client side. Used on the client side to receive data through Ajax.
 * @param {string}	Object name, may be the same as the table name, but that's not mandatory.
 * @param {arkDataDictionary}	Defined in jsnoid/DatabaseForKnex.
 * @param {class}	Class used for creating a record. Inherited from ObjectNoid.
 * @param {string|object}	String: URL to call with Ajax (GET) and obtain data. Object: also data for an Ajax call, in this format: { url: '...', method: 'POST' } (method: POST, GET)
 *		
 */
export class NoidDataSource extends ObjectNoid {
	#datadict;
	#recordClass;
	#records;
	#source;
	
	constructor(name, datadict, recordClass, source) {
		super(name, 'NoidDataSource');

		this.#datadict = datadict;
		this.#recordClass = recordClass;
		this.#source = source;

		this.#records = [];
	}

	get record() {
		return this.#records[0];
	}

	get records() {
		return this.#records;
	}
}


/**
 * Represents a database row. May be used client side or server side.
 * Child classes from this are meant to be used by child classes of NoidDB.
 */
export class NoidRecord extends ObjectNoid {
	static datadict;
	#record;

	constructor(name) {
		super(name, 'NoidRecord');
	}

	setRecord(r, datadict) {
		this.#record = datadict.adjustRowFromDatabase(r);
	}

	get record() {
		return this.#record;
	}
}
	

/**
 * Returns two files. First one is client side, the other server side
 */
export function makeNoidDB(name) {
	return { `${name}_cs.js`: `// NOTE: import the classes here with: import { datadict${name}, ${name}, DS${name} } from 'noid/${name}_cs.js'
// (DS${name} strictly only needed on client side)

import { arkDataDictionary } from 'jsnoid/DatabaseForKnex';
import { NoidDataSource } from 'jsnoid/ObjectNoid';

// NOTE: Edit the data dictionary below.
// Creation/change of database schema isn't done by this. You must create/alter the database table either by hand, knex migrations, or any othr method, but jsnoid won't replicate changes made here to the database and vice-versa.
// There are more parameters than what is shown here; check the documentation of the arkDataDictionary class at https://github.com/arkanoid/jsnoid/blob/main/DatabaseForKnex.md#constructor-tablename-fields-primarykeys-simplelist-options
export const datadict${name} =
new arkDataDictionary('${name}', {
	id: 'increments',
	toys: 'integer',
	pets: 'bigInteger',
	age: 'tinyint',
	doors: 'smallint',
	bunnies: 'mediumint',
	starsInTheSky: 'bigint',
	description: 'text',
	name: [ 'string', 32 ],
	myNumber: [ 'float' /* , 8, 2 */ ],
	myNumber2: [ 'double' /* , 8, 2 */ ],
	active: 'boolean',
	birthday: 'date',
	firstLogon: 'datetime',
	lastUpdate: 'timestamp',
	aBigBlob: [ 'binary', 1024000 ],
	status: [ 'enum', [ 'alone', 'red', 'crocodile', 'thinking', 'expensive' ] ],
	tags: 'json',
	extraData: 'jsonb',
	uniqueId: 'uuid'
}, 'id' // primary keys, if more than one field use []
);

// NOTE: adapt this class to fit your Record. Methods from it can be used in client side too (.toString(), etc)
export class ${name} extends NoidRecord {
	static datadict = datadict${name};
}

// NOTE: adapt this class to fit your needs to receive data from Ajax queries, and create records with ${name} class.
export class DS${name} extends NoidDataSource {
	constructor(record) {
		super('DS${name}', datadict${name}, ${name});
		this.record(record);
	}

	set record(r) {
		this.setRecord(r, datadict${name});
	}
}
`,
`${name}.js`: `// NOTE: import the classes here with: import DB${name} from 'noid/${name}.js'

import { NoidDB } from 'jsnoid/ObjectNoid';
import { datadict${name}, ${name} } from './${name}_cs.js';

// NOTE: adapt this class to your needs; DB queries, Express routes
export default class DB${name} extends NoidDB {
	constructor(record) {
		super('DB${name}', datadict${name}, ${name});
		this.record(record);
	}

	set record(r) {
		this.setRecord(r, datadict${name});
	}
}` };
}
