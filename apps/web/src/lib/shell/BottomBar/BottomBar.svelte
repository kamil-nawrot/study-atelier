<script lang="ts">
	import BookA from '@lucide/svelte/icons/book-a';
	import ImagesIcon from '@lucide/svelte/icons/images';
	import Layers from '@lucide/svelte/icons/layers';
	import Menu from '@lucide/svelte/icons/menu';
	import Plus from '@lucide/svelte/icons/plus';
	import { Count, Icon } from '@study-atelier/ui';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import NewMark from '#lib/career/components/NewMark/NewMark.svelte';
	import { career } from '#lib/career/career-state/career-state.svelte.ts';

	type Props = {
		onadd: () => void;
		onmenu: () => void;
	};

	let { onadd, onmenu }: Props = $props();

	const atelierPath = resolve('/(app)/atelier');
	const glossaryPath = resolve('/(app)/atelier/glossary');
	const reviewPath = resolve('/(app)/atelier/review');

	const path = $derived(page.url.pathname);
	const inAtelier = $derived(path === atelierPath || /^\/atelier\/\d+(\/|$)/.test(path));
	const inGlossary = $derived(path.startsWith(glossaryPath));
	const inReview = $derived(path === reviewPath);
	const careerShown = $derived(page.data.careerShown !== false);
</script>

<nav class="bottom-bar" aria-label={m.menu.bar}>
	<a class="item" aria-current={inAtelier ? 'page' : undefined} href={atelierPath}>
		<Icon icon={ImagesIcon} />
		<span class="label">{m.menu.atelier}</span>
	</a>
	<a class="item" aria-current={inGlossary ? 'page' : undefined} href={glossaryPath}>
		<Icon icon={BookA} />
		<span class="label">{m.menu.glossary}</span>
	</a>
	<button class="item add" aria-haspopup="dialog" onclick={onadd} type="button">
		<span class="plus"><Icon icon={Plus} /></span>
		<span class="label">{m.common.add}</span>
	</button>
	<a class="item" aria-current={inReview ? 'page' : undefined} href={reviewPath}>
		<span class="icon">
			<Icon icon={Layers} />
			{#await page.data.reviewWaiting then waiting}
				{#if waiting > 0}
					<span class="count"><Count aria-hidden="true" value={waiting} /></span>
				{/if}
			{/await}
		</span>
		<span class="label">
			{m.menu.review}
			{#await page.data.reviewWaiting then waiting}
				{#if waiting > 0}
					<span class="visually-hidden">, {m.menu.reviewWaiting(waiting)}</span>
				{/if}
			{/await}
		</span>
	</a>
	<button
		class="item"
		aria-haspopup="dialog"
		aria-label={m.menu.open}
		onclick={onmenu}
		type="button"
	>
		<span class="icon">
			<Icon icon={Menu} />
			{#if careerShown}
				<NewMark
					flash={career.tierFlash + career.rankFlash}
					shown={career.hasNewTiers || career.hasNewRank}
				/>
			{/if}
		</span>
		<span class="label" aria-hidden="true">{m.menu.label}</span>
	</button>
</nav>

<style>
	.bottom-bar {
		--label-size: 11px;
		--label-line: 1.2;
		--item-gap: 2px;
		--safe-bottom: env(safe-area-inset-bottom);
		position: fixed;
		inset: auto 0 0;
		z-index: 3;
		display: flex;
		height: var(--bottom-bar-height);
		padding-bottom: var(--safe-bottom);
		border-top: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.item {
		position: relative;
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--item-gap);
		min-width: 0;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg-muted);
		font: inherit;
		text-decoration: none;
		cursor: pointer;
	}

	.item[aria-current='page'] {
		color: var(--color-fg);
	}

	.item[aria-current='page']::before {
		position: absolute;
		inset: 0 25% auto;
		height: var(--border-width-base);
		background: var(--color-fg);
		content: '';
	}

	.label {
		overflow: hidden;
		max-width: 100%;
		font-size: var(--label-size);
		line-height: var(--label-line);
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.item[aria-current='page'] .label {
		font-weight: var(--font-weight-medium);
	}

	.add {
		color: var(--color-fg);
	}

	.plus {
		display: grid;
		place-items: center;
		width: 40px;
		height: 28px;
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.icon {
		position: relative;
		display: grid;
	}

	.count {
		position: absolute;
		bottom: 50%;
		left: 50%;
		display: flex;
	}

	.item:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: calc(-1 * var(--spacing-1));
	}

	@media (min-width: 768px) {
		.bottom-bar {
			display: none;
		}
	}
</style>
