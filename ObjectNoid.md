# ObjectNoid

After installing you should use the script `noid/devnoid` to create some ObjectNoids.

## Ok, but what should I do now?

Ok, I suppose your application should have some sort of database access, Express routes that return pages with data from the database, and JavaScript classes to handle the records from the database. And you'll need to do some of these on client side, too.

One of the ObjectNoid types you can create is **NoidDB**. This one actually creates two objects. Let's say I have a database table called **Clients** and want to use it.

You'd use this command: `noid/devnoid create Clients NoidDB`

(You can of course create ObjectNoids starting with lowercase letters. Your preference.)

That command will create two files: 
