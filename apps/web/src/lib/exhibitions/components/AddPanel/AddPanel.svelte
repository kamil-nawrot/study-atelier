<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkSearch from '#lib/exhibitions/components/ArtworkSearch/ArtworkSearch.svelte';
	import TermSearch from '#lib/exhibitions/components/TermSearch/TermSearch.svelte';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import FilterSidePanel from '#lib/wall/components/FilterSidePanel/FilterSidePanel.svelte';
	import type {
		ArtworkKind,
		NewBlock,
		TextKind
	} from '#lib/exhibitions/editor/new-block/new-block.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';

	type Props = {
		open: boolean;
		lookup: ArtworkLookup;
		terms?: readonly GlossaryTerm[];
		onadd: (block: NewBlock) => void;
		ondrag?: (event: PointerEvent, block: NewBlock) => void;
		addHref?: ResolvedPathname;
	};

	let { open = $bindable(), lookup, terms = [], onadd, ondrag, addHref }: Props = $props();

	function termBlock(term: GlossaryTerm): NewBlock {
		return { kind: 'term', termId: term.id, name: term.name };
	}

	const kinds: { kind: TextKind; label: string }[] = [
		{ kind: 'textBlock', label: m.exhibitions.panel.paragraph },
		{ kind: 'heading', label: m.exhibitions.panel.heading },
		{ kind: 'quote', label: m.exhibitions.panel.quote },
		{ kind: 'divider', label: m.exhibitions.panel.divider }
	];

	const artworkKinds: { kind: ArtworkKind; label: string }[] = [
		{ kind: 'artwork', label: m.exhibitions.blocks.artwork },
		{ kind: 'palette', label: m.exhibitions.blocks.palette },
		{ kind: 'closeUp', label: m.exhibitions.blocks.closeUp }
	];

	let artworkKind = $state<ArtworkKind>('artwork');
</script>

<FilterSidePanel closeLabel={m.exhibitions.panel.close} title={m.exhibitions.panel.title} bind:open>
	<section class="section" aria-labelledby="panel-text">
		<h3 id="panel-text">{m.exhibitions.panel.textTitle}</h3>
		<div class="kinds">
			{#each kinds as { kind, label } (kind)}
				<button
					class="kind"
					onclick={() => onadd({ kind })}
					onpointerdown={(event) => ondrag?.(event, { kind })}
					type="button"
				>
					{label}
				</button>
			{/each}
		</div>
	</section>
	<section class="section" aria-labelledby="panel-artworks">
		<h3 id="panel-artworks">{m.exhibitions.panel.artworksTitle}</h3>
		<p id="panel-add-as" class="caption">{m.exhibitions.panel.addAs}</p>
		<div class="as" aria-labelledby="panel-add-as" role="radiogroup">
			{#each artworkKinds as { kind, label } (kind)}
				<label class="kind" class:chosen={artworkKind === kind}>
					<input name="artwork-kind" type="radio" value={kind} bind:group={artworkKind} />
					{label}
				</label>
			{/each}
		</div>
		<ArtworkSearch
			{lookup}
			ondrag={(event, artworkId) => ondrag?.(event, { kind: artworkKind, artworkId })}
			onpick={(artworkId) => onadd({ kind: artworkKind, artworkId })}
		/>
		<a class="browse" href={resolve('/(app)/atelier')} rel="external noopener" target="_blank">
			{m.exhibitions.panel.browse}
		</a>
		{#if addHref}
			<a class="browse" href={addHref}>{m.exhibitions.panel.addMissing}</a>
		{/if}
	</section>
	<section class="section" aria-labelledby="panel-glossary">
		<h3 id="panel-glossary">{m.exhibitions.panel.glossaryTitle}</h3>
		<TermSearch
			ondrag={(event, term) => ondrag?.(event, termBlock(term))}
			onpick={(term) => onadd(termBlock(term))}
			{terms}
		/>
	</section>
</FilterSidePanel>

<style>
	.section {
		display: grid;
		gap: var(--spacing-3);
	}

	h3 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.kinds {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.kind {
		padding: var(--spacing-2) var(--spacing-3);
		border: var(--border-width-hairline) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: grab;
	}

	.as {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.as .kind {
		cursor: pointer;
	}

	.as input {
		position: absolute;
		opacity: 0;
	}

	.as .chosen {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.as .kind:focus-within {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	.browse {
		color: inherit;
	}
</style>
