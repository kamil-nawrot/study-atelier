<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '@study-atelier/ui';
	import AuthLayout from '#lib/auth/components/AuthLayout.svelte';
	import { m } from '#lib/i18n/index.ts';
</script>

<AuthLayout lead={m.landing.lead} title={m.landing.title}>
	<div class="description">
		{#each m.landing.description as paragraph (paragraph)}
			<p>{paragraph}</p>
		{/each}
	</div>
	<nav class="actions">
		<Button href={resolve('/(auth)/sign-in')} variant="primary">{m.landing.signIn}</Button>
		<Button href={resolve('/(auth)/sign-up')}>{m.landing.signUp}</Button>
	</nav>
</AuthLayout>

<style>
	.description {
		display: grid;
		gap: var(--spacing-4);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-3);
	}
</style>
