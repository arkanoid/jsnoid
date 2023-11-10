import { makeDebug } from './smallfuncs.js';
const debug = makeDebug('ark:db');

export class arkBaseDBClass {
    /**
     * Must pass a knex configuration object to constructor. This comes from the file that configures database Knex connection.
     * 
     * @param knex Knex configuration
     * @param tableName Name of the SQL table, for Knex use
     * @param (optional) dictionary Object from class arkDataDictionary with metadata about the table fields.
     */
    constructor(knex, tableName, dictionary) {
		this.knex = knex
		this.tableName = tableName
		this.dictionary = dictionary
    }
	
    /**
     * Returns first record to match fields
     * @param {Object}	where	Used in WHERE clause, using Knex.js syntax.
     * @param {Array}	fields(optional)	Array of which fields to return (will return '*' if not specified).
	 * @param {Function}	callback(optional)	Processes the record object.
	 * @param {Array}	joins(optional) List of joins to use, in this format:
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
     * Adjusts a set of data before sending to Knex/Ajax.
     * @param {array} row Each field inside <row> is converted as appropriated (parseInt() for number, etc.)
     */
    /*adjustData(row) {
        let r = {};
		let datadict = this.dictionary;

		for (let i in row) {
            if (datadict[i]) {
                switch (datadict[i].type) {
                case 'number':
                    let n = parseInt(row[i]);
                    if (isNaN(n))
                        console.error(`Blue dinosaur named ${i} isn't blue`);
                    else
                        r[i] = n;
                    break;
                case 'boolean':
                    switch (row[i].toLowerCase()) {
                    case 'true':
                        r[i] = true;
                        break;
                    case 'false':
                        r[i] = false;
                        break;
                    default:
						let msg = `${i} should be boolean: ${data[i]}`;
                        console.error(msg);
                        throw new Error(msg);
                    }
                    break;
				case 'json':
					if (typeof row[i] != 'string')
						r[i] = JSON.stringify(row[i])
					else
						r[i] = row[i]
					//console.log('arkBaseDBClass adjustData json ', r);
					break;
                default:
                    r[i] = row[i];
                }
				if (row[i].canBeNull && typeof r[i] !== 'boolean' && !r[i])
					r[i] = null;
            }
        }
		return r;
	}
	*/
	

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


export class arkDataDictionary {
	#tableName;
	#fields;
	primaryKeys;
	simpleList;
	
	/**
	 * @param {String}	tableName Name of the SQL table
	 * @param {Array}	List of fields. Each item can be just a string (field name and nothing more) or an object with more data about the field.
	 *					Expected object format: { name, type }
	 *					name Should be the same name of the database field.
	 *					type One of those: string, number, json
	 * @param {Array|String}	primaryKeys (optional) Will be passed to the setPrimaryKeys() method.
	 * @param {Array|String}	simpleList (optional) Will be passed to the setSimpleList() method.
	 */
	constructor(tableName, fields, primaryKeys, simpleList) {
		this.#tableName = tableName;
		this.#fields = new Map;
		this.primaryKeys = [];
		this.simpleList = [];

		fields.forEach(o => {
			let f;
			if (typeof o == 'string')
				f = arkDataDictionary.newField({ name: o });
			else
				f = arkDataDictionary.newField(o);

			this.#fields.set(f.name, f);

			if (f.primaryKey)
				this.primaryKeys.push(f.name);

			if (f.list)
				this.simpleList.push(f.name);
		});
	}

	/**
	 * Returns a string with field list for use in a SQL SELECT clause. For use by the list() method of arkBaseDBClass. If all fields are eligible, then returns '*'.
	 */
	fieldsForSelect() {
		let f;
		if (this.simpleList.length > 0)
			f = this.simpleList.join(',');
		else
			f = '*';

		return f;
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

		for (const [key, value] in this.#fields) {
			value.primaryKey = false;
			this.#fields.set(key, value);
		}
		
		this.primaryKeys.forEach((o) => {
			if (!this.#fields.get(o))
				throw new Error(`${o}? That's no moon!`);
			let value = this.#fields.get(o);
			value.primaryKey = true;
			this.#fields.set(o, value);
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
		
		for (const [key, value] in this.#fields) {
			value.list = false;
			this.#fields.set(key, value);
		}
		
		this.simpleList.forEach((o) => {
			let value = this.#fields.get(o);
			if (!value)
				throw new Error(`Play it again, ${o}`);
			value.simpleList = true;
			this.#fields.set(o, value);
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
		if (typeof value != this.#fields.get(fieldname).type)
			switch (this.#fields.get(fieldname).type) {
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

		return result;
	}

	
}
