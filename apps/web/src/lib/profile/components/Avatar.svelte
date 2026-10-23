<script lang="ts">
	import { avatarUrl } from '../avatar.ts';

	type Props = {
		initial: string;
		path?: string | null;
		previewUrl?: string;
		large?: boolean;
		medium?: boolean;
	};

	let { initial, path = null, previewUrl, large = false, medium = false }: Props = $props();

	let loaded = $state<{ path: string; url: string }>();
	let broken = $state(false);

	let source = $derived(previewUrl ?? (loaded?.path === path ? loaded?.url : undefined));

	$effect(() => {
		const wanted = path;
		broken = false;
		if (wanted === null || previewUrl !== undefined) return;
		let current = true;
		void avatarUrl(wanted).then((url) => {
			if (current && url) loaded = { path: wanted, url };
		});
		return () => {
			current = false;
		};
	});
</script>

<span class="avatar" class:large class:medium aria-hidden="true">
	{#if source && !broken}
		<img alt="" onerror={() => (broken = true)} src={source} />
	{:else}
		{initial}
	{/if}
</span>

<style>
	.avatar {
		display: grid;
		place-items: center;
		flex: none;
		overflow: hidden;
		width: 24px;
		height: 24px;
		border: var(--border-width-base) solid var(--color-fg);
		border-radius: var(--border-radius-none);
		background: var(--color-tag);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		line-height: 1;
	}

	.medium {
		width: 40px;
		height: 40px;
		font-size: var(--font-size-md);
	}

	.large {
		width: 96px;
		height: 96px;
		border-color: transparent;
		background: var(--color-surface);
		font-size: var(--font-size-3xl);
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
