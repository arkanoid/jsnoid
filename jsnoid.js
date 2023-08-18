#!/usr/bin/env node

const dev = (process.env.NODE_ENV === 'development');

import { stat, realpath, mkdir, open, write, close } from 'node:fs';



// Checks if ./bin exists
function alreadyBin() {
	realpath('.', null, alreadyBin_pwd);
}

function alreadyBin_pwd(err, p) {
	if (err)
		console.error(err);
	else {
		console.log('Running at:', p);
		console.log('Checking for a ./bin directory...');
		stat('./bin', alreadyBin_checked);
	}
}

function alreadyBin_checked(err, s) {
	if (err) {
		console.log('No ./bin directory detected. I\'m creating one.');
		mkdir('./bin', (err) => {
			console.error(err);
			process.exit(1);
		});
				
	} else {
		// bin exists
		console.log('./bin already exists.');
	}

	console.log('Checking for ./bin/devnoid...');
	stat('./bin/devnoid', alreadyBin_devnoidChecked);
};

function alreadyBin_devnoidChecked(err, s) {
	if (err) {
		console.error('No ./bin/devnoid , I\'m creating it');
		console.log('Next time you need to call jsnoid in dev mode you won\'t need to use the command line starting with NODE_ENV, just type ./bin/devnoid');
	
		open('./bin/devnoid', 'a', 0o750, alreadyBin_binOpened);

	} else {
		console.log('./bin/devnoid already exists.');
	}
}

function alreadyBin_binOpened(err, fd) {
	if (err) {
		console.error(err);
		process.exit(1);
	} else {
		write(fd, "#!/bin/bash\nexport NODE_ENV=development\nnode ./node_modules/jsnoid/jsnoid.js\n", null, null, (err, written, str) => {
			if (err) {
				console.error('Error writing ./bin/devnoid');
				console.error(err);
				process.exit(1);
			} else {
				close(fd, (err) => {
					if (err) {
						console.error('Error closing ./bin/devnoid');
						console.error(err);
						process.exit(1);
					} else {
						console.log('File created.');
						process.exit(0);
					}
				});
			}
		})
	}
}


function alreadyDevBin(doit) {
	if (doit) {
		
	} else {
		
	}
}

	if (dev)
		alreadyBin();
