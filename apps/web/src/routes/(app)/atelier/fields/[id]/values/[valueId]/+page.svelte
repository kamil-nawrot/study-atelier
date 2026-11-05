<script lang="ts">
	import OwnValuePage from '#lib/card-index/components/OwnValuePage/OwnValuePage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<OwnValuePage {data} email={data.session.user.email ?? ''} />
