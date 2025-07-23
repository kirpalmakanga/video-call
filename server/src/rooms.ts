import { update } from './utils';

const rooms = new Map<string, Room>([
    [
        'room1',
        {
            id: 'room1',
            name: 'Room 1',
            participants: []
        }
    ]
]);

export function getAllRooms() {
    return [
        ...rooms.values().map(({ id, name, participants }) => ({
            id,
            name,
            participantCount: participants.length
        }))
    ];
}

export function getRoomById(id: string) {
    return rooms.get(id);
}

export function getParticipantsForRoom(roomId: string) {
    const room = getRoomById(roomId);

    if (room) {
        return room.participants;
    } else {
        throw new Error(`Target room doesn't exist.`);
    }
}

export function getParticipantIds(roomId: string) {
    return getParticipantsForRoom(roomId).map(({ id }) => id);
}

export function isParticipantInRoom(participantId: string, roomId: string) {
    return getParticipantIds(roomId).includes(participantId);
}

export function areParticipantsInRoom(
    participantIds: string[],
    roomId: string
) {
    const roomParticipantIds = getParticipantIds(roomId);

    return participantIds.every((id) => roomParticipantIds.includes(id));
}

export function updateRoom(roomId: string, data: Partial<Room>) {
    const room = rooms.get(roomId);

    if (room) {
        rooms.set(roomId, {
            ...room,
            ...data
        });
    } else {
        throw new Error(`This room doesn't exist.`);
    }
}

export function addParticipantToRoom(participant: Participant, roomId: string) {
    if (isParticipantInRoom(participant.id, roomId)) {
        throw Error('Target user is already in this room.');
    } else {
        updateRoom(roomId, {
            participants: [...getParticipantsForRoom(roomId), participant]
        });
    }
}

export function updateRoomParticipant(
    participantId: string,
    roomId: string,
    data: Partial<Participant>
) {
    if (isParticipantInRoom(participantId, roomId)) {
        updateRoom(roomId, {
            participants: update(
                getParticipantsForRoom(roomId),
                ({ id }) => id === participantId,
                data
            )
        });
    } else {
        throw Error('Target user is not in the room.');
    }
}

export function removeParticipantFromRoom(
    participantId: string,
    roomId: string
) {
    if (isParticipantInRoom(participantId, roomId)) {
        updateRoom(roomId, {
            participants: getParticipantsForRoom(roomId).filter(
                ({ id }) => id !== participantId
            )
        });
    } else {
        throw Error('Target user is not in the room.');
    }
}
