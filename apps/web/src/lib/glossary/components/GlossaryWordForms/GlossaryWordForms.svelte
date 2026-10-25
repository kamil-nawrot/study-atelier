<script lang="ts">
	import { untrack } from 'svelte';
	import { ValueField, type ValueOption } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
	import { cappedForms, SYNONYMS_MAX_COUNT } from '#lib/glossary/glossary/glossary.ts';
	import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
	import { fetchForms, suggestsForms } from '#lib/glossary/wiktionary/wiktionary.ts';
	import { formsWithout, synonymChanges, synonymKey } from '#lib/glossary/word-forms/word-forms.ts';
	import InflectionField, {
		type FormsOffer,
		type FormsStatus
	} from '#lib/glossary/components/InflectionField/InflectionField.svelte';

	type Props = {
		form: GlossaryDraft;
		existing?: GlossaryEntry;
	};

	let { form = $bindable(), existing }: Props = $props();

	const SEARCH_DELAY_MS = 600;

	let synonymsQuery = $state('');
	let formsQuery = $state('');
	let formsExpanded = $state(untrack(() => (existing?.forms.length ?? 0) === 0));
	let formsStatus = $state<FormsStatus>('idle');
	let formsAutoFilled = $state<string[] | null>(null);
	let formsName = $state<string | null>(untrack(() => existing?.name.trim() ?? null));
	let nameForms = $state<string[]>([]);
	let synonymForms = $state<Record<string, string[]>>({});
	let synonymMessage = $state<string>();
	let formsRequest = 0;
	let knownSynonyms = untrack(() => [...form.synonyms]);

	let synonymOptions = $derived(newOption(synonymsQuery, form.synonyms));
	let formOptions = $derived(newOption(formsQuery, form.forms));
	let formsEligible = $derived(suggestsForms(form.name, form.category));
	let formsShownStatus = $derived<FormsStatus>(
		form.name.trim() && form.category && !formsEligible ? 'skipped' : formsStatus
	);
	let formsOffer = $derived.by((): FormsOffer | undefined => {
		if (!formsEligible) return undefined;
		const renamed =
			formsName !== null &&
			formsName.toLocaleLowerCase('pl') !== form.name.trim().toLocaleLowerCase('pl');
		if (form.forms.length === 0)
			return (existing || !autoFetch.forms) && (formsStatus === 'idle' || renamed)
				? 'fetch'
				: undefined;
		if (!existing && autoFetch.forms && formsReplaceable()) return undefined;
		return renamed ? 'refetch' : undefined;
	});

	function newOption(query: string, values: readonly string[]): ValueOption[] {
		const typed = query.replace(/\s+/g, ' ').trim();
		const key = typed.toLocaleLowerCase('pl');
		if (!typed || key === form.name.trim().toLocaleLowerCase('pl')) return [];
		if (values.some((item) => item.toLocaleLowerCase('pl') === key)) return [];
		return [{ kind: 'new', name: typed }];
	}

	function formsReplaceable(): boolean {
		return (
			form.forms.length === 0 ||
			(formsAutoFilled !== null && JSON.stringify(form.forms) === JSON.stringify(formsAutoFilled))
		);
	}

	function setForms(forms: string[]): void {
		const wasReplaceable = formsReplaceable();
		form.forms = cappedForms(forms);
		if (wasReplaceable) formsAutoFilled = form.forms;
	}

	async function suggestForms(): Promise<void> {
		const name = form.name.trim();
		if (!suggestsForms(name, form.category)) return;
		const current = ++formsRequest;
		formsStatus = 'searching';
		synonymMessage = undefined;
		const words = form.synonyms.filter((word) => suggestsForms(word, form.category));
		try {
			const [found, ...synonyms] = await Promise.all(
				[name, ...words].map((word) => fetchForms(word))
			);
			if (current !== formsRequest) return;
			nameForms = found;
			synonymForms = Object.fromEntries(words.map((word, i) => [synonymKey(word), synonyms[i]]));
			form.forms = cappedForms([...found, ...synonyms.flat()]);
			formsAutoFilled = form.forms;
			formsName = name;
			formsStatus = form.forms.length > 0 ? 'found' : 'none';
			if (form.forms.length > 0) formsExpanded = false;
		} catch {
			if (current !== formsRequest) return;
			formsStatus = 'failed';
		}
	}

	async function addSynonymForms(word: string): Promise<void> {
		if (!suggestsForms(word, form.category)) return;
		const key = synonymKey(word);
		synonymMessage = m.glossary.form.synonymFormsSearching(word);
		try {
			const found = await fetchForms(word);
			if (!form.synonyms.some((synonym) => synonymKey(synonym) === key)) return;
			synonymForms = { ...synonymForms, [key]: found };
			setForms([...form.forms, ...found]);
			synonymMessage = found.length > 0 ? undefined : m.glossary.form.synonymFormsNone(word);
		} catch {
			synonymMessage = m.glossary.form.formsFailed;
		}
	}

	function dropSynonymForms(word: string): void {
		const key = synonymKey(word);
		const dropped = synonymForms[key];
		if (!dropped) return;
		const rest = Object.fromEntries(
			Object.entries(synonymForms).filter(([synonym]) => synonym !== key)
		);
		synonymForms = rest;
		setForms(formsWithout(form.forms, dropped, [nameForms, ...Object.values(rest)]));
		synonymMessage = undefined;
	}

	$effect(() => {
		const current = [...form.synonyms];
		untrack(() => {
			const { removed, added } = synonymChanges(knownSynonyms, current);
			knownSynonyms = current;
			removed.forEach(dropSynonymForms);
			if (autoFetch.forms) added.forEach((word) => void addSynonymForms(word));
		});
	});

	$effect(() => {
		if (existing) return;
		const name = form.name.trim();
		const category = form.category;
		if (!name || !category) return;
		if (!suggestsForms(name, category)) {
			untrack(() => {
				formsRequest += 1;
				formsStatus = 'idle';
				if (formsAutoFilled !== null && formsReplaceable()) {
					form.forms = [];
					formsAutoFilled = null;
				}
			});
			return;
		}
		if (!autoFetch.forms) return;
		const timer = setTimeout(() => {
			if (untrack(formsReplaceable)) void suggestForms();
		}, SEARCH_DELAY_MS);
		return () => clearTimeout(timer);
	});
</script>

<ValueField
	hint={form.synonyms.length >= SYNONYMS_MAX_COUNT
		? m.glossary.form.synonymsFull
		: m.glossary.form.synonymsHint}
	label={m.glossary.form.synonyms}
	max={SYNONYMS_MAX_COUNT}
	options={synonymOptions}
	bind:query={synonymsQuery}
	bind:values={form.synonyms}
/>

<InflectionField
	message={formsStatus === 'searching' ? undefined : synonymMessage}
	offer={formsOffer}
	onfetch={suggestForms}
	options={formOptions}
	status={formsShownStatus}
	bind:expanded={formsExpanded}
	bind:forms={form.forms}
	bind:query={formsQuery}
/>
