<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import { tick, untrack } from 'svelte';
	import { Alert, ArtworkImage, Button, Dialog, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { findImageCandidates } from '../image-search.ts';
	import type { ImageCandidate, ImageSearchResult } from '../types.ts';

	type Props = {
		title: string;
		authors: string[];
		open?: boolean;
		onpick: (candidate: ImageCandidate) => void;
	};

	let { title, authors, open = $bindable(false), onpick }: Props = $props();

	let searching = $state(true);
	let result = $state<ImageSearchResult>({ candidates: [] });
	let list: HTMLUListElement | undefined = $state();
	let search = 0;

	async function run(): Promise<void> {
		const current = ++search;
		searching = true;
		const found = await findImageCandidates({ title: title.trim(), authors });
		if (current !== search) return;
		result = found;
		searching = false;
		await tick();
		list?.querySelector('button')?.focus();
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
		<cite class="artwork-title">
			{candidate.title}
		</cite>
		<span class="meta">
			<span>
				{authorText(candidate)}
			</span>
			{#if candidate.date}
				<span aria-hidden="true">·</span>
				<span class="date">
					{candidate.date}
				</span>
			{/if}
		</span>
	</span>
{/snippet}

<Dialog
	description={m.imageSearch.description(title.trim(), authors.join(', '))}
	onclose={() => search++}
	title={m.imageSearch.title}
	bind:open
>
	{#if searching}
		<p class="status" role="status">
			<Icon icon={ImageIcon} />
			{m.imageSearch.searching}
		</p>
	{:else if result.error}
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
	{:else if result.candidates.length === 0}
		<p class="status" role="status">
			{m.imageSearch.empty}
		</p>
	{:else}
		<ul bind:this={list} class="candidates">
			{#each result.candidates as candidate (candidate.wikidataId)}
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
	{/if}

	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.imageSearch.none}
		</Button>
	{/snippet}
</Dialog>

<style>
	.status {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		color: var(--color-fg-muted);
	}

	.error {
		display: grid;
		gap: var(--spacing-4);
	}

	.candidates {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: var(--spacing-4);
		padding: 0;
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

	.artwork-title {
		color: var(--color-mat-fg);
		text-wrap: balance;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		column-gap: var(--spacing-1);
		color: var(--color-mat-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.date {
		white-space: nowrap;
	}

	.candidate:hover .artwork-title {
		text-decoration: underline;
		text-decoration-thickness: var(--border-width-hairline);
		text-underline-offset: 0.2em;
	}

	@media (min-width: 768px) {
		.candidates {
			grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
			gap: var(--spacing-6);
		}
	}
</style>
