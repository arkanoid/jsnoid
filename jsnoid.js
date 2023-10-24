#!/usr/bin/env node

const dev = (process.env.NODE_ENV === 'development');
import { stat, realpath, mkdir, open, write, close, readdir } from 'node:fs';
import * as jsnoid from 'jsnoid';

let result_first_checks = '';

// Checks if ./bin exists
function alreadyNoid() {
	realpath('.', null, alreadyNoid_pwd);
}
function alreadyNoid_pwd(err, p) {
	if (err)
		console.error(err);
	else {
		result_first_checks += `Running at: ${p}\n`;
		result_first_checks += `If you're running out of the correct directory (your project), exit now and run again in the right directory.\n`;
		//ask('Continue');
		result_first_checks += `Checking for a ./noid directory...\n`;
		stat('./noid', alreadyNoid_checked);
	}
}
function alreadyNoid_checked(err, s) {
	if (err) {
		console.log(result_first_checks);
		console.log('No ./noid directory detected. I\'m creating one.');
		mkdir('./noid', (err) => {
			console.error(err);
			process.exit(1);
		});
				
	} else {
		// bin exists
		result_first_checks += `\n./noid already exists.\n`;
	}

	result_first_checks += `Checking for ./noid/devnoid...\n`;
	stat('./noid/devnoid', alreadyNoid_devnoidChecked);
};
function alreadyNoid_devnoidChecked(err, s) {
	if (err) {
		console.log(result_first_checks);
		result_first_checks = '';
		console.error('No ./noid/devnoid , I\'m creating it');
		console.log('Next time you need to call jsnoid (in dev mode) you won\'t need to use the command line starting with NODE_ENV, just type ./noid/devnoid');
	
		open('./noid/devnoid', 'a', 0o750, alreadyNoid_noidOpened);

	} else {
		result_first_checks += `./noid/devnoid already exists.\n`;
	}
}
function alreadyNoid_noidOpened(err, fd) {
	if (err) {
		console.error(err);
		process.exit(2);
	} else {
		write(fd, "#!/bin/bash\nexport NODE_ENV=development\nnode ./node_modules/jsnoid/jsnoid.js $*\n", null, null, (err, written, str) => {
			if (err) {
				console.error('Error writing ./noid/devnoid');
				console.error(err);
				process.exit(3);
			} else {
				close(fd, (err) => {
					if (err) {
						console.error('Error closing ./noid/devnoid');
						console.error(err);
						process.exit(4);
					} else {
						console.log(result_first_checks);
						result_first_checks = '';
						console.log('File created.');
						console.log('NOTE: if you\'ve not done it yet, add yargs to your list of modules.');
						console.log('Ex:');
						console.log('  npm install -D yargs');
						process.exit(0);
					}
				});
			}
		})
	}
}



// checks if ./noid/devnoid already exists
alreadyNoid();

if (!dev) {
	console.log('Run this in development mode.');
	process.exit(0);
}



/*
 * At this point, we guaranteed that ./bin/devnoid exists.
 */
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import ObjectNoid from './ObjectNoid.js';

if (process.argv.length == 2)
	process.argv.push('--help');

yargs(hideBin(process.argv))
	.usage('$0 <cmd> [args]')
	.command('list [objectname]', 'List ObjectNoid definition, or list all ObjectNoids if none specified', (yargs) => {
		return yargs
			.positional('objectname', {
				describe: 'Name of the ObjectNoid',
				default: ''
			})
	}, (argv) => {
		if (argv.objectname) {
			console.log(`Listing ObjectNoid:${argv.objectname}`);
			let O = new ObjectNoid(argv.objectname);
			console.log('jsnoid, new ON is', O.data);
			//O.addData({ teste: 'testando', valor: 213 }, 'object');
		} else {
			console.log('Listing all ObjectNoid names:');
			readdir('./noid/', (err, files) => {
				let noids = listDirNoid(err, files);
				noids.forEach(f => {
					console.log(f);
				});
			});
		}
	})
	.command('create [objectname] [origin] [datatype] [mode]', 'Create a new ObjectNoid.', (yargs) => {
		return yargs
			.positional('objectname', {
				describe: 'Name for the new ObjectNoid. A file named <objectname>.json will be created inside ./noid/ directory',
				default: 'defaults'
			})
			.positional('origin', {
				describe: `Where the data comes from. Options:\n`
					+ `restful: AJAX query. URL should be stated in [data] parameter.\n`
					+ `noid: Another ObjectNoid. Object name should be stated in [data] parameter.\n`
					+ `data: Random data.`,
				default: 'data'
			})
			.positional('datatype', {
				describe:  `Parameter for [origin]. What it means for every value of [origin]:\n`
					+ `restful: URL.\n`
					+ `noid: Another ObjectNoid name No default, this *must* be specified.`
					+ `\ndata: string, name of some structured data ('Array', 'Object', 'Map', etc.). Default is map.`,
				default: '/'
			})
			.positional('mode', {
				describe: 'For restful origin, \'single\' or \'several\'; just one record or an array of them. Unused for other origins.',
				default: 'several'
			})
	}, (argv) => {
		try {
			if (argv.verbose)
				console.info(`Creating ObjectNoid on: /noid/${argv.objectname}.json`)

			let O = new ObjectNoid(argv.objectname, null, argv.origin, argv.datatype, argv.mode);
			
			console.log(`Object ${argv.objectname} created.`);
		} catch(e) {
			console.error(e);
		}
	})
	.option('verbose', {
		alias: 'v',
		type: 'boolean',
		description: 'Run with verbose logging'
	})
//.parse();
	.help()
	.argv;


/**
 * Returns list of all .noid files received in the argument list.
 * @param	{Array}	files	List received by node:fs.readdir
 * @return	{Array}	List of ObjectNoid names (file names inside /noid directory, without the .json suffix)
 */
function listDirNoid(err, files) {
	if (err) {
		console.log('Error consulting /noid directory for .json files (readdir)');
		console.error(err);
		process.exit(2);
	} else {
		let noids = [];
		files.forEach(f => {
			if (f.length > 5 && f.substr(f.length - 5) == '.json')
				noids.push(f.substr(0, f.length - 5));
		});
		return noids;
	}
}
