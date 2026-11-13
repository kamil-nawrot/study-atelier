import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { symbolErrorMessage } from '#lib/symbols/errors/errors.ts';
import type { SymbolUse } from '#lib/symbols/types/symbol-use.ts';
import type { SymbolUseLabel } from '#lib/symbols/types/symbol-use-label.ts';

type UseRow = {
	symbol_meanings: { text: string; symbols: { id: string; name: string } };
};

type UsesResult = { uses: SymbolUse[]; error?: string };

function columnOf(label: SymbolUseLabel): [string, string] {
	if ('valueId' in label) return ['value_id', label.valueId];
	if ('eraCode' in label) return ['era_code', label.eraCode];
	return ['glossary_entry_id', label.glossaryEntryId];
}

export async function loadSymbolUses(label: SymbolUseLabel): Promise<UsesResult> {
	const [column, value] = columnOf(label);
	const { data, error } = await supabase
		.from('symbol_meaning_contexts')
		.select('symbol_meanings!inner(text, position, symbols!inner(id, name))')
		.eq(column, value);
	if (error) return { uses: [], error: await failureMessage(error, symbolErrorMessage) };
	const uses = (data as unknown as UseRow[]).map(({ symbol_meanings: meaning }) => ({
		symbolId: meaning.symbols.id,
		name: meaning.symbols.name,
		meaning: meaning.text
	}));
	return {
		uses: uses.sort(
			(first, second) =>
				first.name.localeCompare(second.name, 'pl') ||
				first.meaning.localeCompare(second.meaning, 'pl')
		)
	};
}
