import type { MapCity } from '#lib/map/types/map-city.ts';

export const CITY_GAP = 4;
export const LABEL_GAP = 4;
export const SPLIT_MARGIN = 1.2;

export type CitySpot = { city: MapCity; x: number; y: number };

export type CityGroup = {
	key: string;
	cities: MapCity[];
	x: number;
	y: number;
	radius: number;
	count: number;
	seen: number;
};

export type LabelSize = { width: number; height: number };

type Box = { left: number; top: number; right: number; bottom: number };

function overlap(first: CityGroup, second: CityGroup): boolean {
	return (
		Math.hypot(first.x - second.x, first.y - second.y) < first.radius + second.radius + CITY_GAP
	);
}

function merge(target: CityGroup, other: CityGroup, radius: (count: number) => number): void {
	target.cities.push(...other.cities);
	target.count += other.count;
	target.seen += other.seen;
	target.radius = radius(target.count);
	target.key = `group:${target.cities.map((city) => city.key).join('|')}`;
}

function mergeOnce(groups: CityGroup[], radius: (count: number) => number): boolean {
	for (let first = 0; first < groups.length; first++) {
		for (let second = first + 1; second < groups.length; second++) {
			if (!overlap(groups[first], groups[second])) continue;
			merge(groups[first], groups[second], radius);
			groups.splice(second, 1);
			return true;
		}
	}
	return false;
}

export function groupCities(
	spots: readonly CitySpot[],
	radius: (count: number) => number
): CityGroup[] {
	const groups: CityGroup[] = [...spots]
		.sort((first, second) => second.city.count - first.city.count)
		.map(({ city, x, y }) => ({
			key: city.key,
			cities: [city],
			x,
			y,
			radius: radius(city.count),
			count: city.count,
			seen: city.seen
		}));
	while (mergeOnce(groups, radius));
	return groups;
}

export function splitFactor(
	group: CityGroup,
	spots: readonly CitySpot[],
	radius: (count: number) => number
): number {
	const members = spots.filter((spot) => group.cities.includes(spot.city));
	let factor = 1;
	for (const [index, first] of members.entries()) {
		for (const second of members.slice(index + 1)) {
			const distance = Math.hypot(first.x - second.x, first.y - second.y);
			const needed = radius(first.city.count) + radius(second.city.count) + CITY_GAP;
			factor = Math.max(factor, distance > 0 ? needed / distance : Infinity);
		}
	}
	return factor * SPLIT_MARGIN;
}

function labelBox(group: CityGroup, size: LabelSize): Box {
	const top = group.y + group.radius + LABEL_GAP;
	return {
		left: group.x - size.width / 2,
		top,
		right: group.x + size.width / 2,
		bottom: top + size.height
	};
}

function discBox(group: CityGroup): Box {
	return {
		left: group.x - group.radius,
		top: group.y - group.radius,
		right: group.x + group.radius,
		bottom: group.y + group.radius
	};
}

function crosses(first: Box, second: Box): boolean {
	return (
		first.left < second.right &&
		second.left < first.right &&
		first.top < second.bottom &&
		second.top < first.bottom
	);
}

export function labelledCities(
	groups: readonly CityGroup[],
	size: (city: MapCity) => LabelSize,
	selected?: string
): Set<string> {
	const singles = groups
		.filter((group) => group.cities.length === 1)
		.sort(
			(first, second) =>
				Number(second.key === selected) - Number(first.key === selected) ||
				second.count - first.count
		);
	const taken: Box[] = [];
	const labelled = new Set<string>();
	for (const group of singles) {
		const box = labelBox(group, size(group.cities[0]));
		const blocked =
			taken.some((other) => crosses(box, other)) ||
			groups.some((other) => other !== group && crosses(box, discBox(other)));
		if (blocked) continue;
		taken.push(box);
		labelled.add(group.key);
	}
	return labelled;
}
