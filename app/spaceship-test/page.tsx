"use client";

import { useState } from "react";

interface TestResult {
  ok: boolean;
  status: number;
  endpoint: string;
  message: string;
  data: unknown;
}

export default function SpaceshipTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function runTest() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/spaceship-test", { method: "GET" });
      const data: TestResult = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        ok: false,
        status: 0,
        endpoint: "/api/spaceship-test",
        message: `Failed to reach local test endpoint: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Spaceship API Test</h1>
      <p className="text-sm text-gray-400 mb-6">
        Verifies that your Spaceship API credentials are valid and the API is
        reachable from the server.
      </p>

      <button
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Spaceship API Connection"}
      </button>

      {result && (
        <div className="mt-6 border rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-sm font-bold ${result.ok ? "text-green-500" : "text-red-500"}`}
            >
              {result.ok ? "✓ SUCCESS" : "✗ FAILED"}
            </span>
            <span className="text-sm text-gray-500">HTTP {result.status}</span>
          </div>

          <p className="text-sm mb-2">{result.message}</p>
          <p className="text-xs text-gray-500 mb-3">
            Endpoint: {result.endpoint}
          </p>

          {result.data !== null && (
            <div className="bg-gray-900 rounded p-3 overflow-auto max-h-60">
              <pre className="text-xs text-green-400">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
