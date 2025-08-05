import { ref } from 'vue';
import { update } from '../utils/helpers';

export function useParticipantsList() {
    const participants = ref<ClientParticipant[]>([]);

    return {
        participants,
        hasParticipant(participantId: string) {
            return participants.value.some(({ id }) => id === participantId);
        },
        addParticipant(participant: ClientParticipant) {
            participants.value.push(participant);
        },
        updateParticipant(participant: ClientParticipant) {
            participants.value = update(
                participants.value,
                ({ id }) => id === participant.id,
                participant
            );
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
