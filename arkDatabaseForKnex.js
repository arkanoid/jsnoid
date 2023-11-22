import { makeDebug } from './smallfuncs.js';
const debug = makeDebug('ark:db');

export class arkBaseDBClass {
    /**
     * Must pass a knex configuration object to constructor. This comes from the file that configures database Knex connection.
     * 
     * @param {object} Knex configuration
     * @param {string} Name of the SQL table, for Knex use
     * @param {arkDataDictionary} (optional) dictionary Object from class arkDataDictionary with metadata about the table fields.
     */
    constructor(knex, tableName, dictionary) {
		this.knex = knex;
		this.tableName = tableName;
		this.dictionary = dictionary;
    }
	
    /**
     * Returns first record to match fields.
     * @param {object}	Used in WHERE clause, using Knex.js syntax.
     * @param {array}	(optional) Array of which fields to return (will return '*' if not specified).
	 * @param {function}	(optional) Processes the record object.
	 * @return {object}	First record to match
	 * TODO: param {array} joins(optional) List of joins to use, in this format:
	 *	{ table, fields: [], 
     */
    findFirst(where, fields, callback) {
		return new Promise((resolve, reject) => {
			let q = this.knex.first(fields || '*').from(this.tableName)
				.where(where);
			
			q.then((row) => {
				let r = row;
				if (callback && typeof callback == 'function')
					r = callback(row);
				
				debug(`arkBaseDBClass.findFirst(${where} ->`, r);
				
				resolve(r);
			})
				.catch((err) => { reject(new Error(err)) })
		})
    }


    /**
     * List <fields> based on clause <where> ordered by <order>.
     * All parameters are optional. Default will list the entire table.
	 * @param {array}			fields	Optional, list of field names.
	 * @param {object|array}	where	Optional, will be passed to Knex .where()
	 * @param {object}			order	Optional, will be passed to Knex .orderBy()
     */
    list(fields, where, order) {
		return new Promise((resolve, reject) => {
			let f;
			if (fields)
				f = fields;
			else if (this.dictionary)
				f = this.dictionary.fieldsForSelect();
			
			let q = this.knex.select(f).from(this.tableName);
			if (where)
				q = q.where(where);
			if (order)
				q = q.orderBy(order);
			
			q.then((rows) => { resolve(rows); })
				.catch((err) => { reject(new Error(err)); });
		});
    }
    
	/**
     * Same as list() but with more possible WHERE clauses.
	 * @param {array}	fields	Optional, list of field names.
	 * @param {object}	where	Optional, can have the following keys: where, whereILike, whereRaw
	 * @param {object}	order	Optional, will be passed to Knex .orderBy()
	 * Examples for the <where> parameter:
	 *	{ whereILike: { name: '%Smith%' } }
	 *	{ whereRaw: `json_search(s.tags, "one", "${tag}") is not null` }
	 *	{ where: { id: 9, class_id: 101 }, whereILike: { name: '%thing%' } }
     */
	listWithWhereClauses(fields, whereClauses, order) {
		return new Promise((resolve, reject) => {
			let f = fields || this.dictionary.fieldsForSelect();

			let q = this.knex.select(f).from(this.tableName);

			try {
				if (whereClauses) {
					if (whereClauses.where) {
						//debugSQL('whereClauses.where', whereClauses.where);
						for (let w in whereClauses.where)
							q = q.where(w, whereClauses.where[w]);
					}
					if (whereClauses.whereILike) {
						//debugSQL('whereClauses.whereILike', whereClauses.whereILike);
						for (let w in whereClauses.whereILike)
							q = q.whereILike(w, whereClauses.whereILike[w]);
					}
					if (whereClauses.whereRaw) {
						//debugSQL('whereClauses.whereRaw', whereClauses.whereRaw);
						q = q.whereRaw(whereClauses.whereRaw);
					}
					//debugSQL(q.toString());
				}
			} catch(e) {
				console.error('jsnoid/DatabaseForKnex listWithWhereClauses', e);
			}
			
			q.then((rows) => { resolve(rows); })
				.catch((err) => { reject(new Error(err)); });
		});
	}


	/**
	 * Inserts a new record into the database.
	 * @param fields Object with values
	 */
	insert(fields) {
		return this.knex(this.tableName).insert(
			(this.dictionary ? this.dictionary.adjustRowForDatabase(fields) : fields)
		);
	}

	/**
	 * Updates record.
	 * @param fields Object with values
	 * @param where Where function
	 */
	update(fields, where) {
		debug(() => { return 'arkBaseDBClass.update' + fields + where });

		return this.knex(this.tableName).update(
			(this.dictionary ? this.dictionary.adjustRowForDatabase(fields) : fields)
		).where(where)
	}
}

const _arkDataDictionaries = new Map();

export class arkDataDictionary {
	#tableName;
	#fields;
	primaryKeys;
	simpleList;
	#options;
	
	/**
	 * @param {string}	Name of the SQL table
	 * @param {array|object}	List of fields. When an array, each item can be just a string (field name and nothing more) or an object with more data about the field.
	 *					Expected object format: { name, type } - name: Should be the same name of the database field. type: One of those: string, number, json, timestamp
	 *					If an object, keys are field names and values are the types as defined above. Example: { id: 'number', name: 'string', age: 'number' }
	 * @param {array|string}	(optional) Will be passed to the setPrimaryKeys() method.
	 * @param {array|string}	(optional) Will be passed to the setSimpleList() method.
	 * @param {object}			(optional) List of options, listed below:
	 *			alias {string}	Alias for tableName. Used when joining other tables.
	 *			joins {array}	List of available joins. Each one is an object as below:
	 *					foreignTable {string}, onField {string}, foreignOnField {string}, relation {string} (optional)
	 *					Example: { foreignTable: 'products', onField 'product_id', foreignOnField: 'id', relation: '=' }
	 */
	constructor(tableName, fields, primaryKeys, simpleList, options) {
		this.#tableName = tableName;
		this.#fields = {};
		this.primaryKeys = [];
		this.simpleList = simpleList || [];

		if (Array.isArray(fields))
			fields.forEach(o => {
				let f;
				if (typeof o == 'string')
					f = arkDataDictionary.newField({ name: o });
				else
					f = arkDataDictionary.newField(o);

				//this.#fields.set(f.name, f);
				this.#fields[f.name] = f;

				if (f.primaryKey)
					this.primaryKeys.push(f.name);

				if (f.list)
					this.simpleList.push(f.name);
			});
		else {
			for (let key in fields)
				this.#fields[key] = arkDataDictionary.newField({ name: key, type: fields[key] });
				//this.#fields.set(key, arkDataDictionary.newField({ name: key, type: fields[key] }));
		}

		if (options)
			this.#options = options;
		else
			this.#options = {};

		_arkDataDictionaries.set(tableName, this);
	}


	/**
	 * @return {object}	Joins as defined in the object creation.
	 */
	get joins() {
		return this.#options?.joins;
	}

	joinsForQuery(joins) {
		// knex example: .join('contacts', 'users.id', 'contacts.user_id')
		let result = [];

		if (!this.#options?.joins)
			return null;
		
		if (joins && Array.isArray(joins) && joins.length > 0) {

			joins.forEach(j => {
				//let joinedTable = _arkDataDictionaries.get(j);
				let k = this.#options.joins.filter(x => x.foreignTable == j)[0];
				let def = [ k.foreignTable, this.#tableName + '.' + k.onField ];
				if (k.relation)
					def.push(k.relation);
				def.push(k.foreignTable + '.' + k.foreignOnField);
				
				result.push(def);
			});

		} else {

			this.#options.joins.forEach(k => {
				let def = [ k.foreignTable, this.#tableName + '.' + k.onField ];
				if (k.relation)
					def.push(k.relation);
				def.push(k.foreignTable + '.' + k.foreignOnField);
				
				result.push(def);				
			});
		}

		return result;
	}
	
	/**
	 * Returns a list of fields for this table, if no joins, and with other tables if joins are specified. If so, every field will be aliased as tablename_fieldname.
	 * @param {boolean} Optional. Use all fields, or if not use just the simpleList fields.
	 * @param {array} Optional. List of joins to use for this SELECT (joins must have been previously defined in options when creating this object).
	 * @return {array} List of fields for use in a SQL SELECT clause. For use by the list() method of arkBaseDBClass. If simpleList was defined that will be used, unless <allFields> is true.
	 */
	fieldsForSelect(allFields, joins) {
		let f;

		if (joins && Array.isArray(joins) && joins.length > 0) {

			//console.log(`${this.#tableName} simpleList`, this.simpleList);
			if (this.simpleList.length > 0 && !allFields) {
				f = this.simpleList/*.join(',')*/;
			} else
				f = Object.keys(this.#fields);
			
			// first, add aliases to all fields
			f = this.addAliasesToFields(f);

			// add all joins' fields, with aliases
			joins.forEach(j => {
				let joinedTable = _arkDataDictionaries.get(j);
				//console.log('joinedTable', joinedTable);
				f = f.concat(joinedTable.addAliasesToFields(joinedTable.fieldsForSelect()));
			});
			
		} else {
		
			//console.log(`${this.#tableName} simpleList`, this.simpleList);
			if (this.simpleList.length > 0 && !allFields) {
				f = this.simpleList/*.join(',')*/;
			} else /*if (allFields)*/ {
				f = Object.keys(this.#fields);
			} /*else
				f = '*';*/

		}

		return f;
	}

	/**
	 * Receives a list of fields. Returns every one in the format: "tableName.fieldname AS tableName__fieldname"
	 */
	addAliasesToFields(fields) {
		let f;
		if (Array.isArray(fields))
			f = fields;
		else if (fields instanceof Map)
			f = Object.keys(fields);
		/*else {
			console.log(fields);
			console.log(typeof fields);
			console.log(fields instanceof Map);
			console.log(Object.prototype.toString.call(fields));
		}*/
		//console.log(`${this.#tableName} ${this.options?.alias}`);
		let t = this.#options?.alias || this.#tableName;

		return f.map(x => { return `${t}.${x} AS ${t}__${x}`; });
	}

	/**
	 * Define which fields are primary keys.
	 * @param {Array|String}	pks If the primary key is a single field only, it can be passed as string, otherwise as Array.
	 */
	setPrimaryKeys(pks) {
		let prKeysFields;
		if (typeof pks == 'string')
			prKeysFields = [pks];
		else
			prKeysFields = pks;
		
		if (!Array.isArray(prKeysFields))
			throw new Error("It's full of stars, and they names are:", prKeysFields);
		
		this.primaryKeys = prKeysFields;

		/*for (const [key, value] in this.#fields) {
			value.primaryKey = false;
			this.#fields.set(key, value);
		}*/
		for (const key in this.#fields)
			this.#fields[key].primaryKey = false;
		
		this.primaryKeys.forEach((o) => {
			if (!this.#fields[o])
				throw new Error(`${o}? That's no moon!`);
			/*let value = this.#fields.get(o);
			value.primaryKey = true;
			this.#fields.set(o, value);*/
			this.#fields[o].primaryKey = true;
		});
	}

	/**
	 * Define the list of fields to be used when executing most queries (SELECT).
	 * Define this list if there are fields in your table that aren't usually queried.
	 * @param {Array}	simpleList
	 */
	setSimpleList(simpleList) {
		if (!Array.isArray(simpleList))
			throw new Error("These are not cats:", simpleList);
		
		this.simpleList = simpleList;
		
		/*for (const [key, value] in this.#fields) {
			value.list = false;
			this.#fields.set(key, value);
		}*/
		for (const key in this.#fields)
			this.#fields[key].simpleList = false;
		
		this.simpleList.forEach((o) => {
			let value = this.#fields[o];
			if (!value)
				throw new Error(`Play it again, ${o}`);
			/*value.simpleList = true;
			  this.#fields.set(o, value);*/
			this.#fields[o].simpleList = true;
		});
	}

	static newField(f) {
		if (!f.name)
			throw new Error("No named dinosaur on aisle 7", f);

		let k = Object.keys(f);

		if (!k.primaryKey)
			f.primaryKey = false;

		if (!k.list)
			f.list = false;

		if (!k.type)
			f.type = 'string';
		
		return f;
	}

	/**
	 * Receives a row of data and adjusts (converts) every field type according to dictionary definitions.
	 */
	adjustRowForDatabase(row) {
		for (let k in row)
			row[k] = this.adjustFieldForDatabase(row[k], k);
		return row;
	}

	/**
	 * Receives a value and adjusts (converts) it according to dictionary definition of field.
	 */
	adjustFieldForDatabase(value, fieldname) {
		let result;
		try {
			if (typeof value != this.#fields[fieldname].type/*this.#fields.get(fieldname).type*/)
				switch (this.#fields[fieldname].type/*this.#fields.get(fieldname).type*/) {
				case 'string':
					result = value.toString();
					break;
				case 'number':
					let n = parseInt(value);
					if (isNaN(n))
						throw new Error(`arkDictionary ${this.#tableName} field ${fieldname} should be a number: ${value}`);
					result = n;
					break;
				case 'json':
					if (typeof value == 'object')
						result = JSON.stringify(value);
					else
						result = value;
					break;
				default:
					result = value;
				}
			else if (typeof value == 'object')
				result = JSON.stringify(value);
			else
				result = value;
		} catch(e) {
			console.error(fieldname, this.#fields/*.map(f => { return f.name }).join(',')*/ );
			console.error(e);
		}
			
		return result;
	}

	
}
