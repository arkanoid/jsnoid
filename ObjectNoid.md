# ObjectNoid

After installing you should use the script `noid/devnoid` to create some ObjectNoids.

## Ok, but what should I do now?

I suppose your application should have some sort of database access, Express routes that return pages with data from the database, and JavaScript classes to handle the records from the database. And you'll need to do some of these on client side, too.

One of the ObjectNoid types you can create is **NoidDB**. This one actually creates two objects. Let's say I have a database table called **Clients** and want to use it.

You'd use this command: `noid/devnoid create Clients NoidDB`

(You can of course create ObjectNoids starting with lowercase letters. Your preference.)

That command will create two files: `noid/csClients.js` e `noid/Clients.js`. The first one contains the data dictionary, the base object that represents a Client, and a NoidDataSource; all three can be used client side (hence the 'cs' in the file name). The second file contains the NoidDB object, is meant to be used server side only, together with the first file. Note that the server side only stuff expect a KnexJS object to connect to a database; you must provide that. Install [Knex.js](https://knexjs.org/), follow the documentation, `knex init` to make the default files, and so on.

Now you need to edit both files created and change/add whatever you need. Good luck.

# Noid types

The first one, **NoidDB**, was already commented above. Let's see some more details.

## NoidDB


