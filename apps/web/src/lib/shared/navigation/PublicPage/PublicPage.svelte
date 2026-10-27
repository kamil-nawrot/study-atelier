<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, Logo } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();

	const signIn = resolve('/(auth)/sign-in');
	const signUp = resolve('/(auth)/sign-up');
	let signedIn = $derived(Boolean(page.data.session));
	let path = $derived(page.url.pathname);
</script>

<div class="public">
	<header class="bar">
		<a class="home" href={resolve('/(auth)')}>
			<Logo label={m.app.name} size="sm" />
		</a>
		<nav class="account" aria-label={m.publicHeader.label}>
			{#if signedIn}
				<Button href={resolve('/(app)/atelier')} variant="primary">
					{m.publicHeader.toAtelier}
				</Button>
			{:else}
				{#if path !== signIn}
					<a href={signIn}>{m.landing.signIn}</a>
				{/if}
				{#if path !== signUp}
					<span class="sign-up" class:beside={path !== signIn}>
						<Button href={signUp} variant="primary">{m.landing.signUp}</Button>
					</span>
				{/if}
			{/if}
		</nav>
	</header>
	{@render children()}
</div>

<style>
	.public {
		--public-header-height: calc(var(--size-control) + 2 * var(--spacing-3));
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 3;
		display: flex;
		box-sizing: border-box;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-4);
		height: var(--public-header-height);
		padding: var(--spacing-3) var(--spacing-4);
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.home {
		color: inherit;
	}

	.account {
		display: flex;
		align-items: center;
		gap: var(--spacing-4);
		white-space: nowrap;
	}

	.beside {
		display: none;
	}

	@media (min-width: 768px) {
		.bar {
			padding-inline: var(--spacing-6);
		}

		.beside {
			display: block;
		}
	}
</style>
