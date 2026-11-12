import { strict as assert } from 'node:assert';
import path from 'node:path';
import { test } from 'node:test';
import { folderFor, mergedBranchIsSafeToDelete } from './worktree.mjs';

const main = path.join(path.sep, 'work', 'study-atelier');

test('names the folder after the issue key, or the branch without one', () => {
	assert.equal(
		folderFor(main, 'feature/atl-12-list'),
		path.join(path.sep, 'work', 'study-atelier-atl-12')
	);
	assert.equal(
		folderFor(main, 'hotfix/0.21.4'),
		path.join(path.sep, 'work', 'study-atelier-hotfix-0-21-4')
	);
});

test('gives a second branch of the same issue its own folder', () => {
	const taken = [
		{ dir: path.join(path.sep, 'work', 'study-atelier-atl-676'), branch: 'bugfix/atl-676-order' }
	];
	assert.equal(
		folderFor(main, 'bugfix/atl-676-bars', taken),
		path.join(path.sep, 'work', 'study-atelier-atl-676-bars')
	);
	assert.equal(
		folderFor(main, 'bugfix/atl-676-order', taken),
		path.join(path.sep, 'work', 'study-atelier-atl-676')
	);
});

test('deletes a merged branch only when it has nothing the pull request lacks', () => {
	const ancestors = new Set(['a:b']);
	const isAncestor = (commit, head) => ancestors.has(`${commit}:${head}`);
	assert.equal(mergedBranchIsSafeToDelete('b', ['b'], isAncestor), true);
	assert.equal(mergedBranchIsSafeToDelete('a', ['b'], isAncestor), true);
	assert.equal(mergedBranchIsSafeToDelete('c', ['b'], isAncestor), false);
	assert.equal(mergedBranchIsSafeToDelete('c', [], isAncestor), false);
});
