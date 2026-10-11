<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Button, Section } from '@study-atelier/ui';
	import { signOut } from '#lib/auth/account.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let signingOut = $state(false);

	async function submitSignOut(): Promise<void> {
		signingOut = true;
		await signOut();
		await goto(resolve('/(auth)/sign-in'), { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>{m.app.pageTitle(m.home.title)}</title>
</svelte:head>

<main>
	<Section>
		<h1>{m.home.title}</h1>
		<p>{m.home.placeholder}</p>
		<p class="caption">{m.home.signedInAs(data.session.user.email ?? '')}</p>
	</Section>
	<Button disabled={signingOut} onclick={submitSignOut}>{m.home.signOut}</Button>
</main>

<style>
	main {
		display: grid;
		justify-items: start;
		gap: var(--spacing-8);
		max-width: var(--size-content-default);
		margin: 0 auto;
		padding: var(--spacing-12) var(--spacing-4);
	}
</style>
