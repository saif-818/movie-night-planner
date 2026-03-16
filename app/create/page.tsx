import CreateRoomForm from '@/components/room/create-room-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateRoomPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Create a Movie Night Room
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Start a room and invite your friends to join
          </p>

          <CreateRoomForm />

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You'll get a shareable link to invite friends</li>
              <li>• Everyone sets their movie preferences</li>
              <li>• AI suggests perfect movies for your group</li>
              <li>• Vote on suggestions and pick a winner!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}