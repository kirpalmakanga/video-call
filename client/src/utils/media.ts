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

export async function getAvailableDevices() {
    let devices: MediaDeviceInfo[] = [];

    try {
        devices = await mediaDevices.enumerateDevices();
    } catch (error) {
        console.error(error);
    } finally {
        //TODO: filter infrared or duplicates
        return devices;
    }
}

export function subscribeToDeviceChange(callback: () => void) {
    mediaDevices.addEventListener('devicechange', callback);

    return () => mediaDevices.removeEventListener('devicechange', callback);
}
