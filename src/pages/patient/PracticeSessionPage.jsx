import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Volume2,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Heart,
  Smile,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { exerciseService } from '../../services/exerciseService';
import { targetService } from '../../services/targetService';
import { assignmentService } from '../../services/assignmentService';
import { attemptService } from '../../services/attemptService';
import { storage } from '../../mocks/storage';
import { formatDuration } from '../../utils/formatters';

const SUPPORTIVE_FEEDBACK_MESSAGES = [
  'Nice work completing your speech practice!',
  'Your practice recording has been saved for review.',
  'Great focus! Consistent practice builds vocal confidence.',
  'Well done on finishing this articulation exercise!',
];

export function PracticeSessionPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');
  const navigate = useNavigate();

  const [exercise, setExercise] = useState(null);
  const [target, setTarget] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Practice session state: 'PRACTICE' | 'FEEDBACK' | 'SESSION_COMPLETE'
  const [sessionPhase, setSessionPhase] = useState('PRACTICE');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [referencePlaying, setReferencePlaying] = useState(false);

  const activePatientId = storage.getActivePatientId();

  // Audio Recorder Hook
  const {
    recordingState,
    audioUrl,
    recordingDuration,
    audioLevel,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ex = await exerciseService.getExerciseById(id);
        setExercise(ex);

        if (ex.targetId) {
          const t = await targetService.getTargetById(ex.targetId);
          setTarget(t);
        }

        if (assignmentId) {
          const asList = await assignmentService.getAssignmentsByPatient(activePatientId);
          const foundAs = asList.find((a) => a.id === assignmentId);
          if (foundAs) setAssignment(foundAs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, assignmentId, activePatientId]);

  // Model reference audio player via SpeechSynthesis
  const playReferenceAudio = () => {
    const textToSpeak = exercise?.content?.prompt || target?.value;
    if (!textToSpeak || !window.speechSynthesis) return;

    if (referencePlaying) {
      window.speechSynthesis.cancel();
      setReferencePlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.85; // clean cadence for speech therapy
    utterance.pitch = 1.0;
    utterance.onstart = () => setReferencePlaying(true);
    utterance.onend = () => setReferencePlaying(false);
    utterance.onerror = () => setReferencePlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveAndContinue = async () => {
    try {
      setIsSaving(true);
      const targetPrompt = exercise?.content?.prompt || target?.value || 'Target';

      // Record attempt in service layer
      await attemptService.createAttempt({
        patientId: activePatientId,
        exerciseId: exercise.id,
        targetId: target?.id || exercise.targetId,
        audioBlobUrl: audioUrl,
        recordingDuration: recordingDuration || 2.5,
        targetText: targetPrompt,
        transcript: targetPrompt, // neutral mock transcript matching target
        recognitionEvidence: `Audio captured: ${formatDuration(recordingDuration || 2)} duration. Waveform energy centered on target articulation.`,
      });

      // If tied to an assignment, update completed repetitions
      if (assignmentId) {
        const updated = await assignmentService.recordPracticeAttempt(assignmentId);
        setAssignment(updated);

        if (updated?.status === 'COMPLETED') {
          setSessionPhase('SESSION_COMPLETE');
          setIsSaving(false);
          return;
        }
      }

      // Pick supportive neutral feedback
      const randomMsg =
        SUPPORTIVE_FEEDBACK_MESSAGES[
          Math.floor(Math.random() * SUPPORTIVE_FEEDBACK_MESSAGES.length)
        ];
      setFeedbackMessage(randomMsg);
      setSessionPhase('FEEDBACK');
    } catch (err) {
      console.error(err);
      alert('Failed to save attempt: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextRepetition = () => {
    resetRecording();
    setSessionPhase('PRACTICE');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-[#687386]">
        Setting up practice room...
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-[#687386]">Exercise not found.</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate('/patient/practice')}>
          Return to Practice List
        </Button>
      </div>
    );
  }

  const promptText = exercise.content?.prompt || target?.value || 'Target';
  const repetitionText = assignment
    ? `Repetition ${(assignment.completedRepetitions || 0) + 1} of ${assignment.repetitions || 5}`
    : 'Practice Repetition';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patient/practice')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#687386] hover:text-[#172033] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Exit Session
        </button>

        <span className="text-xs font-semibold text-[#2BAE9B] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
          {repetitionText}
        </span>
      </div>

      {/* PHASE 1: ACTIVE PRACTICE SESSION */}
      {sessionPhase === 'PRACTICE' && (
        <Card className="p-6 sm:p-10 space-y-8 text-center bg-white shadow-sm border-[#E5E9F2]">
          {/* Instructions header */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {exercise.title}
            </span>
            <p className="text-sm text-[#687386] max-w-lg mx-auto">
              {exercise.instructions || 'Listen to the example, shape your mouth, and speak clearly into your microphone.'}
            </p>
          </div>

          {/* Large Target Prompt Typography */}
          <div className="py-6 px-4 bg-gradient-to-br from-[#F7F8FC] to-white rounded-2xl border border-[#E5E9F2] shadow-2xs space-y-2">
            <div className="text-4xl sm:text-5xl font-black text-[#172033] tracking-tight font-sans">
              {promptText}
            </div>

            {exercise.content?.phonetic && (
              <p className="text-sm text-[#5865E8] font-mono font-semibold">
                {exercise.content.phonetic}
              </p>
            )}

            {/* Model Audio Listen Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={playReferenceAudio}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  referencePlaying
                    ? 'bg-[#EEF0FD] text-[#5865E8] ring-2 ring-[#5865E8]'
                    : 'bg-white border border-[#E5E9F2] text-[#687386] hover:text-[#172033] hover:bg-slate-50'
                }`}
              >
                <Volume2 className={`w-4 h-4 ${referencePlaying ? 'animate-pulse' : ''}`} />
                <span>{referencePlaying ? 'Playing Model Voice...' : 'Listen to Reference Audio'}</span>
              </button>
            </div>
          </div>

          {/* Friendly Error Display */}
          {errorMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-left text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Microphone Notice</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Recording Status & Controls */}
          <div className="space-y-6">
            {/* Live Audio Visualizer / Waveform simulator */}
            {recordingState === 'recording' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-1.5 h-10">
                  {[...Array(9)].map((_, i) => {
                    const heightPercent = Math.max(20, Math.min(100, audioLevel * (0.5 + (i % 3) * 0.25)));
                    return (
                      <span
                        key={i}
                        className="w-1.5 bg-[#DC5A65] rounded-full transition-all duration-75"
                        style={{ height: `${heightPercent}%` }}
                      />
                    );
                  })}
                </div>
                <div className="text-sm font-mono font-bold text-[#DC5A65] animate-pulse">
                  Recording... {formatDuration(recordingDuration)}
                </div>
              </div>
            )}

            {/* READY STATE: Big Tap to Record Button */}
            {recordingState === 'ready' && (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full bg-[#2BAE9B] hover:bg-[#238f80] text-white shadow-lg shadow-teal-200 flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  aria-label="Start recording"
                >
                  <Mic className="w-9 h-9" />
                </button>
                <span className="text-xs font-semibold text-[#687386]">Tap to Record</span>
              </div>
            )}

            {/* RECORDING STATE: Stop Button */}
            {recordingState === 'recording' && (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-full bg-[#DC5A65] hover:bg-red-700 text-white shadow-lg shadow-red-200 flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
                  aria-label="Stop recording"
                >
                  <Square className="w-8 h-8 fill-current" />
                </button>
                <span className="text-xs font-semibold text-[#DC5A65]">Tap to Stop</span>
              </div>
            )}

            {/* RECORDING STOPPED: Playback, Retry, Save */}
            {recordingState === 'stopped' && (
              <div className="space-y-6 pt-2">
                <div className="p-4 bg-slate-50 border border-[#E5E9F2] rounded-xl max-w-md mx-auto space-y-3">
                  <span className="text-xs font-semibold text-slate-500 block">
                    Your Recorded Articulation ({formatDuration(recordingDuration)})
                  </span>
                  {audioUrl && (
                    <audio controls className="w-full h-10" src={audioUrl}>
                      Your browser does not support audio playback.
                    </audio>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={resetRecording}
                    leftIcon={RotateCcw}
                    disabled={isSaving}
                  >
                    Retry Recording
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleSaveAndContinue}
                    isLoading={isSaving}
                    rightIcon={ArrowRight}
                  >
                    Save & Continue
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* PHASE 2: SUPPORTIVE NEUTRAL FEEDBACK */}
      {sessionPhase === 'FEEDBACK' && (
        <Card className="p-8 sm:p-12 text-center space-y-6 bg-white shadow-sm border-[#E5E9F2]">
          <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 text-[#2BAE9B] flex items-center justify-center mx-auto shadow-xs">
            <Heart className="w-8 h-8 fill-current" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-[#172033]">Great Effort!</h2>
            <p className="text-sm text-[#687386] leading-relaxed">{feedbackMessage}</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 max-w-sm mx-auto">
            Target prompt: <span className="font-bold text-[#172033]">"{promptText}"</span>
            <br />
            {repetitionText} logged for therapist review.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button variant="outline" onClick={handleNextRepetition} leftIcon={RotateCcw}>
              Practise Another Repetition
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/patient/practice')}
              rightIcon={ArrowRight}
            >
              Back to My Practice
            </Button>
          </div>
        </Card>
      )}

      {/* PHASE 3: SESSION COMPLETED CELEBRATION */}
      {sessionPhase === 'SESSION_COMPLETE' && (
        <Card className="p-8 sm:p-12 text-center space-y-6 bg-white shadow-sm border-[#E5E9F2]">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#172033]">
              Practice Goal Accomplished!
            </h2>
            <p className="text-sm text-[#687386] leading-relaxed">
              You completed all required repetitions for{' '}
              <span className="font-semibold text-[#172033]">{exercise.title}</span>. Your therapist will be able to review your practice recordings.
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/patient/home')}
              rightIcon={ArrowRight}
            >
              Return to Home
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
