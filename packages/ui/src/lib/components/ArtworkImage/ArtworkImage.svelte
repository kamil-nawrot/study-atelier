<script lang="ts" module>
	export const IMAGE_RETRY_DELAY = 3000;
</script>

<script lang="ts">
	import ImageOff from '@lucide/svelte/icons/image-off';
	import { uiMessages } from '../../messages/messages';
	import Icon from '../Icon/Icon.svelte';
	import Primer from '../Primer/Primer.svelte';

	type Props = {
		src?: string;
		alt: string;
		srcset?: string;
		sizes?: string;
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
		surface?: 'mat' | 'frame' | 'stage';
		failedLabel?: string;
		unavailable?: boolean;
		onfailed?: () => void;
	};

	let {
		src,
		alt,
		srcset,
		sizes,
		width,
		height,
		loading,
		surface = 'mat',
		failedLabel = uiMessages().imageFailed,
		unavailable = false,
		onfailed
	}: Props = $props();

	const FALLBACK_SIZE = { width: 800, height: 1000 };

	let source = $derived(src);
	let missing = $derived(unavailable);

	let status = $derived.by<'loading' | 'loaded' | 'failed'>(() => {
		void source;
		return missing ? 'failed' : 'loading';
	});
	let attempt = $derived.by<'first' | 'waiting' | 'second'>(() => {
		void source;
		return 'first';
	});

	let onScreen = $state(false);

	let size = $derived(width && height ? { width, height } : FALLBACK_SIZE);
	let placeholder = $derived(
		`data:image/svg+xml,${encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}"/>`
		)}`
	);

	$effect(() => {
		if (attempt !== 'waiting') return;
		const timer = setTimeout(() => (attempt = 'second'), IMAGE_RETRY_DELAY);
		return () => clearTimeout(timer);
	});

	function loaded(): void {
		status = 'loaded';
	}

	function failed(): void {
		if (attempt === 'first') attempt = 'waiting';
		else if (attempt === 'second') {
			status = 'failed';
			onfailed?.();
		}
	}

	function settleCached(image: HTMLImageElement): void {
		if (image.complete && image.naturalWidth > 0) loaded();
	}

	function watchScreen(element: HTMLElement): () => void {
		const observer = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting));
		observer.observe(element);
		return () => observer.disconnect();
	}
</script>

<span class="artwork-image {surface}" {@attach watchScreen} aria-busy={status === 'loading'}>
	{#if status !== 'loaded'}
		<img alt="" aria-hidden="true" src={placeholder} />
	{/if}
	{#if src && status !== 'failed' && attempt !== 'waiting'}
		{#key attempt}
			<img
				class:pending={status === 'loading'}
				{@attach settleCached}
				{alt}
				{height}
				{loading}
				onerror={failed}
				onload={loaded}
				{sizes}
				{src}
				{srcset}
				{width}
			/>
		{/key}
	{/if}
	{#if status === 'loading' && onScreen}
		<Primer />
	{:else if status === 'failed'}
		<span class="failed">
			<Icon icon={ImageOff} />
			<span>{failedLabel}</span>
		</span>
	{/if}
</span>

<style>
	.artwork-image {
		position: relative;
		display: block;
	}

	.mat {
		color: var(--color-mat-fg-muted);
	}

	.frame {
		color: var(--color-fg-muted);
	}

	.stage {
		color: var(--color-stage-fg-muted);
	}

	img {
		display: block;
	}

	img.pending {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
	}

	.failed {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-3);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		text-align: center;
	}
</style>
