import { storage } from '../mocks/storage';
import { apiClient } from './apiClient';

export const attemptService = {
  async getAttemptsByPatient(patientId) {
    await apiClient.mockDelay(140);
    const attempts = storage.getAttempts();
    const exercises = storage.getExercises();
    const targets = storage.getTargets();

    const patientAttempts = attempts.filter((a) => a.patientId === patientId);

    return patientAttempts.map((att) => ({
      ...att,
      exercise: exercises.find((e) => e.id === att.exerciseId),
      target: targets.find((t) => t.id === att.targetId),
    }));
  },

  async getAllAttempts() {
    await apiClient.mockDelay(140);
    const attempts = storage.getAttempts();
    const exercises = storage.getExercises();
    const targets = storage.getTargets();
    const patients = storage.getPatients();

    return attempts.map((att) => ({
      ...att,
      patient: patients.find((p) => p.id === att.patientId),
      exercise: exercises.find((e) => e.id === att.exerciseId),
      target: targets.find((t) => t.id === att.targetId),
    }));
  },

  async createAttempt(payload) {
    await apiClient.mockDelay(180);
    const attempts = storage.getAttempts();
    const patients = storage.getPatients();

    const newAttempt = {
      id: `att-${Date.now()}`,
      patientId: payload.patientId,
      exerciseId: payload.exerciseId,
      targetId: payload.targetId,
      audioBlobUrl: payload.audioBlobUrl || null,
      recordingDuration: payload.recordingDuration || 2.5,
      targetText: payload.targetText || '',
      transcript: payload.transcript || payload.targetText || 'Spoken practice',
      recognitionEvidence: payload.recognitionEvidence || 'Speech waveform captured. Acoustic onset and phoneme duration logged.',
      notes: payload.notes || '',
      createdAt: new Date().toISOString(),
    };

    // Update patient's lastPracticeDate
    const updatedPatients = patients.map((p) => {
      if (p.id === payload.patientId) {
        return {
          ...p,
          lastPracticeDate: new Date().toISOString(),
        };
      }
      return p;
    });

    storage.setPatients(updatedPatients);
    storage.setAttempts([newAttempt, ...attempts]);

    return newAttempt;
  },
};
