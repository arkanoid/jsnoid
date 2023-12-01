# class arkBaseDBClass

Used as base class for all database access classes. Usually those classes go under projectname/db in an Express project.

## constructor (knex, tableName)
Must pass a knex configuration object to constructor. This comes from the file that configures database Knex connection.
* **knex** (_object_): Knex configuration object.
* **tableName** (_string_): Name of the SQL table, for Knex use.

## findFirst (where, fields, callback) {
Returns first record to match the where clause.
* **where** (_object_): Used in WHERE clause. Same syntax as Knex .where() method.
* **fields** (_optional array_): Fields to return (will use '*' if not specified).
* **callback** (_optional function_): If specified, the resulting record will be passed through this function before being resolved.

# class arkDataDictionary

Used to keep data about database table structures and to help generate SQL statements. This class does not deal directly with the database nor Knex.

## constructor (tableName, fields, primaryKeys, simpleList, options)
Must pass a knex configuration object to constructor. This comes from the file that configures database Knex connection.
* **tableName** (_string_): Name of the SQL table.
* **fields** (_object_): List of fields. Object keys are field names and values are the database types. Basic example: { id: 'integer', name: 'string', age: 'smallint' }. The type can also be an array with the type and more parameters.
					Acceptable types and the formats they can be presented, separated by semicolons:
					'increments'; 'integer'; 'bigInteger'; 'tinyint'; 'smallint'; 'mediumint'; 'bigint'; 
					'text'; [ 'string', <length> ]; [ 'float', <precision>, <scale> ]; [ 'double', <precision>, <scale> ];
					'boolean'; 'date'; 'datetime'; 'timestamp'; [ 'binary', <length> ];
					[ 'enum', [ 'value1', ... ] ]; 'json'; 'jsonb'; 'uuid'
* **primaryKeys** (_optional array or string_): Will be passed to the (set) primaryKeys() method.
* **simpleList** (_optional array or string_): Will be passed to the (set) simpleList() method.
* **options** (_optional object_): List of options, listed below:
	* **alias** (_string_): Alias for tableName. Used when joining other tables.
	* **joins** (_array_): List of available joins. Each one is an object as below:
		* { foreignTable (_string_), onField (_string_), foreignOnField (_string_), relation (_optional string_)
		* Example: { foreignTable: 'products', onField 'product_id', foreignOnField: 'id', relation: '=' }

## set primaryKeys(pkeys)
Define which fields are primary keys.
* **pkeys** (_array or string_): If the primary key is a single field only, it can be passed as string, otherwise as Array.

## set simpleList(list)
Define the list of fields to be used when executing most queries (SELECT). Define this list if there are fields in your table that aren't usually queried.
When using methods to build SQL queries, unless you pass to the method a list of fields, this object will use this 'simple list' of fields. If this is not defined, then all fields will be used as default.
* **list** (_array_) List of field names.
