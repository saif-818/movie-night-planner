'use client';

import { Check, Clock } from 'lucide-react';

interface PreferenceStatusProps {
  total: number;
  completed: number;
  percentage: number;
}

export default function PreferenceStatus({
  total,
  completed,
  percentage,
}: PreferenceStatusProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Preference Collection
        </h3>
        <div className="flex items-center gap-2">
          {percentage === 100 ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Clock className="w-5 h-5 text-yellow-600" />
          )}
          <span className="text-sm font-medium text-gray-600">
            {completed}/{total} Complete
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-500 ${
            percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm text-gray-600 mt-3">
        {percentage === 100 ? (
          <span className="text-green-600 font-medium">
            ✓ Everyone has set their preferences!
          </span>
        ) : (
          `Waiting for ${total - completed} participant${
            total - completed !== 1 ? 's' : ''
          } to set preferences...`
        )}
      </p>
    </div>
  );
}