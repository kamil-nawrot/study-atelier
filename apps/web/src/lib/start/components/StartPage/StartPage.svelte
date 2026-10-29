<script lang="ts">
	import { Button } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { commonsFileUrl } from '#lib/images/commons/commons.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import LegalLinks from '#lib/legal/components/LegalLinks/LegalLinks.svelte';
	import SalonWall from '#lib/start/components/SalonWall/SalonWall.svelte';
	import { moduleArtworks, salonArtworks } from '#lib/start/salon/salon.ts';

	const MODULE_IMAGE_WIDTH = 960;

	const salon = salonArtworks();
	const pictures = moduleArtworks();
	const signUp = resolve('/(auth)/sign-up');
</script>

<svelte:head>
	<title>{m.landing.pageTitle}</title>
</svelte:head>

<div class="start">
	<main class="content">
		<section class="hero">
			<SalonWall artworks={salon} />
			<div class="intro">
				<h1>{m.landing.title} <em>{m.landing.titleAccent}</em></h1>
				<p class="text">{m.landing.text}</p>
				<Button href={signUp} variant="primary">{m.landing.signUp}</Button>
			</div>
		</section>

		<section class="modules" aria-labelledby="start-modules">
			<h2 id="start-modules">{m.landing.modulesTitle}</h2>
			<ul class="list">
				{#each m.landing.modules as module, index (module.title)}
					{@const picture = pictures[index]}
					<li style:--module-accent="var(--color-lane-{(index % 5) + 1})" class="module">
						<img
							alt="{picture.title}, {picture.artist}"
							loading="lazy"
							src={commonsFileUrl(picture.file, MODULE_IMAGE_WIDTH)}
						/>
						<div class="about">
							<h3>{module.title}</h3>
							<p>{module.text}</p>
						</div>
					</li>
				{/each}
			</ul>
		</section>

		<section class="closing" aria-labelledby="start-closing">
			<h2 id="start-closing">{m.landing.closingTitle}</h2>
			<p class="closing-text">{m.landing.closingText}</p>
			<Button href={signUp} variant="primary">{m.landing.signUp}</Button>
		</section>
	</main>

	<footer class="footer">
		<LegalLinks />
		<a class="contact" href="mailto:{m.landing.contact}">{m.landing.contact}</a>
	</footer>
</div>

<style>
	.start,
	.content {
		display: grid;
	}

	.hero {
		position: relative;
		display: grid;
		place-items: center;
		min-height: calc(100dvh - var(--public-header-height));
		padding: var(--spacing-12) var(--spacing-4);
		overflow: hidden;
		background: var(--color-stage-bg);
	}

	.hero::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse 90% 45% at center,
			var(--color-stage-bg) 50%,
			var(--color-scrim) 100%
		);
	}

	.intro {
		position: relative;
		z-index: 1;
		display: grid;
		justify-items: center;
		gap: var(--spacing-6);
		max-width: var(--size-content-default);
		color: var(--color-stage-fg);
		text-align: center;
	}

	h1 {
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-2xl);
		letter-spacing: var(--letter-spacing-tight);
	}

	h1 em {
		font-family: var(--font-family-title);
		font-weight: var(--font-weight-regular);
	}

	.text {
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
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
		gap: var(--spacing-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.module {
		display: grid;
		grid-template-rows: auto 1fr;
		border-top: var(--border-width-heavy) solid var(--module-accent);
		background: var(--color-surface);
	}

	.module img {
		width: 100%;
		height: 180px;
		object-fit: cover;
	}

	.about {
		display: grid;
		align-content: start;
		gap: var(--spacing-2);
		padding: var(--spacing-6);
	}

	.about p {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.closing {
		display: grid;
		justify-items: center;
		gap: var(--spacing-6);
		padding: var(--spacing-16) var(--spacing-4);
		background: var(--color-highlight);
		color: var(--color-on-fg);
		text-align: center;
	}

	.closing-text {
		max-width: var(--size-content-default);
		font-family: var(--font-family-title);
		font-size: var(--font-size-lg);
		font-style: italic;
		line-height: var(--line-height-lg);
	}

	.footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--spacing-3);
		padding-block: var(--spacing-6) var(--spacing-8);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
	}

	.contact {
		color: inherit;
	}

	@media (min-width: 768px) {
		.hero {
			padding: var(--spacing-16) var(--spacing-6);
		}

		.hero::after {
			background: radial-gradient(
				ellipse 55% 50% at center,
				var(--color-stage-bg) 40%,
				var(--color-scrim) 70%,
				transparent 100%
			);
		}

		h1 {
			font-size: var(--font-size-3xl);
			line-height: var(--line-height-3xl);
		}

		.text {
			font-size: var(--font-size-lg);
			line-height: var(--line-height-lg);
		}

		.modules {
			padding-block: var(--spacing-24);
		}
	}
</style>
