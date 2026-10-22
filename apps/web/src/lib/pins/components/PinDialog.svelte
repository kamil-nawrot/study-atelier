<script lang="ts">
	import { Alert, Button, Dialog, SearchSelect, TextArea } from '@study-atelier/ui';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { Fraction } from '../pin-layout.ts';
	import { createPin, deletePin, pinDraftError, updatePin } from '../pin-data.ts';
	import { MAX_PIN_TEXT, type Pin } from '../types.ts';

	type Props = {
		open?: boolean;
		imageId: string;
		pin?: Pin;
		spot: Fraction;
		entries: readonly GlossaryEntry[];
		onsaved: (pin: Pin) => void;
		ondeleted: (pin: Pin) => void;
	};

	let {
		open = $bindable(false),
		imageId,
		pin,
		spot,
		entries,
		onsaved,
		ondeleted
	}: Props = $props();

	let entryId = $state<string | null>(null);
	let text = $state('');
	let failure = $state<string>();
	let busy = $state<'saving' | 'deleting'>();

	let options = $derived(
		entries
			.map((entry) => ({ value: entry.id, label: entry.name }))
			.sort((first, second) => first.label.localeCompare(second.label, 'pl'))
	);

	$effect(() => {
		if (!open) return;
		entryId = pin?.glossaryEntryId ?? null;
		text = pin?.text ?? '';
		failure = undefined;
		busy = undefined;
	});

	async function submit(): Promise<void> {
		if (busy) return;
		const draft = { x: pin?.x ?? spot.x, y: pin?.y ?? spot.y, glossaryEntryId: entryId, text };
		failure = pinDraftError(draft);
		if (failure) return;
		busy = 'saving';
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
			<Alert title={m.pins.errorTitle} tone="danger">
				{failure}
			</Alert>
		{/if}
		<SearchSelect
			label={m.pins.term}
			{options}
			placeholder={m.pins.termPlaceholder}
			bind:value={entryId}
		/>
		<TextArea counter label={m.pins.text} maxlength={MAX_PIN_TEXT} rows={4} bind:value={text} />
	</div>
	{#snippet footer()}
		{#if pin}
			<Button disabled={busy !== undefined} onclick={remove} variant="danger">
				{busy === 'deleting' ? m.pins.removing : m.pins.remove}
			</Button>
		{/if}
		<Button onclick={() => (open = false)}>
			{m.pins.cancel}
		</Button>
		<Button disabled={busy !== undefined} onclick={submit} variant="primary">
			{busy === 'saving' ? m.pins.saving : m.pins.save}
		</Button>
	{/snippet}
</Dialog>

<style>
	.fields {
		display: grid;
		gap: var(--spacing-4);
	}
</style>
