"use client";

import { useState, useEffect } from "react";

export default function ZohoConnectPage() {
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSuccess = params.get("success");
    const urlError = params.get("error");

    if (urlSuccess === "true") {
      setSuccess(true);
    }

    if (urlError) {
      setError(urlError);
    }

    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const response = await fetch("/api/zoho/test");
      const data = await response.json();
      setConnected(data.connected || false);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/zoho/test");
      const data = await response.json();
      setTestResult(data);
    } catch {
      setTestResult({
        success: false,
        connected: false,
        error: "Test failed",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Zoho CRM Integration</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Zoho CRM Connected Successfully
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error === "denied"
            ? "Authorization was denied. Please try again."
            : error === "missing_code"
              ? "Authorization code was missing. Please try again."
              : error === "exchange_failed"
                ? "Failed to exchange authorization code. Please try again."
                : "An error occurred."}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Checking connection status...</p>
      ) : !connected ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-gray-600 mb-4">
            Connect your Zoho CRM account to enable integration with
            KenyaDesires.
          </p>
          <a
            href="/api/zoho/authorize"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Connect Zoho CRM
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-green-500 text-xl">&#10003;</span>
            <h2 className="text-xl font-semibold">Connected</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Your Zoho CRM account is connected. Test the connection to verify
            everything is working.
          </p>
          <button
            onClick={testConnection}
            disabled={testing}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>
      )}

      {testResult && (
        <div
          className={`rounded-lg shadow p-6 mb-6 ${
            testResult.success ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <h2 className="text-xl font-semibold mb-4">
            {testResult.success
              ? "Connection Test Passed"
              : "Connection Test Failed"}
          </h2>
          {testResult.success ? (
            <div>
              <p className="text-green-700 mb-2">
                {testResult.message}
              </p>
              {testResult.data && (
                <pre className="text-sm bg-white p-3 rounded overflow-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <p className="text-red-600">{testResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
