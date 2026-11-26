<script lang="ts">
	import { ArtworkImage } from '@study-atelier/ui';
	import { albumFileUrl } from '#lib/images/album/album.ts';
	import type { AlbumImage } from '#lib/albums/types/album-image.ts';

	type Props = {
		image: AlbumImage;
		sizes?: string;
	};

	let { image, sizes }: Props = $props();
</script>

<ArtworkImage
	alt=""
	height={image.height}
	loading="lazy"
	{sizes}
	src={albumFileUrl(image.path)}
	surface="frame"
	width={image.width}
/>
