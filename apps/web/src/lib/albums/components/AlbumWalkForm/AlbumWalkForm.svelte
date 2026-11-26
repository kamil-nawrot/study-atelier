<script lang="ts">
	import { Alert, Button } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkForm from '#lib/artworks/components/ArtworkForm/ArtworkForm.svelte';
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
		onskip: () => void | Promise<void>;
	};

	let { walk, ownFields, cancelHref, onfinish, onsaved, onskip }: Props = $props();

	let form = $state<ArtworkForm>();

	export async function confirmLeave(): Promise<boolean> {
		return (await form?.confirmLeave()) ?? true;
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
{:else if walk.version}
	{@const version = walk.version}
	{#key version.entryId}
		<ArtworkForm
			bind:this={form}
			album={{ entry: albumEntryKey(version), revision: version.revision }}
			{cancelHref}
			labels={{
				cancel: m.albums.walk.finish,
				save: walk.last ? m.albums.walk.saveAndFinish : m.albums.walk.saveAndNext
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
				<Button onclick={onskip}>{m.albums.walk.skip}</Button>
			{/snippet}
		</ArtworkForm>
	{/key}
{:else}
	<p class="lead">{m.albums.walk.loading}</p>
{/if}
