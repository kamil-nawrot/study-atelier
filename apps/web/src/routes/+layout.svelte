<script lang="ts">
	import '@study-atelier/ui/styles.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import { supabase } from '#lib/supabase.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (session?.access_token !== data.session?.access_token) {
				invalidate('supabase:auth');
			}
		});
		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
