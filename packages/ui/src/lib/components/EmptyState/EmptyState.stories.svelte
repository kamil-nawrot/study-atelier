<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import BookA from '@lucide/svelte/icons/book-a';
	import Plus from '@lucide/svelte/icons/plus';
	import Button from '../Button/Button.svelte';
	import Icon from '../Icon/Icon.svelte';
	import EmptyState from './EmptyState.svelte';

	const { Story } = defineMeta({
		title: 'Components/EmptyState',
		component: EmptyState,
		tags: ['autodocs'],
		args: {
			icon: BookA,
			title: 'Słowniczek jest jeszcze pusty',
			text: 'Dodaj pierwsze pojęcie, gdy trafisz na słowo, które chcesz zapamiętać.'
		}
	});
</script>

<Story name="Empty module">
	{#snippet template(args)}
		<EmptyState {...args}>
			<Button href="#">
				<Icon icon={Plus} />
				Dodaj pierwsze pojęcie
			</Button>
		</EmptyState>
	{/snippet}
</Story>

<Story name="Empty module without an action" />

<Story
	name="Empty part of a page"
	args={{
		title: undefined,
		text: 'Nie ma tu jeszcze materiałów. Pojawią się, gdy wpiszesz je przy dziele.'
	}}
/>
