import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildScript, transactionStatements, unwrapTest } from './db-try.mjs';

test('finds statements that end or start a transaction', () => {
	assert.deepEqual(transactionStatements('select 1; commit;'), ['commit']);
	assert.deepEqual(transactionStatements('begin;\nselect 1;\nrollback;'), ['begin', 'rollback']);
	assert.deepEqual(transactionStatements('select 1; start transaction;'), ['start transaction']);
	assert.deepEqual(transactionStatements('select 1;\nEND;'), ['end']);
});

test('ignores function bodies, strings, comments and savepoints', () => {
	const sql = `create function f() returns void language plpgsql as $$
begin
  perform 1;
end;
$$;
create function g() returns void language plpgsql as $body$ begin null; end; $body$;
select 'commit; begin';
-- rollback;
/* commit; */
savepoint a;
rollback to savepoint a;
select case when true then 1 end;`;
	assert.deepEqual(transactionStatements(sql), []);
});

test('unwraps a test from its own begin and last rollback', () => {
	const sql =
		"\\set ON_ERROR_STOP on\n\nbegin;\n\nselect 1;\nrollback to savepoint a;\n\nrollback;\n\n\\echo 'done'\n";
	const unwrapped = unwrapTest(sql);
	assert.deepEqual(transactionStatements(unwrapped), []);
	assert.match(unwrapped, /select 1;/);
	assert.match(unwrapped, /rollback to savepoint a;/);
	assert.match(unwrapped, /\\echo 'done'/);
});

test('builds one rolled-back transaction and refuses SQL that would end it', () => {
	const script = buildScript([{ label: 'a.sql', sql: 'select 1;' }]);
	assert.match(script, /^\\set ON_ERROR_STOP on\nbegin;\n/);
	assert.match(script, /rollback;\n$/);
	assert.throws(
		() => buildScript([{ label: 'b.sql', sql: 'select 1; commit;' }]),
		/b\.sql contains "commit"/
	);
});
