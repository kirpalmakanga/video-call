interface ThrottleOptions {
    start?: boolean;
    middle?: boolean;
    once?: boolean;
}

interface Throttler<T extends unknown[]> {
    (...args: T): void;
    cancel(): void;
}

export const throttle = <T extends unknown[]>(
    callback: (...args: T) => unknown,
    wait = 0,
    { start = true, middle = true, once = false }: ThrottleOptions = {}
): Throttler<T> => {
    let last = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function fn(this: unknown, ...args: T) {
        if (cancelled) return;

        const delta = Date.now() - last;

        last = Date.now();

        if (start) {
            start = false;

            callback.apply(this, args);

            if (once) fn.cancel();
        } else if ((middle && delta < wait) || !middle) {
            clearTimeout(timer);

            timer = setTimeout(
                () => {
                    last = Date.now();
                    callback.apply(this, args);
                    if (once) fn.cancel();
                },
                !middle ? wait : wait - delta
            );
        }
    }

    fn.cancel = () => {
        clearTimeout(timer);

        cancelled = true;
    };

    return fn;
};

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

export function debounce<A extends unknown[]>(
    callback: (...args: A) => void,
    delay: number
) {
    let timer: ReturnType<typeof setTimeout>;

    return (...args: A) => {
        if (timer) clearTimeout(timer);

        timer = setTimeout(() => callback(...args), delay);
    };
}
