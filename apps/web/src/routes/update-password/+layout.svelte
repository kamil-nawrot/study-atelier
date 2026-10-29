<script lang="ts">
	import PublicPage from '#lib/shared/navigation/PublicPage/PublicPage.svelte';

	let { children } = $props();
</script>

<PublicPage>
	{@render children()}
</PublicPage>
