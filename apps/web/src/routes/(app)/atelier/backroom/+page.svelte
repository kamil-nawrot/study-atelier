<script lang="ts">
	import { page } from '$app/state';
	import BackroomView from '#lib/backroom/components/BackroomView/BackroomView.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const images = new WallImages();

	let artworks = $derived(images.apply(data.artworks));
</script>

<AtelierLayout email={data.session.user.email ?? ''} heading title={m.backroom.title}>
	<BackroomView
		{artworks}
		brokenImages={data.brokenImages}
		error={data.error}
		flags={data.flags}
		message={page.state.backroomMessage}
		onimage={(artwork) => images.request(artwork)}
		terms={data.terms}
	/>
</AtelierLayout>
