<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ArtworkTile from '../ArtworkTile/ArtworkTile.svelte';
	import Button from '../Button/Button.svelte';
	import Dialog from './Dialog.svelte';
	import Select from '../Select/Select.svelte';

	const candidates = [
		{ number: 1, title: 'Lady with an Ermine', date: 'c. 1490' },
		{ number: 2, title: 'Portrait of a Musician', date: 'c. 1485' },
		{ number: 3, title: 'La Belle Ferronnière', date: 'c. 1495' },
		{ number: 4, title: 'Ginevra de’ Benci', date: 'c. 1476' }
	];

	const { Story } = defineMeta({
		title: 'Components/Dialog',
		component: Dialog,
		tags: ['autodocs'],
		args: { title: 'Which artwork is it?' },
		argTypes: {
			size: { control: 'inline-radio', options: ['default', 'small'] },
			children: { control: false },
			footer: { control: false }
		}
	});
</script>

<script lang="ts">
	let candidatesOpen = $state(false);
	let formOpen = $state(false);
	let confirmOpen = $state(false);
	let type = $state('');
</script>

<Story
	name="Default"
	args={{ description: 'Results for “Lady with an Ermine”, Leonardo da Vinci' }}
>
	{#snippet template(args)}
		<Button onclick={() => (candidatesOpen = true)}>Find image</Button>
		<Dialog {...args} bind:open={candidatesOpen}>
			<div
				style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--spacing-6)"
			>
				{#each candidates as candidate (candidate.number)}
					<ArtworkTile {...candidate} authors={['Leonardo da Vinci']} href="#" />
				{/each}
			</div>
			{#snippet footer()}
				<Button onclick={() => (candidatesOpen = false)}>None of these</Button>
			{/snippet}
		</Dialog>
	{/snippet}
</Story>

<Story name="With a form" args={{ title: 'Change type' }}>
	{#snippet template(args)}
		<Button onclick={() => (formOpen = true)}>Change type</Button>
		<Dialog {...args} bind:open={formOpen}>
			<Select
				label="Type"
				options={[
					{ value: 'painting', label: 'Painting' },
					{ value: 'sculpture', label: 'Sculpture' }
				]}
				placeholder="Not chosen"
				bind:value={type}
			/>
			{#snippet footer()}
				<Button onclick={() => (formOpen = false)}>Cancel</Button>
				<Button onclick={() => (formOpen = false)} variant="primary">Save</Button>
			{/snippet}
		</Dialog>
	{/snippet}
</Story>

<Story
	name="Small"
	args={{
		title: 'Discard changes?',
		description: 'You have unsaved changes to this artwork. If you leave, they will be lost.',
		size: 'small'
	}}
>
	{#snippet template(args)}
		<Button onclick={() => (confirmOpen = true)}>Cancel</Button>
		<Dialog {...args} bind:open={confirmOpen}>
			{#snippet footer()}
				<Button onclick={() => (confirmOpen = false)}>Back to the form</Button>
				<Button onclick={() => (confirmOpen = false)} variant="primary">Discard</Button>
			{/snippet}
		</Dialog>
	{/snippet}
</Story>
