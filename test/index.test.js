import { strict as assert } from 'node:assert';
import test from 'node:test';
import { ObjectNoid } from '../index.js';

test('ObjectNoid.loadJson()', (t) => {
	let o = new ObjectNoid('o', './package.json');

	let data = o.getData();
	assert.ok(data.name === 'jsnoid', `data.name === ${data.name}`);
	/*
	console.log('testing');
	let data = o.name();
	console.log(`#name ${data}`);
	assert.ok(data === 'jsnoid', `o.name === ${data}`);
	*/
});
