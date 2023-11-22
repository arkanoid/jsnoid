/**
 * Get all unique values in a JavaScript array (remove duplicates)
 * to be used on .filter() array
 */
export function arrayOnlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

export function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function capitalizeWords(s) {
	return s.split(' ').map(w => {
		if (w.length > 2)
			return capitalize(w);
		else
			return w;
	}).join(' ');
}

/**
 * @param {String}	label	Debug label in the format majorname:minorname
 * @return {Function}	If environment variable DEBUG is defined, the returned function accept this parameter:
 *		{Function} f	Function that returns text to be printed. Will only be evaluated if DEBUG environment variable matches label (same rules as npm debug module)
 */
export function makeDebug(label) {
	let makefunc = false, DEBUG;

	console.log(`makeDebug(${label})`);
	
	if (typeof process !== 'undefined' && process?.env?.DEBUG)
		DEBUG = DEBUG;

	if (DEBUG) {
		if (DEBUG.indexOf(':') < 0) {

			// DEBUG has no :
			if (label.substr(-2) == ':*') {
				let d = label.substr(0, label.length - 2);
				console.log(`DEBUG has no : but label ends with :* ${d} == ${DEBUG}`);
				makefunc = (d == DEBUG);
			} else {
				let d = label.substr(0, label.indexOf(':'));
				console.log(`DEBUG has no : but label has : ${d} == ${DEBUG}`);
				makefunc = (d == DEBUG);
			}

		} else if (DEBUG.substr(-2) == ':*') {

			// DEBUG ends with :*
			if (label.substr(-2) == ':*') {
				let d1 = label.substr(0, label.length - 2);
				let d2 = DEBUG.substr(0, DEBUG.length - 2);
				console.log(`DEBUG ends with :* and so does label ${d1} == ${d2} (full DEBUG is ${DEBUG})`);
				makefunc = (d1 == d2);
			} else {
				let d1 = label.substr(0, label.indexOf(':'));
				let d2 = DEBUG.substr(0, DEBUG.length - 2);
				console.log(`DEBUG ends with :* but label doesn't ${d1} == ${d2} (full DEBUG is ${DEBUG})`);
				makefunc = (d1 == d2);
			}
		} else {

			// DEBUG has :
			if (label.indexOf(':') >= 0) {
				console.log(`DEBUG has : ${DEBUG} == ${label}`);
				makefunc = (DEBUG == label);
			}
		}
	}

	if (makefunc) {
		return function (f) {
			console.log('\x1b[32mDebug:\x1b[0m', f());
		}
	} else
		return () => {};
}
