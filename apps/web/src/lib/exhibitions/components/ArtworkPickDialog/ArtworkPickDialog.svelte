<script lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkSearch from '#lib/exhibitions/components/ArtworkSearch/ArtworkSearch.svelte';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';

	type Props = {
		open?: boolean;
		title: string;
		lookup: ArtworkLookup;
		onpick: (artworkId: string) => void;
	};

	let { open = $bindable(false), title, lookup, onpick }: Props = $props();

	function pick(artworkId: string): void {
		onpick(artworkId);
		open = false;
	}
</script>

<Dialog {title} bind:open>
	<div class="body">
		{#if open}
			<ArtworkSearch {lookup} onpick={pick} />
		{/if}
	</div>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
	{/snippet}
</Dialog>

<style>
	.body {
		display: grid;
		gap: var(--spacing-3);
	}
</style>
