const { mediaDevices } = navigator;

export function createStream(constraints: MediaStreamConstraints) {
    return mediaDevices.getUserMedia(constraints);
}

export function closeStream(stream: MediaStream) {
    stream.getTracks().map((track) => track.stop());
}

export async function getAudioTrack(deviceId: string) {
    const stream = await createStream({ audio: { deviceId } });

    const [track] = stream.getAudioTracks();

    return track;
}

export async function getVideoTrack(deviceId: string) {
    const stream = await createStream({ video: { deviceId } });

    const [track] = stream.getVideoTracks();

    return track;
}

export async function getAvailableDevices(deviceType: 'audio' | 'video') {
    let devices: Device[] = [];

    try {
        devices = (await mediaDevices.enumerateDevices())
            .filter(({ kind }) => kind === `${deviceType}input`)
            .map(({ deviceId: id, label }) => ({ id, label }));
    } catch (error) {
        console.error(error);
    } finally {
        //TODO: filter infrared or duplicates
        return devices;
    }
}
