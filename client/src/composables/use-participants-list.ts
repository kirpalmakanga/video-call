import { ref } from 'vue';
import { update } from '../utils/helpers';

export function useParticipantsList() {
    const participants = ref<ClientParticipant[]>([]);

    function matchParticipant(targetParticipantId: string) {
        return ({ id }: ClientParticipant) => id === targetParticipantId;
    }

    return {
        participants,
        setParticipant: (participant: ClientParticipant) => {
            if (participants.value.some(matchParticipant(participant.id))) {
                participants.value = update(
                    participants.value,
                    matchParticipant(participant.id),
                    participant
                );
            } else {
                participants.value.push(participant);
            }
        },
        removeParticipant: (targetParticipantId: string) => {
            participants.value = participants.value.filter(
                (participant) => !matchParticipant(targetParticipantId)(participant)
            );
        },
        toggleMuteParticipant: (targetParticipantId: string) => {
            const participant = participants.value.find(matchParticipant(targetParticipantId));

            if (participant) {
                participant.isLocallyMuted = !participant.isLocallyMuted;
            }
        },
        clearParticipants: () => {
            participants.value = [];
        }
    };
}
