'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PreferenceForm from '@/components/preferences/preference-form';
import PreferenceSummary from '@/components/preferences/preference-summary';
import PreferenceStatus from '@/components/preferences/preference-status';
import { useRoomUpdates } from '@/hooks/useRoomUpdates';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface PreferencesPageClientProps {
  roomId: string;
  room: any;
  initialStatus: any;
}

export default function PreferencesPageClient({
  roomId,
  room,
  initialStatus,
}: PreferencesPageClientProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [aggregated, setAggregated] = useState(null);
  const [status, setStatus] = useState(initialStatus);
  const [showForm, setShowForm] = useState(true);
  const { events } = useRoomUpdates(roomId);
  const router = useRouter();

  // Get current user from localStorage
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    setCurrentUserId(userId);

    if (!userId) {
      router.push(`/room/${roomId}`);
      return;
    }

    // Fetch user's existing preferences
    fetchUserPreferences(userId);
  }, []);

  const fetchUserPreferences = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/rooms/${roomId}/preferences?userId=${userId}`
      );
      const data = await response.json();
      if (data.preferences) {
        setUserPreferences(data.preferences);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const fetchAggregated = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/preferences`);
      const data = await response.json();
      if (data.aggregated) {
        setAggregated(data.aggregated);
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching aggregated preferences:', error);
    }
  };

  // Handle real-time preference updates
  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent = events[events.length - 1];

    if (latestEvent.type === 'PREFERENCE_UPDATED') {
      fetchAggregated();
    }
  }, [events]);

  // Fetch aggregated on mount if at least one person has set preferences
  useEffect(() => {
    if (status.completed > 0) {
      fetchAggregated();
    }
  }, []);

  const handlePreferencesSaved = () => {
    setShowForm(false);
    fetchUserPreferences(currentUserId!);
    fetchAggregated();
  };

  const isHost = room.hostUserId === currentUserId;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/room/${roomId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Room
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Set Your Preferences
        </h1>
        <p className="text-gray-600">
          Tell us what you're in the mood for tonight
        </p>
      </div>

      {/* Status */}
      <div className="mb-6">
        <PreferenceStatus
          total={status.total}
          completed={status.completed}
          percentage={status.percentage}
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preference Form */}
        <div className="lg:col-span-2">
          {showForm ? (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <PreferenceForm
                roomId={roomId}
                userId={currentUserId!}
                initialPreferences={userPreferences}
                onSaved={handlePreferencesSaved}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Preferences Saved!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your movie preferences have been recorded.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Edit Preferences
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Aggregated Preferences */}
          {aggregated && <PreferenceSummary aggregated={aggregated} />}

          {/* Host Actions */}
          {isHost && status.allComplete && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <h4 className="font-semibold text-green-900 mb-2">
                Everyone's ready!
              </h4>
              <p className="text-sm text-green-800 mb-4">
                All participants have set their preferences. Ready to get AI suggestions?
              </p>
              <button
                onClick={() => alert('Phase 4: AI suggestions coming soon!')}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Get AI Suggestions
              </button>
            </div>
          )}

          {/* Waiting Message */}
          {!status.allComplete && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <h4 className="font-semibold text-yellow-900 mb-2">
                Waiting for others...
              </h4>
              <p className="text-sm text-yellow-800">
                {status.completed}/{status.total} participants have set their preferences.
                We'll notify everyone when ready!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}