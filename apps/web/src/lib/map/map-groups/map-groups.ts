import type { MapCity } from '#lib/map/types/map-city.ts';

export const CITY_GAP = 4;
export const LABEL_GAP = 4;

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

export type FannedCity = CityGroup & { from: { x: number; y: number } };

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

function angleOf(spot: CitySpot, group: CityGroup): number {
	return Math.atan2(spot.y - group.y, spot.x - group.x);
}

function slotAngle(slot: number, count: number): number {
	return (2 * Math.PI * slot) / count - Math.PI / 2;
}

function turn(from: number, to: number): number {
	const apart = Math.abs(from - to) % (2 * Math.PI);
	return apart > Math.PI ? 2 * Math.PI - apart : apart;
}

export function towardsPlaces(members: readonly CitySpot[], group: CityGroup): CitySpot[] {
	const sorted = [...members].sort(
		(first, second) => angleOf(first, group) - angleOf(second, group)
	);
	const count = sorted.length;
	const cost = (shift: number): number =>
		sorted.reduce(
			(sum, spot, index) =>
				sum + turn(slotAngle((index + shift) % count, count), angleOf(spot, group)),
			0
		);
	const shifts = Array.from({ length: count }, (_, shift) => shift);
	const best = shifts.reduce((chosen, shift) => (cost(shift) < cost(chosen) ? shift : chosen), 0);
	const ordered = new Array<CitySpot>(count);
	sorted.forEach((spot, index) => {
		ordered[(index + best) % count] = spot;
	});
	return ordered;
}

export function fanOut(
	group: CityGroup,
	spots: readonly CitySpot[],
	radius: (count: number) => number,
	labelWidth: (city: MapCity) => number
): FannedCity[] {
	const members = towardsPlaces(
		group.cities.flatMap((city) => spots.filter((spot) => spot.city === city)),
		group
	);
	const step = Math.max(
		...members.map((spot) => Math.max(radius(spot.city.count) * 2, labelWidth(spot.city)))
	);
	const ring = (step + CITY_GAP) / (2 * Math.sin(Math.PI / members.length));
	return members.map((spot, index) => {
		const angle = slotAngle(index, members.length);
		return {
			key: spot.city.key,
			cities: [spot.city],
			x: group.x + ring * Math.cos(angle),
			y: group.y + ring * Math.sin(angle),
			radius: radius(spot.city.count),
			count: spot.city.count,
			seen: spot.city.seen,
			from: { x: spot.x, y: spot.y }
		};
	});
}
