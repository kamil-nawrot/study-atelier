<script lang="ts">
	import BookA from '@lucide/svelte/icons/book-a';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import Footprints from '@lucide/svelte/icons/footprints';
	import ImagesIcon from '@lucide/svelte/icons/images';
	import Layers from '@lucide/svelte/icons/layers';
	import ListTree from '@lucide/svelte/icons/list-tree';
	import { ArtworkImage, Button, Frame } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { pickArtwork } from '#lib/auth/auth-artworks/auth-artworks.ts';
	import { commonsFileUrl } from '#lib/images/commons/commons.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import LegalLinks from '#lib/legal/components/LegalLinks/LegalLinks.svelte';

	const artwork = pickArtwork();
	const imageUrl = commonsFileUrl(artwork.file, 1280);
	const icons = [ImagesIcon, ListTree, BookA, CalendarRange, Footprints, Layers];
	const signIn = resolve('/(auth)/sign-in');
	const signUp = resolve('/(auth)/sign-up');
</script>

<svelte:head>
	<title>{m.landing.pageTitle}</title>
</svelte:head>

<div class="start">
	<section class="hero">
		<figure class="stage">
			<img class="backdrop" alt="" aria-hidden="true" src={imageUrl} />
			<div class="artwork">
				<Frame size="view">
					<ArtworkImage alt="{artwork.title}, {artwork.artist}" src={imageUrl} surface="frame" />
				</Frame>
			</div>
			<figcaption>
				<cite class="artwork-title">{artwork.title}</cite>
				<span>{artwork.artist}, {artwork.date}</span>
				<span class="credit">{artwork.credit}</span>
			</figcaption>
		</figure>

		<div class="panel">
			<div class="intro">
				<h1>{m.landing.title}</h1>
				<p class="text">{m.landing.text}</p>
				<div class="actions">
					<Button href={signUp} variant="primary">{m.landing.signUp}</Button>
					<p class="caption">
						{m.landing.haveAccount}
						<a href={signIn}>{m.landing.signIn}</a>
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class="modules" aria-labelledby="start-modules">
		<h2 id="start-modules">{m.landing.modulesTitle}</h2>
		<ul class="list">
			{#each m.landing.modules as module, index (module.title)}
				{@const Glyph = icons[index]}
				<li class="module">
					<Glyph
						aria-hidden="true"
						size={40}
						stroke-linecap="square"
						stroke-linejoin="miter"
						strokeWidth={1.25}
					/>
					<h3>{module.title}</h3>
					<p>{module.text}</p>
				</li>
			{/each}
		</ul>
	</section>

	<footer class="footer">
		<LegalLinks />
		<a class="contact" href="mailto:{m.landing.contact}">{m.landing.contact}</a>
	</footer>
</div>

<style>
	.start {
		display: grid;
	}

	.hero {
		display: grid;
	}

	.stage {
		position: relative;
		display: grid;
		justify-items: center;
		height: 400px;
		margin: 0;
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
		display: none;
		position: relative;
		z-index: 1;
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
		align-content: start;
		gap: var(--spacing-12);
		width: 100%;
		max-width: calc(var(--size-content-narrow) + 2 * var(--spacing-4));
		margin: 0 auto;
		padding: var(--spacing-6) var(--spacing-4) var(--spacing-12);
	}

	.intro {
		display: grid;
		gap: var(--spacing-6);
	}

	.text {
		font-size: var(--font-size-lg);
		line-height: var(--line-height-lg);
	}

	.actions {
		display: grid;
		justify-items: start;
		gap: var(--spacing-3);
	}

	.modules,
	.footer {
		width: 100%;
		max-width: calc(var(--size-content-wide) + 2 * var(--spacing-4));
		margin: 0 auto;
		padding-inline: var(--spacing-4);
	}

	.modules {
		display: grid;
		gap: var(--spacing-8);
		padding-block: var(--spacing-16);
	}

	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
		gap: var(--spacing-12);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.module {
		display: grid;
		align-content: start;
		gap: var(--spacing-3);
		color: var(--color-fg-muted);
	}

	.module h3,
	.module p {
		color: var(--color-fg);
	}

	.footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--spacing-3);
		padding-block: var(--spacing-6) var(--spacing-8);
		border-top: var(--border-width-hairline) solid var(--color-fg-muted);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
	}

	.contact {
		color: inherit;
	}

	@media (min-width: 768px) {
		.hero {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			min-height: calc(100dvh - var(--public-header-height));
		}

		.stage {
			align-content: center;
			height: auto;
			min-height: calc(100dvh - var(--public-header-height));
			padding-bottom: var(--spacing-16);
		}

		.artwork {
			display: block;
		}

		.stage .artwork :global(img) {
			width: auto;
			max-height: min(64dvh, 720px);
			max-width: min(36vw, 560px);
		}

		.panel {
			align-content: center;
			max-width: calc(var(--size-content-default) * 0.8 + 2 * var(--spacing-12));
			padding: var(--spacing-12);
		}
	}
</style>
