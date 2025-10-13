import { ref } from 'vue';
import { update } from '../utils/helpers';

export function useParticipantsList() {
    const participants = ref<ClientParticipant[]>([]);

    return {
        participants,
        setParticipant(participant: ClientParticipant) {
            if (participants.value.some(({ id }) => id === participant.id)) {
                participants.value = update(
                    participants.value,
                    ({ id }) => id === participant.id,
                    participant
                );
            } else {
                participants.value.push(participant);
            }
        },
        removeParticipant(participantId: string) {
            participants.value = participants.value.filter(
                ({ id }) => id !== participantId
            );
        },
        toggleMuteParticipant(participantId: string) {
            const participant = participants.value.find(
                ({ id }) => id === participantId
            );

            if (participant) {
                participant.isLocallyMuted = !participant.isLocallyMuted;
            }
        },
        clearParticipants() {
            participants.value = [];
        }
    };
}
