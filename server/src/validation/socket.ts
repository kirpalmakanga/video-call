import { object, string, boolean } from 'yup';

export const participantSchema = object({
    id: string().required('Participant id is required'),
    name: string().required('Participant name is required'),
    isMuted: boolean().required('Participant muted status is required')
}).exact();

export const connectedParticipantSchema = object({
    roomId: string().required('Room ID is required'),
    participant: participantSchema
}).exact();
