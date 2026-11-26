<script lang="ts">
	import { Button } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import GlossaryForm from '#lib/glossary/components/GlossaryForm/GlossaryForm.svelte';
	import EventForm from '#lib/timeline/components/EventForm/EventForm.svelte';
	import ValueForm from '#lib/values/components/ValueForm/ValueForm.svelte';
	import {
		eventPrefill,
		termDraft,
		valueDrafts
	} from '#lib/albums/album-item-drafts/album-item-drafts.ts';
	import type { AlbumItem } from '#lib/albums/types/album-item.ts';
	import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

	type Props = {
		item: AlbumItem;
		terms: GlossaryTerm[];
		index: CardIndexData;
		last: boolean;
		cancelHref: string;
		onfinish: () => void | Promise<void>;
		onsaved: () => void | Promise<void>;
		onskip: () => void | Promise<void>;
	};

	let { item, terms, index, last, cancelHref, onfinish, onsaved, onskip }: Props = $props();

	const today = new Date().toLocaleDateString('sv');

	let glossary = $state<GlossaryForm>();
	let timeline = $state<EventForm>();
	let value = $state<ValueForm>();

	let labels = $derived({
		cancel: m.albums.walk.finish,
		save: last ? m.albums.walk.saveAndFinish : m.albums.walk.saveAndNext
	});

	export async function confirmLeave(): Promise<boolean> {
		const form = glossary ?? timeline ?? value;
		return (await form?.confirmLeave()) ?? true;
	}

	async function finish(event: MouseEvent): Promise<void> {
		event.preventDefault();
		if (await confirmLeave()) await onfinish();
	}
</script>

{#snippet skip()}
	<Button onclick={onskip}>{m.albums.walk.skip}</Button>
{/snippet}

{#key item.key}
	{#if item.kind === 'term'}
		<GlossaryForm
			bind:this={glossary}
			{cancelHref}
			entries={terms}
			entry={item.existing}
			{index}
			kind={item.term.kind}
			{labels}
			oncancel={finish}
			{onsaved}
			prefill={termDraft(item.term, item.existing, today)}
			secondary={skip}
		/>
	{:else if item.kind === 'event'}
		<EventForm
			bind:this={timeline}
			{cancelHref}
			event={item.existing}
			{labels}
			oncancel={finish}
			{onsaved}
			prefill={eventPrefill(item.event, item.existing, today)}
			secondary={skip}
		/>
	{:else}
		{@const drafts = valueDrafts(
			item.value,
			item.record,
			item.existingDetails,
			item.state === 'description'
		)}
		<ValueForm
			bind:this={value}
			appendNote={drafts.appendNote}
			{cancelHref}
			details={drafts.baseline}
			{index}
			{labels}
			oncancel={finish}
			{onsaved}
			prefill={drafts.prefill}
			secondary={skip}
			subject={drafts.subject}
		/>
	{/if}
{/key}
