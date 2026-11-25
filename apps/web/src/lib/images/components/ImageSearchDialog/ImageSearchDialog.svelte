<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { Alert, ArtworkImage, Button, Dialog, MetaLine, Primer } from '@study-atelier/ui';
	import FillingStatus from '#lib/shared/forms/FillingStatus/FillingStatus.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import { findImageCandidates } from '#lib/images/image-search/image-search.ts';
	import {
		findSameArtworkImages,
		type SameArtworkCursor,
		type SameArtworkSource
	} from '#lib/images/same-artwork/same-artwork.ts';
	import type { ImageCandidate } from '#lib/images/types/image-candidate.ts';
	import type { ImageSearchQuery } from '#lib/images/types/image-search-query.ts';
	import type { ImageSearchResult } from '#lib/images/types/image-search-result.ts';

	type Props = {
		query: ImageSearchQuery;
		sameArtwork?: SameArtworkSource | null;
		open?: boolean;
		onpick: (candidate: ImageCandidate) => void;
	};

	let { query, sameArtwork = null, open = $bindable(false), onpick }: Props = $props();

	let searching = $state(true);
	let result = $state<ImageSearchResult>({ candidates: [] });
	let same = $state<ImageCandidate[]>([]);
	let cursor = $state<SameArtworkCursor | null>(null);
	let loadingMore = $state(false);
	let content: HTMLDivElement | undefined = $state();
	let search = 0;

	let others = $derived(
		result.candidates.filter((candidate) => candidate.wikidataId !== sameArtwork?.wikidataId)
	);

	async function sameFirstPage(): Promise<{
		candidates: ImageCandidate[];
		cursor: SameArtworkCursor | null;
	}> {
		if (query.kind !== 'artwork' || sameArtwork === null) return { candidates: [], cursor: null };
		return findSameArtworkImages(sameArtwork).catch(() => ({ candidates: [], cursor: null }));
	}

	async function run(): Promise<void> {
		const current = ++search;
		searching = true;
		const [found, page] = await Promise.all([findImageCandidates(query), sameFirstPage()]);
		if (current !== search) return;
		result = found;
		same = page.candidates;
		cursor = page.cursor;
		searching = false;
		await tick();
		content?.querySelector('button')?.focus();
	}

	async function more(): Promise<void> {
		if (sameArtwork === null || cursor === null) return;
		const current = search;
		loadingMore = true;
		const page = await findSameArtworkImages(sameArtwork, cursor).catch(() => null);
		loadingMore = false;
		if (current !== search || page === null) return;
		same = [...same, ...page.candidates];
		cursor = page.cursor;
	}

	$effect(() => {
		if (open) untrack(() => void run());
	});

	function pick(candidate: ImageCandidate): void {
		open = false;
		onpick(candidate);
	}

	function authorText(candidate: ImageCandidate): string {
		return candidate.authors.length > 0 ? candidate.authors.join(', ') : m.artwork.unknownArtist;
	}
</script>

{#snippet caption(candidate: ImageCandidate)}
	<span class="caption">
		{#if query.kind === 'person'}
			<span class="name">
				{candidate.title}
			</span>
			{#if candidate.date}
				<span class="meta date">
					{candidate.date}
				</span>
			{/if}
		{:else}
			<cite class="artwork-title">
				{candidate.title}
			</cite>
			<MetaLine class="meta" parts={[authorText(candidate), candidate.date]} />
		{/if}
	</span>
{/snippet}

<Dialog
	description={query.kind === 'person'
		? m.imageSearch.personDescription(query.name.trim())
		: m.imageSearch.description(query.title.trim(), query.authors.join(', '))}
	onclose={() => search++}
	title={query.kind === 'person' ? m.imageSearch.personTitle : m.imageSearch.title}
	bind:open
>
	{#if searching}
		<div class="searching">
			<div class="primed" aria-busy="true">
				<Primer />
			</div>
			<FillingStatus message={m.imageSearch.searching} />
		</div>
	{:else if result.error && same.length === 0}
		<div class="error">
			<Alert title={m.imageSearch.errorTitle} tone="danger">
				{result.error}
			</Alert>
			<div>
				<Button onclick={run}>
					{m.imageSearch.retry}
				</Button>
			</div>
		</div>
	{:else if others.length === 0 && same.length === 0}
		<p class="status" role="status">
			{query.kind === 'person' ? m.imageSearch.personEmpty : m.imageSearch.empty}
		</p>
	{:else}
		<div bind:this={content} class="sections">
			{#if same.length > 0}
				<section class="section" aria-labelledby="same-artwork">
					<h3 id="same-artwork" class="heading">{m.imageSearch.sameArtwork}</h3>
					<ul class="tiles">
						{#each same as candidate (candidate.image.file)}
							<li>
								<button class="tile" onclick={() => pick(candidate)} type="button">
									<ArtworkImage
										alt=""
										height={candidate.image.height}
										sizes="(min-width: 768px) 200px, 50vw"
										src={candidate.image.src}
										srcset={candidate.image.srcset}
										width={candidate.image.width}
									/>
								</button>
							</li>
						{/each}
					</ul>
					{#if cursor !== null}
						<div class="more">
							<Button disabled={loadingMore} onclick={more}>{m.imageSearch.more}</Button>
						</div>
					{/if}
				</section>
			{/if}
			{#if others.length > 0}
				<section class="section" aria-labelledby={same.length > 0 ? 'other-artworks' : undefined}>
					{#if same.length > 0}
						<h3 id="other-artworks" class="heading">{m.imageSearch.otherArtworks}</h3>
					{/if}
					<ul class="candidates">
						{#each others as candidate (candidate.wikidataId)}
							<li>
								<button class="candidate" onclick={() => pick(candidate)} type="button">
									<ArtworkImage
										alt=""
										height={candidate.image.height}
										sizes="(min-width: 768px) 220px, 50vw"
										src={candidate.image.src}
										srcset={candidate.image.srcset}
										width={candidate.image.width}
									/>
									{@render caption(candidate)}
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{query.kind === 'person' ? m.imageSearch.personNone : m.imageSearch.none}
		</Button>
	{/snippet}
</Dialog>

<style>
	.status {
		color: var(--color-fg-muted);
	}

	.searching {
		display: grid;
		gap: var(--spacing-3);
	}

	.primed {
		position: relative;
		height: 160px;
		background: var(--color-surface);
		color: var(--color-fg);
	}

	.error {
		display: grid;
		gap: var(--spacing-4);
	}

	.sections {
		display: grid;
		gap: var(--spacing-8);
	}

	.section {
		display: grid;
		gap: var(--spacing-3);
	}

	.heading {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: normal;
		line-height: var(--line-height-sm);
	}

	.tiles {
		columns: 2;
		column-gap: var(--spacing-4);
		list-style: none;
	}

	.tiles li {
		break-inside: avoid;
		padding-bottom: var(--spacing-4);
	}

	.tile {
		cursor: pointer;
		display: block;
		width: 100%;
		padding: var(--spacing-2);
		border: none;
		border-radius: var(--border-radius-none);
		background: var(--color-mat-bg);
	}

	.tile :global(img) {
		display: block;
		width: 100%;
		height: auto;
		background: var(--color-mat-window);
	}

	.more {
		display: flex;
		justify-content: center;
	}

	.candidates {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: var(--spacing-4);
		list-style: none;
	}

	.candidate {
		cursor: pointer;
		display: grid;
		width: 100%;
		padding: var(--spacing-2) var(--spacing-2) 0;
		border: none;
		border-radius: var(--border-radius-none);
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
		font: inherit;
		text-align: left;
	}

	.candidate :global(img) {
		display: block;
		width: 100%;
		height: auto;
		background: var(--color-mat-window);
	}

	.caption {
		display: grid;
		gap: var(--spacing-1);
		padding: var(--spacing-2) 0 var(--spacing-3);
	}

	.artwork-title,
	.name {
		color: var(--color-mat-fg);
		text-wrap: balance;
	}

	.candidate :global(.meta) {
		color: var(--color-mat-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.candidate:hover .artwork-title,
	.candidate:hover .name {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}

	@media (min-width: 768px) {
		.tiles {
			columns: 4;
			column-gap: var(--spacing-6);
		}

		.candidates {
			grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
			gap: var(--spacing-6);
		}
	}
</style>
