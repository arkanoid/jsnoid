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
