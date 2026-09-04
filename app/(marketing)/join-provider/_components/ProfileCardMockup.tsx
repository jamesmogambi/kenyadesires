"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import React from "react";

const ProfileCardMockup = () => {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="relative h-32 bg-gradient-to-r from-primary/80 to-primary/40">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center overflow-hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-10 h-10 text-gray-400"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="pt-12 pb-6 px-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-bold text-gray-900">Profile Name</h3>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="size-3.5 text-green-600" />
              Verified
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mb-3">Nairobi, Kenya</p>
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            Professional profile on KenyaDesires. Create your presence and connect
            with visitors across Kenya.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              Profile Active
            </span>
            <Button size="sm" variant="outline" className="rounded-md">
              View Profile
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute -z-10 -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
    </div>
  );
};

export default ProfileCardMockup;
