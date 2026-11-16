import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { listedValues, quoteText, renderDbml, typeName } from './generate-dbml.mjs';

test('quotes a note and escapes what would end it', () => {
	assert.equal(quoteText("where (kind = 'a')"), "'where (kind = \\'a\\')'");
});

test('quotes a type that is not a plain word', () => {
	assert.equal(typeName('text'), 'text');
	assert.equal(typeName('timestamp with time zone'), '"timestamp with time zone"');
	assert.equal(typeName('text[]'), '"text[]"');
});

test('lists the values a check allows', () => {
	assert.deepEqual(listedValues("CHECK ((kind = ANY (ARRAY['bug'::text, 'idea'::text])))"), {
		column: 'kind',
		values: ['bug', 'idea']
	});
	assert.equal(listedValues('CHECK ((year_from <= year_to))'), null);
});

test('renders tables, keys and references in a fixed order', () => {
	const column = (name, type, extra = {}) => ({
		name,
		type,
		notNull: false,
		default: null,
		identity: '',
		generated: '',
		...extra
	});
	const key = (name) => ({ column: name, expression: null, descending: false });
	const dbml = renderDbml({
		tables: [
			{
				name: 'b',
				rls: true,
				columns: [column('id', 'uuid', { notNull: true, default: 'gen_random_uuid()' })],
				indexes: [
					{
						name: 'b_pkey',
						unique: true,
						primary: true,
						constraint: true,
						where: null,
						keys: [key('id')]
					}
				],
				checks: []
			},
			{
				name: 'a',
				rls: false,
				columns: [
					column('b_id', 'uuid'),
					column('at', 'timestamp with time zone', { notNull: true })
				],
				indexes: [
					{
						name: 'a_b_id_idx',
						unique: false,
						primary: false,
						constraint: false,
						where: '(b_id IS NOT NULL)',
						keys: [key('b_id')]
					}
				],
				checks: []
			}
		],
		refs: [
			{
				name: 'a_b_id_fkey',
				table: 'a',
				target: 'b',
				columns: ['b_id'],
				targetColumns: ['id'],
				onDelete: 'c',
				onUpdate: 'a',
				deleteColumns: null
			}
		]
	});
	assert.ok(dbml.indexOf('Table a {') < dbml.indexOf('Table b {'));
	assert.match(dbml, /id uuid \[pk, default: `gen_random_uuid\(\)`\]/);
	assert.match(dbml, /at "timestamp with time zone" \[not null\]/);
	assert.match(dbml, /b_id \[name: 'a_b_id_idx', note: 'where \(b_id IS NOT NULL\)'\]/);
	assert.match(dbml, /Ref a_b_id_fkey: a\.b_id > b\.id \[delete: cascade\]/);
});
