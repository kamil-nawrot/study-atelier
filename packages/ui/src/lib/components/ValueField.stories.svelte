<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ValueField, { type ValueOption } from './ValueField.svelte';

	const styles: ValueOption[] = [
		{ kind: 'existing', name: 'baroque' },
		{ kind: 'existing', name: 'tenebrism' },
		{ kind: 'existing', name: 'gothic' },
		{ kind: 'existing', name: 'renaissance' },
		{ kind: 'existing', name: 'rococo' }
	];

	const { Story } = defineMeta({
		title: 'Components/ValueField',
		component: ValueField,
		tags: ['autodocs'],
		args: { label: 'Style', options: styles, placeholder: 'Type a style' },
		argTypes: { options: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="With values" args={{ values: ['baroque', 'tenebrism'], options: styles.slice(2) }} />

<Story
	name="New value"
	args={{
		query: 'caravaggism',
		options: [{ kind: 'new', name: 'caravaggism' }]
	}}
/>

<Story
	name="Similar value"
	args={{
		query: 'barock',
		options: [
			{ kind: 'similar', name: 'baroque' },
			{ kind: 'new', name: 'barock' }
		]
	}}
/>

<Story
	name="Single value"
	args={{
		label: 'Location',
		values: ['Rijksmuseum, Amsterdam'],
		options: [],
		single: true,
		hint: 'Where the artwork is now. One value.'
	}}
/>

<Story
	name="Locked"
	args={{ label: 'Style', options: [], locked: true, placeholder: 'Choose a period first.' }}
/>

<Story
	name="With error"
	args={{ label: 'Authors', options: [], error: 'Add an author or tick “Unknown author”.' }}
/>

<Story name="Disabled" args={{ label: 'Authors', values: ['Rembrandt'], disabled: true }} />
