"use client";

import { Copy, Share2 } from "lucide-react";

export default function ShareLink({ link }: { link: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Share2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Invite Friends</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={link}
          readOnly
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
        />

        <button
          onClick={() => {
            navigator.clipboard.writeText(link);
            alert("Link copied to clipboard!");
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
      </div>
    </div>
  );
}
