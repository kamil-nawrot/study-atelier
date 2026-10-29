<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, Logo } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/i18n/i18n.ts';
	import { publicActions } from '#lib/shared/navigation/public-actions/public-actions.ts';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();

	let actions = $derived(publicActions(page.url.pathname, Boolean(page.data.session)));
</script>

<div class="public">
	<header class="bar">
		<a class="home" href={resolve('/(auth)')}>
			<Logo label={m.app.name} size="sm" />
		</a>
		{#if actions !== 'none'}
			<nav class="account" aria-label={m.publicHeader.label}>
				{#if actions === 'atelier'}
					<Button href={resolve('/(app)/atelier')} variant="primary">
						{m.publicHeader.toAtelier}
					</Button>
				{:else}
					<a href={resolve('/(auth)/sign-in')}>{m.landing.signIn}</a>
					{#if actions === 'account'}
						<span class="sign-up">
							<Button href={resolve('/(auth)/sign-up')} variant="primary">{m.landing.signUp}</Button
							>
						</span>
					{/if}
				{/if}
			</nav>
		{/if}
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

	.sign-up {
		display: none;
	}

	@media (min-width: 768px) {
		.bar {
			padding-inline: var(--spacing-6);
		}

		.sign-up {
			display: block;
		}
	}
</style>
