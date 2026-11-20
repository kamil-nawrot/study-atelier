<script lang="ts">
	import { Alert, Button, Dialog, SearchSelect, TextArea, TextButton } from '@study-atelier/ui';
	import { loupeLevel } from '#lib/images/loupe/loupe.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
	import type { GlossaryKind } from '#lib/glossary/types/glossary-kind.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { Fraction } from '#lib/pins/types/fraction.ts';
	import { createPin, deletePin, pinDraftError, updatePin } from '#lib/pins/pin-data/pin-data.ts';
	import type { Pin } from '#lib/pins/types/pin.ts';
	import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';
	import { MAX_PIN_TEXT } from '#lib/pins/pin-limits/pin-limits.ts';
	import { MAX_MEANINGS } from '#lib/symbols/symbol-draft/symbol-draft.ts';
	import PinView from '#lib/pins/components/PinView/PinView.svelte';

	type Props = {
		open?: boolean;
		imageId: string;
		pin?: Pin;
		spot: Fraction;
		entries: readonly GlossaryTerm[];
		symbols?: readonly SymbolOption[];
		image?: ArtworkImageInput | null;
		view?: number;
		shownWidth?: number;
		onnewterm?: (name: string, kind: GlossaryKind) => Promise<GlossaryTerm | undefined>;
		onnewsymbol?: (name: string) => Promise<SymbolOption | undefined>;
		onaddmeaning?: (
			symbolId: string,
			position: number,
			text: string
		) => Promise<{ id?: string; error?: string }>;
		onsaved: (pin: Pin) => void;
		ondeleted: (pin: Pin) => void;
	};

	let {
		open = $bindable(false),
		imageId,
		pin,
		spot,
		entries,
		symbols = [],
		onnewterm,
		onnewsymbol,
		onaddmeaning,
		image,
		view,
		shownWidth,
		onsaved,
		ondeleted
	}: Props = $props();

	const NEW_MEANING = '\u0000new';

	let entryId = $state<string | null>(null);
	let symbolId = $state<string | null>(null);
	let meaningId = $state('');
	let newMeaning = $state('');
	let text = $state('');
	let viewWidth = $state<number>();
	let failure = $state<string>();
	let failureTitle = $state(m.pins.errorTitle);
	let busy = $state<'saving' | 'deleting'>();
	let addedTerms = $state.raw<GlossaryTerm[]>([]);
	let addedSymbols = $state.raw<SymbolOption[]>([]);

	let allTerms = $derived([
		...entries,
		...addedTerms.filter((term) => !entries.some((entry) => entry.id === term.id))
	]);
	let allSymbols = $derived([
		...addedSymbols.filter((added) => !symbols.some((symbol) => symbol.id === added.id)),
		...symbols
	]);
	let options = $derived(
		allTerms
			.map((entry) => ({ value: entry.id, label: entry.name }))
			.sort((first, second) => first.label.localeCompare(second.label, 'pl'))
	);
	let symbolOptions = $derived(
		allSymbols
			.map((symbol) => ({ value: symbol.id, label: symbol.name }))
			.sort((first, second) => first.label.localeCompare(second.label, 'pl'))
	);
	let meanings = $derived(allSymbols.find((symbol) => symbol.id === symbolId)?.meanings ?? []);
	let meaningOptions = $derived([
		...meanings.map(({ id, text }) => ({ value: id, label: text })),
		...(meaningId === NEW_MEANING ? [{ value: NEW_MEANING, label: newMeaning }] : [])
	]);
	let canAddMeaning = $derived(onaddmeaning !== undefined && meanings.length < MAX_MEANINGS);

	$effect(() => {
		if (!open) return;
		entryId = pin?.glossaryEntryId ?? null;
		symbolId = pin?.symbolId ?? null;
		meaningId = pin?.symbolMeaningId ?? '';
		newMeaning = '';
		text = pin?.text ?? '';
		viewWidth = pin ? pin.viewWidth : view;
		failure = undefined;
		busy = undefined;
	});

	function chooseSymbol(value: string | null): void {
		if (value !== symbolId) meaningId = '';
		symbolId = value;
		const only = allSymbols.find((symbol) => symbol.id === value)?.meanings ?? [];
		if (value && !meaningId && only.length === 1) meaningId = only[0].id;
	}

	function chooseMeaning(value: string | null): void {
		meaningId = value ?? '';
		if (value !== NEW_MEANING) newMeaning = '';
	}

	function addMeaning(query: string): void {
		newMeaning = query.trim();
		meaningId = NEW_MEANING;
	}

	let termActions = $derived(
		onnewterm
			? [
					{ label: m.pins.createTerm, onselect: (name: string) => newTerm(name, 'term') },
					{ label: m.pins.createFigure, onselect: (name: string) => newTerm(name, 'figure') }
				]
			: []
	);

	async function newTerm(name: string, kind: GlossaryKind): Promise<void> {
		const term = await onnewterm?.(name, kind);
		if (!term) return;
		addedTerms = [...addedTerms, term];
		entryId = term.id;
	}

	async function newSymbol(name: string): Promise<void> {
		const symbol = await onnewsymbol?.(name);
		if (!symbol) return;
		addedSymbols = [...addedSymbols, symbol];
		chooseSymbol(symbol.id);
	}

	async function storeMeaning(): Promise<string | null | undefined> {
		if (meaningId !== NEW_MEANING) return meaningId || null;
		if (!symbolId || !onaddmeaning) return null;
		const result = await onaddmeaning(symbolId, meanings.length, newMeaning);
		if (result.error || !result.id) {
			failureTitle = m.pins.errorTitle;
			failure = result.error ?? m.common.unexpectedError;
			return undefined;
		}
		const stored = { id: result.id, text: newMeaning };
		addedSymbols = allSymbols.map((symbol) =>
			symbol.id === symbolId ? { ...symbol, meanings: [...symbol.meanings, stored] } : symbol
		);
		meaningId = result.id;
		newMeaning = '';
		return result.id;
	}

	async function submit(): Promise<void> {
		if (busy) return;
		const draft = {
			x: pin?.x ?? spot.x,
			y: pin?.y ?? spot.y,
			glossaryEntryId: entryId,
			symbolId,
			symbolMeaningId: null as string | null,
			text,
			...(viewWidth !== undefined ? { viewWidth } : {})
		};
		failureTitle = m.pins.errorTitle;
		failure = pinDraftError(draft);
		if (failure) return;
		busy = 'saving';
		const storedMeaning = await storeMeaning();
		if (storedMeaning === undefined) {
			busy = undefined;
			return;
		}
		draft.symbolMeaningId = storedMeaning;
		const result = pin ? await updatePin(pin.id, draft) : await createPin(imageId, draft);
		busy = undefined;
		if (result.error || !result.pin) {
			failure = result.error;
			return;
		}
		open = false;
		onsaved(result.pin);
	}

	async function remove(): Promise<void> {
		if (!pin || busy) return;
		busy = 'deleting';
		failure = undefined;
		const { error } = await deletePin(pin.id);
		busy = undefined;
		if (error) {
			failureTitle = m.pins.deleteErrorTitle;
			failure = error;
			return;
		}
		open = false;
		ondeleted(pin);
	}
</script>

<Dialog title={pin ? m.pins.title : m.pins.newTitle} bind:open>
	<div class="fields">
		{#if failure}
			<Alert title={failureTitle} tone="danger">
				{failure}
			</Alert>
		{/if}
		{#if image && viewWidth !== undefined}
			<figure class="view">
				<PinView {image} {viewWidth} x={pin?.x ?? spot.x} y={pin?.y ?? spot.y} />
				<figcaption class="caption">
					{m.pins.view(shownWidth ? m.loupe.level(loupeLevel(viewWidth, shownWidth)) : undefined)}
					{#if pin}
						<TextButton onclick={() => (viewWidth = undefined)}>{m.pins.removeView}</TextButton>
					{/if}
				</figcaption>
			</figure>
		{/if}
		<SearchSelect
			create={termActions}
			label={m.pins.term}
			{options}
			placeholder={m.pins.termPlaceholder}
			bind:value={entryId}
		/>
		{#if allSymbols.length > 0 || onnewsymbol}
			<SearchSelect
				create={onnewsymbol ? [{ label: m.symbols.pin.create, onselect: newSymbol }] : []}
				label={m.pins.symbol}
				options={symbolOptions}
				placeholder={m.symbols.search}
				bind:value={() => symbolId, chooseSymbol}
			/>
			{#if symbolId && (meanings.length > 0 || canAddMeaning)}
				<SearchSelect
					create={canAddMeaning
						? [{ label: m.symbols.pin.createMeaning, onselect: addMeaning }]
						: []}
					hint={meaningId === NEW_MEANING ? m.symbols.pin.newMeaningNote : undefined}
					label={m.pins.symbolMeaning}
					options={meaningOptions}
					placeholder={m.symbols.pin.meaningPlaceholder}
					bind:value={() => meaningId || null, chooseMeaning}
				/>
			{/if}
		{/if}
		<TextArea counter label={m.pins.text} maxlength={MAX_PIN_TEXT} rows={4} bind:value={text} />
	</div>
	{#snippet footer()}
		{#if pin}
			<Button disabled={busy !== undefined} onclick={remove} variant="danger">
				{busy === 'deleting' ? m.common.deleting : m.common.delete}
			</Button>
		{/if}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={busy !== undefined} onclick={submit} variant="primary">
			{busy === 'saving' ? m.common.saving : m.common.save}
		</Button>
	{/snippet}
</Dialog>

<style>
	.fields {
		display: grid;
		gap: var(--spacing-4);
	}

	.view {
		display: grid;
		justify-items: center;
		gap: var(--spacing-2);
		margin: 0;
	}

	.view .caption {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-3);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
