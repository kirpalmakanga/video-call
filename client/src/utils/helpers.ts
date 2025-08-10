export function omit<T extends object, K extends keyof T>(
    base: T,
    ...keys: K[]
): Omit<T, K> {
    if (keys.length) {
        const result = { ...base };

        for (const key of keys) delete result[key];

        return result;
    }

    return base;
}

export function pick<T extends object, K extends keyof T>(
    base: T,
    ...keys: K[]
): Pick<T, K> {
    if (!keys.length) return base;

    const entries = keys.map((key) => [key, base[key]]);

    return Object.fromEntries(entries);
}

export function mergeByKey<T extends object, K extends keyof T>(
    arr1: T[],
    arr2: T[],
    key: K
) {
    const temp: Map<T[K], T> = new Map(arr1.map((item) => [item[key], item]));

    for (const item of arr2) {
        const itemKey = item[key];

        temp.set(itemKey, { ...(temp.get(itemKey) || {}), ...item });
    }

    return [...temp.values()];
}

export function update<T extends object>(
    arr: T[],
    predicate: (item: T, index: number, array: T[]) => boolean,
    payload: Partial<T>
) {
    const targetIndex = arr.findIndex(predicate);

    if (targetIndex > -1) {
        return arr.with(targetIndex, { ...arr[targetIndex], ...payload } as T);
    }

    return arr;
}

export function isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    if (a == null || b == null) return a === b;

    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => isEqual(item, b[index]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a) as (keyof typeof a)[];
        const keysB = Object.keys(b) as (keyof typeof b)[];

        if (keysA.length !== keysB.length) return false;
        return keysA.every((key) => key in b && isEqual(a[key], b[key]));
    }

    return false;
}
