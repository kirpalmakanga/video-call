export function captureError(error: string | Error) {
    let err = error instanceof Error ? error : new Error(error);

    console.error(err);
}
