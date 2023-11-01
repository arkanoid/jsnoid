# jsnoid
Lazy javascript framework for Express/Knex with Bootstrap web development.

## Disclaimer
I've wrote this because I'm not a real developer and I'm lazy. You shouldn't be using this. If you are, you're lazy.

Also there probably are thousands of other modules out there way better than the code I write.

This is all intended for web development using Express and some Handlebars/Bootstrap for presentation, Knex for database access. All preferably done in the laziest way possible.

## What is this I don't even
This module consists mainly of three parts.

*Database components*. These are in the arkDatabaseForKnex part. Classes for helping accessing database with Knex. Server side stuff.

*GUI components*. These go in the arkComponents part. Classes for controlling client side stuff. They expect an existing HTML page made with Bootstrap stuff. I do use Handlebars also but it's not mandatory.

*ObjectNoid*. This is an experiment with automatically building app stuff using the components above. This is mostly unfinished. But the two parts above can be used without it.

# Quick start

## Database components
Use `import { arkBaseDBClass, arkDataDictionary } from 'jsnoid'`

## GUI components
You'll need to use arkComponents.js from your browser somehow.

## ObjectNoid
Daring to run unfinished code? Ok then.

1. Create your project with `npm init`, then add this package as a development dependency with `npm install -D git@github.com:arkanoid/jsnoid.git`

2. Then, assuming you just started your project and that there is no other file yet, at this point execute `NODE_ENV=development node_modules/jsnoid/jsnoid.js`

