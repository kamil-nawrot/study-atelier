import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { indexProblems, parseIndex, renderIndex } from './adr-index.mjs';

const index = `# Decisions

## Areas

- \`wall\`: the wall
- \`process\`: how work flows

## Index

| # | Decision | Area | Status |
| --- | --- | --- | --- |
| [0001](0001-a.md) | Record decisions | process | accepted |
| [0002](0002-b.md) | Order the wall | wall | accepted |

Trailing text.`;

const adrs = [
	{ number: '0001', file: '0001-a.md', title: 'Record decisions', status: 'accepted' },
	{
		number: '0002',
		file: '0002-b.md',
		title: 'Order the wall',
		status: 'accepted; partly superseded by [0003](0003-c.md)'
	},
	{ number: '0003', file: '0003-c.md', title: 'Group the wall', status: 'accepted' }
];

test('reads the areas and the rows of the index', () => {
	const { areas, rows } = parseIndex(index);
	assert.deepEqual(areas, ['wall', 'process']);
	assert.deepEqual(rows.get('0002'), {
		file: '0002-b.md',
		title: 'Order the wall',
		area: 'wall',
		status: 'accepted'
	});
});

test('reports a status that differs from the ADR, a missing ADR and an unknown area', () => {
	const problems = indexProblems(
		index.replace('| wall | accepted |', '| walls | accepted |'),
		adrs
	);
	assert.ok(problems.some((problem) => problem.includes('ADR 0002: the status differs')));
	assert.ok(problems.some((problem) => problem.includes('"walls" is not one of the areas')));
	assert.ok(problems.some((problem) => problem.includes('0003-c.md: missing from')));
});

test('rewrites titles and statuses from the ADRs, keeps areas and adds new ADRs with "?"', () => {
	const rendered = renderIndex(index, adrs);
	assert.match(
		rendered,
		/\| \[0002\]\(0002-b\.md\) \| Order the wall \| wall \| accepted; partly superseded by \[0003\]\(0003-c\.md\) \|/
	);
	assert.match(rendered, /\| \[0003\]\(0003-c\.md\) \| Group the wall \| \? \| accepted \|/);
	assert.match(rendered, /Trailing text\.$/);
	const fixed = rendered.replace('| ? |', '| wall |');
	assert.deepEqual(indexProblems(fixed, adrs), []);
});
