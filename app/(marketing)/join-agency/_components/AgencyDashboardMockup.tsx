"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Plus, Pencil } from "lucide-react";

const AgencyDashboardMockup = () => {
  const profiles = [
    { name: "Profile A", location: "Nairobi", status: "Active", verified: true },
    { name: "Profile B", location: "Mombasa", status: "Active", verified: true },
    { name: "Profile C", location: "Kisumu", status: "Pending", verified: false },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-slate-800 to-slate-600 p-6">
          <h3 className="text-xl font-bold text-white">Agency Dashboard</h3>
          <p className="text-white/70 text-sm">Manage your portfolio</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-xs text-gray-500">Total Profiles</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">10</p>
              <p className="text-xs text-gray-500">Active Profiles</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">2</p>
              <p className="text-xs text-gray-500">Pending Profiles</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-gray-900 flex items-center justify-center gap-1">
                <CheckCircle2 className="size-4 text-green-600" />
                Verified
              </p>
              <p className="text-xs text-gray-500">Agency Status</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            {profiles.map((profile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{profile.name}</p>
                  <p className="text-xs text-gray-500">{profile.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={profile.status === "Active" ? "default" : "secondary"}>
                    {profile.status}
                  </Badge>
                  {profile.verified && (
                    <CheckCircle2 className="size-4 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 rounded-md">
              <Plus className="size-4 mr-1" />
              Add Profile
            </Button>
            <Button size="sm" variant="ghost" className="rounded-md">
              <Pencil className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute -z-10 -inset-4 bg-slate-500/10 rounded-3xl blur-2xl" />
    </div>
  );
};

export default AgencyDashboardMockup;
