<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Image from '@lucide/svelte/icons/image';
	import Info from '@lucide/svelte/icons/info';
	import Landmark from '@lucide/svelte/icons/landmark';
	import Link from '@lucide/svelte/icons/link';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import LogOut from '@lucide/svelte/icons/log-out';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Menu from '@lucide/svelte/icons/menu';
	import Moon from '@lucide/svelte/icons/moon';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import Palette from '@lucide/svelte/icons/palette';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Search from '@lucide/svelte/icons/search';
	import Settings from '@lucide/svelte/icons/settings';
	import Sun from '@lucide/svelte/icons/sun';
	import Tag from '@lucide/svelte/icons/tag';
	import Trash from '@lucide/svelte/icons/trash';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Upload from '@lucide/svelte/icons/upload';
	import User from '@lucide/svelte/icons/user';
	import X from '@lucide/svelte/icons/x';
	import Icon from './Icon.svelte';

	const { Story } = defineMeta({
		title: 'Components/Icon',
		component: Icon,
		tags: ['autodocs'],
		args: { icon: Search, size: 'md' },
		argTypes: {
			size: { control: 'inline-radio', options: ['sm', 'md'] },
			icon: { control: false }
		}
	});

	const icons = {
		ArrowLeft,
		Calendar,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		Ellipsis,
		ExternalLink,
		Eye,
		EyeOff,
		Image,
		Info,
		Landmark,
		Link,
		ListFilter,
		LogOut,
		MapPin,
		Menu,
		Moon,
		NotebookPen,
		Palette,
		Pencil,
		Plus,
		RotateCcw,
		Search,
		Settings,
		Sun,
		Tag,
		Trash,
		TriangleAlert,
		Upload,
		User,
		X
	};
</script>

<Story name="Default" />

<Story name="Small" args={{ size: 'sm' }} />

<Story name="With label" args={{ icon: Trash, label: 'Move to trash' }} />

<Story name="Gallery" parameters={{ controls: { disable: true } }}>
	{#snippet template()}
		<div class="gallery">
			{#each Object.entries(icons) as [name, icon] (name)}
				<figure>
					<Icon {icon} />
					<figcaption>{name}</figcaption>
				</figure>
			{/each}
		</div>
	{/snippet}
</Story>

<style>
	.gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
		gap: var(--spacing-4);
	}

	figure {
		display: grid;
		justify-items: center;
		gap: var(--spacing-2);
		margin: 0;
	}

	figcaption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
	}
</style>
