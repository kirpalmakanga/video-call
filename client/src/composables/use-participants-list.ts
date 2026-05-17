import { ref } from 'vue';
import { update } from '../utils/helpers';
import { captureError } from '../../../utils/error';

export function useParticipantsList() {
    const participants = ref<ClientParticipant[]>([]);

    function matchParticipant(targetParticipantId: string) {
        return ({ id }: ClientParticipant) => id === targetParticipantId;
    }

    function hasParticipant(targetParticipantId: string) {
        return participants.value.some(matchParticipant(targetParticipantId));
    }

    function participantNotFound() {
        captureError(`Participant doesn't exist or has already been removed.`);
    }

    return {
        participants,
        setParticipant: (participant: ClientParticipant) => {
            if (hasParticipant(participant.id)) {
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
            if (hasParticipant(targetParticipantId)) {
                participants.value = participants.value.filter(
                    (participant) => !matchParticipant(targetParticipantId)(participant)
                );
            } else {
                participantNotFound();
            }
        },
        toggleMuteParticipant: (targetParticipantId: string) => {
            if (hasParticipant(targetParticipantId)) {
                participants.value = update(
                    participants.value,
                    matchParticipant(targetParticipantId),
                    ({ isLocallyMuted }) => ({ isLocallyMuted: !isLocallyMuted })
                );
            } else {
                participantNotFound();
            }
        },
        clearParticipants: () => {
            participants.value = [];
        }
    };
}
