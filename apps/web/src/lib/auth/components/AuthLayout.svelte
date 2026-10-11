<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Frame, Section } from '@study-atelier/ui';
	import { commonsImageUrl, pickArtwork } from '#lib/artworks/auth-artworks.ts';
	import { m } from '#lib/i18n/index.ts';

	type Props = {
		title: string;
		lead: string;
		children: Snippet;
		footer?: Snippet;
	};

	let { title, lead, children, footer }: Props = $props();

	const artwork = pickArtwork();
	const imageUrl = commonsImageUrl(artwork.file, 1280);
</script>

<svelte:head>
	<title>{m.app.pageTitle(title)}</title>
</svelte:head>

<div class="auth">
	<figure class="stage">
		<img class="backdrop" alt="" aria-hidden="true" src={imageUrl} />
		<div class="artwork">
			<Frame size="view">
				<img alt="{artwork.title}, {artwork.artist}" src={imageUrl} />
			</Frame>
		</div>
		<figcaption>
			<cite class="artwork-title">{artwork.title}</cite>
			<span>{artwork.artist}, {artwork.date}</span>
			<span class="credit">{m.artwork.credit}</span>
		</figcaption>
	</figure>

	<main class="panel">
		<div class="brand">{m.app.name}</div>
		<Section>
			<h1>{title}</h1>
			<p class="lead">{lead}</p>
		</Section>
		{@render children()}
		{#if footer}
			<footer>
				{@render footer()}
			</footer>
		{/if}
	</main>
</div>

<style>
	.auth {
		display: grid;
		min-height: 100dvh;
	}

	.stage {
		position: relative;
		display: grid;
		justify-items: center;
		align-content: start;
		height: 400px;
		padding-top: var(--spacing-6);
		overflow: hidden;
		background: var(--color-stage-bg);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.stage::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-scrim);
	}

	.artwork {
		position: relative;
		z-index: 1;
	}

	.stage .artwork :global(img) {
		width: auto;
		max-height: 180px;
	}

	figcaption {
		position: absolute;
		z-index: 1;
		right: var(--spacing-4);
		bottom: var(--spacing-4);
		left: var(--spacing-4);
		display: grid;
		color: var(--color-stage-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	figcaption span {
		color: var(--color-stage-fg-muted);
	}

	.credit {
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.panel {
		display: grid;
		align-content: center;
		gap: var(--spacing-8);
		width: 100%;
		max-width: calc(var(--size-content-narrow) + 2 * var(--spacing-4));
		margin: 0 auto;
		padding: var(--spacing-8) var(--spacing-4) var(--spacing-12);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.brand::before {
		content: '';
		width: var(--spacing-4);
		height: var(--spacing-4);
		border: var(--border-width-base) solid var(--color-line);
		border-bottom-width: var(--border-width-button);
	}

	footer {
		display: grid;
		gap: var(--spacing-3);
		padding-top: var(--spacing-6);
		border-top: var(--border-width-hairline) solid var(--color-fg-muted);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	@media (min-width: 768px) {
		.auth {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}

		.stage {
			position: sticky;
			top: 0;
			align-content: center;
			height: 100dvh;
			padding-top: 0;
		}

		.artwork {
			margin-bottom: var(--spacing-16);
		}

		.stage .artwork :global(img) {
			max-height: min(64dvh, 720px);
			max-width: min(36vw, 560px);
		}

		.panel {
			max-width: calc(var(--size-content-narrow) + 2 * var(--spacing-12));
			padding: var(--spacing-12);
		}
	}
</style>
