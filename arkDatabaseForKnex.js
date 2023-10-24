const debug = require('debug')('ark:db');

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


    /*
     * List @fields based on clause @where ordered by @order.
     * All parameters are optional. Default will list the entire table.
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
     * Adjusts a set of data before sending to Knex/Ajax.
     * @param {array} row Each field inside <row> is converted as appropriated (parseInt() for number, etc.)
     */
    adjustData(row, datadict) {
        let r = {};

        //for (var i in this.fields) {
		//datadict.forEach((f, i) => {
		//row.forEach((f, i) => {
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


	/**
	 * Inserts a new record into the database.
	 * @param fields Object with values
	 */
	insert(fields, datadict) {
		return this.knex(this.tableName).insert(
			(datadict ? this.adjustData(fields, datadict) : fields)
		);
	}

	/**
	 * Updates record.
	 * @param fields Object with values
	 * @param where Where function
	 */
	update(fields, datadict, where) {
		//return new Promise((resolve, reject) => {
		//console.log(datadict ? this.adjustData(fields, datadict) : fields);
		return this.knex(this.tableName).update(
			(datadict ? this.adjustData(fields, datadict) : fields)
		).where(where)
				//.then((r) => { resolve(r) })
				//.catch((err) => { reject(new Error(err)) });
		//})
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
	 * @param {Array|String}	primaryKeys (optional) Will be passed to the setPrimaryKeys() method.
	 * @param {Array|String}	simpleList (optional) Will be passed to the setSimpleList() method.
	 */
	constructor(tableName, fields, primaryKeys, simpleList) {
		this.#tableName = tableName;
		this.#fields = {};
		this.primaryKeys = [];
		this.simpleList = [];

		fields.forEach(o => {
			let f;
			if (typeof o == 'string')
				f = arkDataDictionary.newField({ name: o });
			else
				f = arkDataDictionary.newField(o);

			this.#fields[f.name] = f;

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

		for (i in this.#fields)
			this.#fields[i].primaryKey = false;
		
		this.primaryKeys.forEach((o) => {
			if (!this.#fields[o])
				throw new Error(`${o}? That's no moon!`);
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
		
		for (i in this.#fields)
			this.#fields[i].list = false;
		
		this.simpleList.forEach((o) => {
			if (!this.#fields[o])
				throw new Error(`Play it again, ${o}`);
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
		
		return f;
	}
}
