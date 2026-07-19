"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const UserForm = () => {
  const { user, isLoaded } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoaded || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-5 px-3">
      <div className="border border-white"></div>
      <h5 className="text-center text-2xl font-bold">Change password</h5>
      <div className="flex text-lg items-center gap-2">
        <label className="  font-bold">Username:</label>
        <p className="text-white font-bold">
          {user.username || user.firstName || "—"}
        </p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-4"
        >
          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
        </svg>
      </div>

      <div className="space-y-2">
        <label className="text-white/40 text-base font-medium">Email</label>
        <p className="text-white text-lg font-semibold">
          {user.primaryEmailAddress?.emailAddress || "—"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div className="space-y-2">
          <label className="text-white/40 text-base font-medium">
            Current Password
          </label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="bg-white text-black rounded-full px-6 h-10"
            placeholder="Enter current password"
          />
        </div>

        <div className="space-y-2">
          <label className="text-white/40 text-base font-medium">
            New Password
          </label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-white text-black rounded-full px-6 h-10"
            placeholder="Enter new password"
          />
        </div>

        <div className="space-y-2">
          <label className="text-white/40 text-base font-medium">
            Confirm New Password
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-white text-black rounded-full px-6 h-10"
            placeholder="Confirm new password"
          />
        </div>

        {error && (
          <p className="p-3 bg-red-500 text-white text-center text-sm">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-none bg-primary text-white py-6 text-lg font-semibold"
        >
          {loading ? "Updating..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
};

export default UserForm;
