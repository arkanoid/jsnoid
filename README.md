# jsnoid
Lazy javascript framework for Express web development.

## Disclaimer
I've wrote this because I'm not a real developer and I'm lazy. You shouldn't be using this. If you are, you're lazy. You should be using something professionally developed like [NestJS](https://nestjs.com/).

This is all intended for web development using Express and some Handlebars/Bootstrap for presentation, Knex for database access. All preferably done in the laziest way possible.

## What is this I don't even
This module consists mainly of three parts.

*Database components*. These are in the jsnoid/DatabaseForKnex module. Classes for helping accessing database with Knex.

*GUI components*. These go in the jsnoid/Components modules. Classes for controlling client side stuff. They expect an existing HTML page made with Bootstrap stuff. I do use Handlebars also but it's not mandatory.

*ObjectNoid*. This is an experiment with automatically building app stuff using the components above. This is mostly unfinished. But the two parts above can be used without it.

# Quick start

## Database components
Use `import { arkBaseDBClass, arkDataDictionary } from 'jsnoid/DatabaseForKnex'`

[jsnoid/DatabaseForKnex documentation](DatabaseForKnex.md)

## GUI components
You'll need to use jsnoid/Components from your browser somehow. I use [rollup.js](https://rollupjs.org/) to bundle the scripts I use on client side with jsnoid/Components.

[jsnoid/Components documentation](Components.md)

## ObjectNoid
Don't want to manually use the modules above? Daring to run unfinished code? Ok then.

1. Create your project with `npm init`, then add this package as a development dependency with `npm install -D git@github.com:arkanoid/jsnoid.git`

2. Then, assuming you just started your project and that there is no other file yet, at this point execute `NODE_ENV=development node_modules/jsnoid/jsnoid.js`

3. Use the script `noid/devnoid` to create and list Noid objects.

4. Read [ObjectNoid documentation](ObjectNoid.md).
