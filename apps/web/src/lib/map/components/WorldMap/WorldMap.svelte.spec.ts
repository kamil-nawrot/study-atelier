import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testGeography, testPlace } from '#lib/testing/map/map.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import WorldMap from './WorldMap.svelte';

const paris: MapCity = {
	key: 'FR:Paryż',
	cityId: null,
	name: 'Paryż',
	countryCode: 'FR',
	point: { latitude: 48.857, longitude: 2.35 },
	places: [{ place: testPlace('Louvre'), artworks: [] }],
	count: 3,
	seen: 1
};
const florence: MapCity = {
	...paris,
	key: 'IT:Florencja',
	cityId: null,
	name: 'Florencja',
	point: { latitude: 43.78, longitude: 11.25 },
	count: 1,
	seen: 0
};

describe('WorldMap', () => {
	it('shows every city as a button with its number of artworks and name', async () => {
		await page.viewport(1000, 800);
		const onselect = vi.fn();
		render(WorldMap, {
			geography: testGeography(),
			fit: [paris.point, florence.point],
			cities: [paris, florence],
			selected: paris.key,
			onselect
		});

		const button = page.getByRole('button', { name: `Paryż, ${m.map.city.artworks(3)}` });
		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		await expect.element(button).toHaveTextContent(/3\s*Paryż/);
		await expect
			.element(page.getByRole('button', { name: `Florencja, ${m.map.city.artworks(1)}` }))
			.toHaveAttribute('aria-pressed', 'false');
		await button.click();
		expect(onselect).toHaveBeenCalledWith(paris);
	});

	it('zooms with its buttons, keeping the cities on their points', async () => {
		await page.viewport(1000, 800);
		render(WorldMap, {
			geography: testGeography(),
			fit: [paris.point, florence.point],
			cities: [paris, florence]
		});
		const city = page.getByRole('button', { name: /^Florencja/ }).element() as HTMLElement;
		const before = city.style.left;

		await page.getByRole('button', { name: m.map.zoomIn }).click();
		expect(city.style.left).not.toBe(before);
		await page.getByRole('button', { name: m.map.zoomOut }).click();
		expect(city.style.left).toBe(before);
	});

	it('gives the point of a click and shows it as a marker', async () => {
		await page.viewport(1000, 800);
		const onpick = vi.fn();
		const size = document.head.appendChild(document.createElement('style'));
		size.textContent = '.map { flex: none; width: 400px; height: 360px; }';
		render(WorldMap, {
			geography: testGeography(),
			fit: [paris.point],
			marker: paris.point,
			onpick
		});
		const map = document.querySelector('svg:not(.marker)') as SVGSVGElement;

		await userEvent.click(map, { position: { x: 40, y: 40 } });

		expect(onpick).toHaveBeenCalledTimes(1);
		const [point] = onpick.mock.calls[0];
		expect(point.latitude).toBeGreaterThan(paris.point.latitude);
		expect(point.longitude).toBeLessThan(paris.point.longitude);
		expect(document.querySelector('.marker')).not.toBeNull();
	});

	it('zooms with the wheel over a city', async () => {
		await page.viewport(1000, 800);
		render(WorldMap, {
			geography: testGeography(),
			fit: [paris.point, florence.point],
			cities: [paris, florence]
		});
		const florenceButton = page
			.getByRole('button', { name: /^Florencja/ })
			.element() as HTMLElement;
		const parisButton = page.getByRole('button', { name: /^Paryż/ }).element() as HTMLElement;
		const before = florenceButton.style.left;

		parisButton.dispatchEvent(
			new WheelEvent('wheel', { deltaY: -200, bubbles: true, cancelable: true })
		);

		await expect.poll(() => florenceButton.style.left).not.toBe(before);
	});

	it('groups close cities and fans them out on a click, however wide the map', async () => {
		await page.viewport(1000, 800);
		const onselect = vi.fn();
		const rome: MapCity = {
			...florence,
			key: 'IT:Rzym',
			cityId: null,
			name: 'Rzym',
			point: { latitude: 41.893, longitude: 12.483 },
			count: 5
		};
		const vatican: MapCity = {
			...florence,
			key: 'VA:Watykan',
			cityId: null,
			name: 'Watykan',
			point: { latitude: 41.903, longitude: 12.453 },
			count: 2
		};
		const tokyo: MapCity = {
			...florence,
			key: 'JP:Tokio',
			cityId: null,
			name: 'Tokio',
			point: { latitude: 35.68, longitude: 139.69 },
			count: 1
		};
		render(WorldMap, {
			geography: testGeography(),
			fit: [paris.point, rome.point, tokyo.point],
			cities: [paris, rome, vatican, tokyo],
			onselect
		});

		const group = page.getByRole('button', { name: m.map.group(['Rzym', 'Watykan'], 7) });
		const tokyoButton = page.getByRole('button', { name: /^Tokio/ }).element() as HTMLElement;
		const before = tokyoButton.style.left;
		await group.click();

		expect(onselect).not.toHaveBeenCalled();
		expect(tokyoButton.style.left).toBe(before);
		await expect.element(page.getByRole('button', { name: /^Rzym/ })).toBeInTheDocument();
		const surface = document.querySelector('.map > svg') as SVGSVGElement;
		const drag = (type: string, x: number): void => {
			surface.dispatchEvent(
				new PointerEvent(type, { bubbles: true, pointerId: 1, clientX: x, clientY: 300 })
			);
		};
		drag('pointerdown', 300);
		drag('pointermove', 340);
		drag('pointerup', 340);
		await expect.element(page.getByRole('button', { name: /^Watykan/ })).toBeInTheDocument();
		await page.getByRole('button', { name: /^Watykan/ }).click();
		expect(onselect).toHaveBeenCalledWith(vatican);

		await page.getByRole('button', { name: m.map.zoomIn }).click();
		await expect.element(page.getByRole('button', { name: /^Watykan/ })).not.toBeInTheDocument();
	});
});
