import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones,
  Mic,
  Calendar,
  User,
  Target,
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { AudioPlayer } from '../../components/ui/AudioPlayer';
import { attemptService } from '../../services/attemptService';
import { patientService } from '../../services/patientService';
import { formatDateTime, formatTimeAgo, formatDuration } from '../../utils/formatters';

export function AttemptReviewPage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attList, pList] = await Promise.all([
        attemptService.getAllAttempts(),
        patientService.getPatients(),
      ]);
      setAttempts(attList);
      setPatients(pList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAttempts = attempts.filter((att) => {
    const matchesPatient = selectedPatientId === 'ALL' || att.patientId === selectedPatientId;
    const matchesSearch =
      att.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      att.targetText?.toLowerCase().includes(search.toLowerCase()) ||
      att.transcript?.toLowerCase().includes(search.toLowerCase());
    return matchesPatient && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Headphones className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
              Attempt Review & Clinical Listening
            </h1>
          </div>
          <p className="text-sm text-[#687386] mt-1">
            Listen to recorded audio submissions, examine acoustic waveforms, and evaluate target articulation
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, target sound, or transcript..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-[#E5E9F2] rounded-lg text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#5865E8]"
            />
          </div>

          <Select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Patients' },
              ...patients.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
      </Card>

      {/* Attempts List */}
      <div className="space-y-4">
        {filteredAttempts.length > 0 ? (
          filteredAttempts.map((att) => (
            <Card key={att.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E5E9F2]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-[#5865E8] font-bold flex items-center justify-center text-sm">
                    {att.patient?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#172033]">{att.patient?.name || 'Patient'}</h3>
                    <p className="text-xs text-[#687386]">
                      {att.exercise?.title || 'Speech Practice'} • {formatDateTime(att.createdAt)} (
                      {formatTimeAgo(att.createdAt)})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="teal">{att.target?.type || 'TARGET'}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/therapist/patients/${att.patientId}`)}
                  >
                    Patient Profile
                  </Button>
                </div>
              </div>

              {/* Audio Player */}
              <div>
                <AudioPlayer
                  src={att.audioBlobUrl}
                  speechText={att.targetText}
                  title={`Spoken Articulation: "${att.transcript || att.targetText}"`}
                />
              </div>

              {/* Comparison & Evidence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Prescribed Target Text
                  </span>
                  <div className="font-mono text-base font-bold text-[#172033] bg-white p-2.5 rounded-lg border border-slate-200">
                    {att.targetText || att.target?.value}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Recognized Speech Transcript
                  </span>
                  <div className="font-mono text-base font-bold text-emerald-800 bg-white p-2.5 rounded-lg border border-slate-200">
                    {att.transcript || 'Speech detected'}
                  </div>
                </div>

                {att.recognitionEvidence && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-600 block mb-1">
                      Acoustic & Phonetic Observation Evidence (Mock ASR Pre-Processing):
                    </span>
                    <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                      {att.recognitionEvidence}
                    </p>
                  </div>
                )}
              </div>

              {/* Therapist Observation Notes */}
              {att.notes && (
                <div className="text-xs text-slate-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                  <span className="font-semibold text-[#5865E8]">Therapist Note: </span>
                  {att.notes}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="text-center py-16 text-xs text-[#687386]">
            No recorded attempts found matching your filter criteria.
          </Card>
        )}
      </div>
    </div>
  );
}
