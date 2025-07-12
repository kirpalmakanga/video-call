export const setStorageItem = (
    key: string,
    value: string | number | Record<string, string | number>
) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
};

export const getStorageItem = (key: string) => {
    try {
        const serialized = localStorage.getItem(key);

        return serialized === null ? undefined : JSON.parse(serialized);
    } catch (error) {
        return undefined;
    }
};
