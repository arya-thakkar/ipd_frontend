import React, { useState, useEffect } from 'react';
import { Headphones, Calendar, Clock, Mic, Volume2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { AudioPlayer } from '../../components/ui/AudioPlayer';
import { attemptService } from '../../services/attemptService';
import { storage } from '../../mocks/storage';
import { formatDateTime, formatTimeAgo, formatDuration } from '../../utils/formatters';

export function PracticeHistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const activePatientId = storage.getActivePatientId();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await attemptService.getAttemptsByPatient(activePatientId);
        setAttempts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activePatientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-xs text-[#687386]">
        Loading your practice history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">My Practice History</h1>
        <p className="text-sm text-[#687386] mt-1">
          Review your past speech recordings and practice sessions
        </p>
      </div>

      <div className="space-y-4">
        {attempts.length > 0 ? (
          attempts.map((att) => (
            <Card key={att.id} className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[#172033]">"{att.targetText}"</span>
                    <Badge variant="teal">{att.target?.type || 'Practice'}</Badge>
                  </div>
                  <p className="text-xs text-[#687386] mt-0.5">{att.exercise?.title}</p>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-400">
                  <span>{formatDateTime(att.createdAt)}</span>
                  <span className="block text-[11px] font-mono">
                    Duration: {formatDuration(att.recordingDuration || 2)}
                  </span>
                </div>
              </div>

              {/* Audio playback */}
              <AudioPlayer
                src={att.audioBlobUrl}
                speechText={att.targetText}
                title={`Playback: "${att.targetText}"`}
              />
            </Card>
          ))
        ) : (
          <Card className="text-center py-16 text-xs text-[#687386]">
            No recorded practice attempts yet. Choose an exercise from "My Practice" to record!
          </Card>
        )}
      </div>
    </div>
  );
}
