<script lang="ts">
	import { Alert, Button, FormActions } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkForm from '#lib/artworks/components/ArtworkForm/ArtworkForm.svelte';
	import AlbumComparison from '#lib/compare/components/AlbumComparison/AlbumComparison.svelte';
	import ComparisonPicker from '#lib/compare/components/ComparisonPicker/ComparisonPicker.svelte';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import { FormSuggestions } from '#lib/artworks/form-suggestions/form-suggestions.svelte.ts';
	import { albumEntryKey } from '#lib/albums/album-entry/album-entry.ts';
	import { newValueMarks } from '#lib/albums/album-version/album-version.ts';
	import type { AlbumWalk } from '#lib/albums/album-walk/album-walk.svelte.ts';
	import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';

	type Props = {
		walk: AlbumWalk;
		ownFields?: OwnFieldDefinition[];
		cancelHref: string;
		onfinish: () => void | Promise<void>;
		onsaved: () => void | Promise<void>;
		oncompleted: () => void | Promise<void>;
		onskip: () => void | Promise<void>;
	};

	let { walk, ownFields, cancelHref, onfinish, onsaved, oncompleted, onskip }: Props = $props();

	let saveLabel = $derived(walk.last ? m.albums.walk.saveAndFinish : m.albums.walk.saveAndNext);

	let form = $state<ArtworkForm>();

	export async function confirmLeave(): Promise<boolean> {
		return (await form?.confirmLeave()) ?? true;
	}

	async function pick(): Promise<void> {
		if (await confirmLeave()) walk.pick();
	}

	async function finish(event: MouseEvent): Promise<void> {
		event.preventDefault();
		if (await confirmLeave()) await onfinish();
	}
</script>

{#if walk.error}
	<Alert title={m.albums.albumLoadErrorTitle} tone="danger">
		{walk.error}
	</Alert>
{:else if walk.version && walk.picking}
	<div class="picking">
		<ComparisonPicker
			empty="left"
			lead={m.albums.walk.pickLead}
			onpick={(number) => walk.compareWith(number)}
			other={walk.version.artwork}
			sides={{ left: null, right: null }}
		/>
		{#if walk.pickError}
			<Alert title={m.compare.loadFailedTitle} tone="danger">
				{walk.pickError}
			</Alert>
		{/if}
		<FormActions>
			<Button onclick={onfinish}>{m.albums.walk.finish}</Button>
			<Button onclick={onskip}>{m.albums.walk.skip}</Button>
			<Button onclick={() => walk.cancelPick()}>{m.albums.walk.backToForm}</Button>
		</FormActions>
	</div>
{:else if walk.version && walk.mine && walk.comparing}
	{@const version = walk.version}
	{@const mine = walk.mine}
	{#key version.entryId}
		<AlbumComparison {mine} onsaved={oncompleted} {ownFields} {saveLabel} {version}>
			{#snippet notice()}
				<Alert tone="warning">
					{walk.chosen
						? m.albums.walk.chosen(formatRecordNumber(mine.number))
						: m.albums.walk.similar(formatRecordNumber(mine.number))}
				</Alert>
			{/snippet}
			{#snippet actions()}
				<Button onclick={onfinish}>{m.albums.walk.finish}</Button>
				<Button onclick={onskip}>{m.albums.walk.skip}</Button>
				<Button onclick={() => walk.addAsNew()}>{m.albums.walk.addAsNew}</Button>
			{/snippet}
		</AlbumComparison>
	{/key}
{:else if walk.version}
	{@const version = walk.version}
	{#key version.entryId}
		<ArtworkForm
			bind:this={form}
			album={{ entry: albumEntryKey(version), revision: version.revision }}
			{cancelHref}
			labels={{
				cancel: m.albums.walk.finish,
				save: saveLabel
			}}
			newValues={newValueMarks(version.newValues)}
			oncancel={finish}
			{onsaved}
			{ownFields}
			prefill={version.artwork}
			saveAndNext={false}
			suggestions={new FormSuggestions()}
		>
			{#snippet secondary()}
				<Button onclick={pick}>{m.albums.walk.inAtelier}</Button>
				<Button onclick={onskip}>{m.albums.walk.skip}</Button>
			{/snippet}
		</ArtworkForm>
	{/key}
{:else}
	<p class="lead">{m.albums.walk.loading}</p>
{/if}

<style>
	.picking {
		display: grid;
		gap: var(--spacing-4);
	}
</style>
