interface ThrottleOptions {
    start?: boolean;
    middle?: boolean;
    once?: boolean;
}

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
