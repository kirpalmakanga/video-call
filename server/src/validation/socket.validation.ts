import { object, string, number, boolean } from 'yup';

export const participantSchema = object({
    id: string().uuid().required('Participant id is required'),
    name: string().required('Participant name is required'),
    isMuted: boolean().required('Participant muted status is required')
}).exact();

export const connectParticipantSchema = object({
    roomId: string().uuid().required('Room ID is required'),
    participant: participantSchema
}).exact();

export const disconnectParticipantSchema = object({
    roomId: string().uuid().required('Room ID is required'),
    participantId: string().required('Participant ID is required')
}).exact();

const RTCSessionDescriptionInitSchema = object({
    sdp: string().required(),
    type: string().required()
})
    .exact()
    .required('Valid RTCSessionDescriptionInit required');

export const offerSchema = object({
    roomId: string().uuid().required('Room ID is required'),
    senderParticipantId: string()
        .uuid()
        .required('Sender participant ID is Required'),
    targetParticipantId: string()
        .uuid()
        .required('Target participant ID is Required'),
    offer: RTCSessionDescriptionInitSchema
}).exact();

export const answerSchema = object({
    roomId: string().uuid().required('Room ID is required'),

    senderParticipantId: string()
        .uuid()
        .required('Sender participant ID is Required'),
    targetParticipantId: string()
        .uuid()
        .required('Target participant ID is Required'),
    answer: RTCSessionDescriptionInitSchema
}).exact();

export const iceCandidateSchema = object({
    roomId: string().uuid().required('Room ID is required'),
    senderParticipantId: string()
        .uuid()
        .required('Sender participant ID is Required'),
    targetParticipantId: string()
        .uuid()
        .required('Target participant ID is Required'),
    sdpMLineIndex: number().required(),
    candidate: string().required()
}).exact();

export const syncParticipantSchema = object({
    roomId: string().uuid().required('Room ID is required'),
    participant: participantSchema
}).exact();
