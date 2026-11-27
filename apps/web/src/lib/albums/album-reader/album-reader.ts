export const ENTRY_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const WIKIDATA_ID = /^Q[1-9][0-9]*$/;
export const HTTPS_URL = /^https:\/\/\S+$/;

type Fields = Record<string, unknown>;

type TextRule = { max?: number; pattern?: RegExp };

export class AlbumReader {
	readonly errors: string[] = [];

	fail(path: string, message: string): undefined {
		this.errors.push(`${path}: ${message}`);
		return undefined;
	}

	fields(
		value: unknown,
		path: string,
		required: readonly string[],
		optional: readonly string[] = []
	): Fields | undefined {
		if (typeof value !== 'object' || value === null || Array.isArray(value))
			return this.fail(path, 'is not an object');
		const fields = value as Fields;
		for (const key of required) if (!(key in fields)) this.fail(path, `has no "${key}"`);
		for (const key of Object.keys(fields))
			if (!required.includes(key) && !optional.includes(key))
				this.fail(path, `has an unknown key "${key}"`);
		return fields;
	}

	text(value: unknown, path: string, rule: TextRule = {}): string | undefined {
		if (typeof value !== 'string') return this.fail(path, 'is not a text');
		if (value.trim() === '' || value !== value.trim())
			return this.fail(path, 'is empty or has spaces around it');
		if (rule.max !== undefined && value.length > rule.max)
			return this.fail(path, `is longer than ${rule.max} characters`);
		if (rule.pattern && !rule.pattern.test(value))
			return this.fail(path, `does not match ${rule.pattern}`);
		return value;
	}

	optionalText(value: unknown, path: string, rule: TextRule = {}): string | null {
		return value === undefined ? null : (this.text(value, path, rule) ?? null);
	}

	texts(value: unknown, path: string, rule: TextRule = {}): string[] {
		if (value === undefined) return [];
		return this.list(value, path, (item, itemPath) => this.text(item, itemPath, rule));
	}

	integer(value: unknown, path: string, min?: number): number | undefined {
		if (typeof value !== 'number' || !Number.isInteger(value))
			return this.fail(path, 'is not a whole number');
		if (min !== undefined && value < min) return this.fail(path, `is less than ${min}`);
		return value;
	}

	year(value: unknown, path: string): number | null {
		if (value === undefined) return null;
		const year = this.integer(value, path);
		if (year === 0) return this.fail(path, 'is the year 0, which does not exist') ?? null;
		return year ?? null;
	}

	flag(value: unknown, path: string): boolean {
		if (value === undefined) return false;
		if (typeof value !== 'boolean') return this.fail(path, 'is not true or false') ?? false;
		return value;
	}

	choice<T extends string>(value: unknown, path: string, allowed: readonly T[]): T | undefined {
		if (typeof value === 'string' && (allowed as readonly string[]).includes(value))
			return value as T;
		return this.fail(path, `is not one of ${allowed.join(', ')}`);
	}

	optionalChoice<T extends string>(value: unknown, path: string, allowed: readonly T[]): T | null {
		return value === undefined ? null : (this.choice(value, path, allowed) ?? null);
	}

	list<T>(
		value: unknown,
		path: string,
		item: (value: unknown, path: string) => T | undefined,
		max?: number
	): T[] {
		if (!Array.isArray(value)) return this.fail(path, 'is not a list') ?? [];
		if (max !== undefined && value.length > max) this.fail(path, `has more than ${max} items`);
		return value.flatMap((entry, index) => {
			const read = item(entry, `${path}[${index}]`);
			return read === undefined ? [] : [read];
		});
	}

	uniqueIds(entries: readonly { id: string }[], path: string): void {
		const seen = new Set<string>();
		for (const { id } of entries) {
			if (seen.has(id)) this.fail(path, `repeats the id "${id}"`);
			seen.add(id);
		}
	}

	yearSpan(from: number | null, to: number | null, path: string): void {
		if (from !== null && to !== null && from > to) this.fail(path, 'starts after it ends');
	}
}
