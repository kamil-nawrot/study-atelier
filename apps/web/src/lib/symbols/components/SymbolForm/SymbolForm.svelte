<script lang="ts">
	import { untrack } from 'svelte';
	import { Button, Form, FormActions, TextArea, TextField } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/i18n.ts';
	import DiscardDialog from '#lib/shared/forms/DiscardDialog/DiscardDialog.svelte';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';
	import { LiveErrors } from '#lib/shared/forms/live-errors/live-errors.svelte.ts';
	import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
	import MeaningInputs from '#lib/symbols/components/MeaningInputs/MeaningInputs.svelte';
	import {
		emptySymbolDraft,
		meaningsToSave,
		SYMBOL_DESCRIPTION_MAX_LENGTH,
		SYMBOL_NAME_MAX_LENGTH,
		symbolDraftChanged,
		symbolDraftOf
	} from '#lib/symbols/symbol-draft/symbol-draft.ts';
	import { saveSymbol } from '#lib/symbols/symbols-data/symbols-data.ts';
	import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';
	import type { SymbolDraft } from '#lib/symbols/types/symbol-draft.ts';
	import type { SymbolEntry } from '#lib/symbols/types/symbol-entry.ts';

	type Props = {
		symbol?: SymbolEntry;
		candidates: readonly SymbolContext[];
		cancelHref: string;
		oncancel?: (event: MouseEvent) => void;
		onsaved: (path: ResolvedPathname, message: string) => void | Promise<void>;
	};

	let { symbol, candidates, cancelHref, oncancel, onsaved }: Props = $props();

	const existing = untrack(() => symbol);
	const initial = (): SymbolDraft => (existing ? symbolDraftOf(existing) : emptySymbolDraft());

	let form = $state<SymbolDraft>(initial());

	const formState = new FormState<SymbolDraft>(initial());
	const changes = new UnsavedChanges(
		() => $state.snapshot(form) as SymbolDraft,
		() => formState.saved,
		symbolDraftChanged
	);

	export function confirmLeave(): Promise<boolean> {
		return changes.confirmLeave();
	}

	const errors = new LiveErrors<Record<string, string | undefined>>(() => ({
		name: form.name.trim() ? undefined : m.valueForm.nameRequired,
		...Object.fromEntries(
			form.meanings.map((meaning) => [
				meaning.key,
				meaning.text.trim() === '' && meaning.contexts.length > 0
					? m.symbols.form.meaningRequired
					: undefined
			])
		)
	}));

	function submit(): Promise<void> {
		return formState.run(async () => {
			const name = form.name.trim();
			if (!errors.check()) return;
			const snapshot = $state.snapshot(form) as SymbolDraft;
			const result = await saveSymbol(
				{ name, description: snapshot.description, meanings: meaningsToSave(snapshot.meanings) },
				existing?.id
			);
			if (result.nameTaken) {
				errors.add({ name: m.symbols.form.nameTaken(name) }, () => form.name.trim());
				return;
			}
			if (result.error || !result.id) {
				formState.error = result.error ?? m.common.unexpectedError;
				return;
			}
			formState.saved = snapshot;
			await onsaved(
				resolve('/(app)/atelier/glossary/symbols/[id]', { id: result.id }),
				m.symbols.view.saved(name)
			);
		});
	}
</script>

<div class="page">
	<Form error={formState.error} errorTitle={m.symbols.form.errorTitle} onsubmit={submit}>
		<div class="fields">
			<TextField
				autocomplete="off"
				error={errors.current.name}
				label={m.common.name}
				maxlength={SYMBOL_NAME_MAX_LENGTH}
				bind:value={form.name}
			/>

			<TextArea
				counter
				label={m.symbols.form.description}
				maxRows={8}
				maxlength={SYMBOL_DESCRIPTION_MAX_LENGTH}
				rows={3}
				bind:value={form.description}
			/>

			{#if !existing}
				<MeaningInputs
					{candidates}
					error={errors.current[form.meanings[0].key]}
					bind:contexts={form.meanings[0].contexts}
					bind:text={form.meanings[0].text}
				/>
			{/if}
		</div>

		<FormActions>
			<Button href={cancelHref} onclick={oncancel}>
				{m.common.cancel}
			</Button>
			<Button disabled={formState.busy} type="submit" variant="primary">
				{formState.busy ? m.common.saving : m.common.save}
			</Button>
		</FormActions>
	</Form>
</div>

<DiscardDialog {changes} description={m.common.discardDescription} />

<style>
	.page {
		display: grid;
		min-height: calc(100dvh - var(--bar-height) - var(--spacing-6));
	}

	.page > :global(form) {
		display: flex;
		flex-direction: column;
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		min-width: 0;
		max-width: var(--size-content-default);
	}

	@media (min-width: 768px) {
		.page {
			min-height: calc(100dvh - var(--bar-height) - var(--spacing-8));
		}
	}
</style>
