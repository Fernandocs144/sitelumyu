/**
 * Avaliador determinístico da intenção de agendamento/reunião para a lead.
 * Função pura e síncrona.
 */

const ALLOWED_SIGNALS = [
  'accepted',
  'considering',
  'declined',
  'human_contact_requested',
];

export function evaluateMeetingIntent(meetingIntentSignal) {
  if (typeof meetingIntentSignal !== 'string' || !ALLOWED_SIGNALS.includes(meetingIntentSignal)) {
    return {
      intentLevel: null,
      nextStep: null,
      shouldUpdate: false,
    };
  }

  switch (meetingIntentSignal) {
    case 'accepted':
      return {
        intentLevel: 'high',
        nextStep: 'booking_pending',
        shouldUpdate: true,
      };
    case 'human_contact_requested':
      return {
        intentLevel: 'high',
        nextStep: 'human_contact_requested',
        shouldUpdate: true,
      };
    case 'considering':
      return {
        intentLevel: 'medium',
        nextStep: 'follow_up_later',
        shouldUpdate: true,
      };
    case 'declined':
      return {
        intentLevel: 'low',
        nextStep: 'follow_up_later',
        shouldUpdate: true,
      };
    default:
      return {
        intentLevel: null,
        nextStep: null,
        shouldUpdate: false,
      };
  }
}
