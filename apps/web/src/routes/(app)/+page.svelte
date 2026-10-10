<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Button, Section } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { supabase } from '#lib/supabase.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let signingOut = $state(false);

	async function signOut() {
		signingOut = true;
		await supabase.auth.signOut();
		await goto(resolve('/(auth)/sign-in'), { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>{m.home.title} · {m.app.name}</title>
</svelte:head>

<main>
	<Section>
		<h1>{m.home.title}</h1>
		<p>{m.home.placeholder}</p>
		<p class="muted">{m.home.signedInAs(data.session.user.email ?? '')}</p>
	</Section>
	<div>
		<Button onclick={signOut} disabled={signingOut}>{m.home.signOut}</Button>
	</div>
</main>

<style>
	main {
		display: grid;
		gap: var(--spacing-8);
		max-width: 720px;
		margin: 0 auto;
		padding: var(--spacing-12) var(--spacing-4);
	}

	h1 {
		margin: 0;
		font-size: var(--font-size-3xl);
		line-height: var(--line-height-3xl);
		letter-spacing: var(--letter-spacing-tight);
	}

	p {
		margin: 0;
	}

	.muted {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}
</style>
