// app/admin/fix-tokens/page.tsx
"use client";

import { useState, useEffect } from "react";

export default function FixTokensPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [escortId, setEscortId] = useState("");
  const [detailed, setDetailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalFixed, setTotalFixed] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [startAfter, setStartAfter] = useState<string | null>(null);

  // Check status of images
  const checkStatus = async (resetStartAfter = true) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (escortId) params.append("escortId", escortId);
      if (detailed) params.append("detailed", "true");
      if (startAfter && !resetStartAfter)
        params.append("startAfter", startAfter);
      params.append("limit", "100"); // Check 100 at a time

      const response = await fetch(
        `/api/fix-image-tokens?${params.toString()}`,
      );
      const data = await response.json();

      if (resetStartAfter) {
        setStatus(data);
        setStartAfter(null);
      } else {
        // Append to existing status
        setStatus((prev: any) => ({
          ...prev,
          summary: {
            ...prev.summary,
            totalInBatch: prev.summary.totalInBatch + data.summary.totalInBatch,
            withToken: prev.summary.withToken + data.summary.withToken,
            withoutToken: prev.summary.withoutToken + data.summary.withoutToken,
            hasMore: data.summary.hasMore,
            nextStartAfter: data.summary.nextStartAfter,
          },
          filesWithoutToken: [
            ...(prev.filesWithoutToken || []),
            ...(data.filesWithoutToken || []),
          ],
        }));
        setStartAfter(data.summary.nextStartAfter);
      }
    } catch (error) {
      console.error("Error checking status:", error);
      alert("Failed to check status");
    } finally {
      setLoading(false);
    }
  };

  // Load all statuses in batches
  const loadAllStatus = async () => {
    setLoading(true);
    setStatus(null);
    setStartAfter(null);

    let hasMore = true;
    let currentStartAfter = null;

    while (hasMore) {
      try {
        const params = new URLSearchParams();
        if (escortId) params.append("escortId", escortId);
        if (detailed) params.append("detailed", "true");
        if (currentStartAfter) params.append("startAfter", currentStartAfter);
        params.append("limit", "100");

        const response = await fetch(
          `/api/fix-image-tokens?${params.toString()}`,
        );
        const data = await response.json();

        if (!status) {
          setStatus(data);
        } else {
          setStatus((prev: any) => ({
            ...prev,
            summary: {
              ...prev.summary,
              totalInBatch:
                prev.summary.totalInBatch + data.summary.totalInBatch,
              withToken: prev.summary.withToken + data.summary.withToken,
              withoutToken:
                prev.summary.withoutToken + data.summary.withoutToken,
              hasMore: data.summary.hasMore,
              nextStartAfter: data.summary.nextStartAfter,
            },
            filesWithoutToken: [
              ...(prev.filesWithoutToken || []),
              ...(data.filesWithoutToken || []),
            ],
          }));
        }

        hasMore = data.summary.hasMore;
        currentStartAfter = data.summary.nextStartAfter;
        setStartAfter(currentStartAfter);

        // Update progress
        setProgress(Math.min((data.summary.totalInBatch / 100) * 100, 100));
      } catch (error) {
        console.error("Error loading batch:", error);
        break;
      }
    }

    setLoading(false);
  };

  // Fix tokens with progress
  const fixTokens = async (dryRun = false) => {
    setProcessing(true);
    setResult(null);
    setProgress(0);
    setTotalFixed(0);

    let hasMore = true;
    let currentStartAfter = null;
    let batchNumber = 0;
    let totalFixedCount = 0;
    let totalAlreadyHaveToken = 0;
    let totalErrors = 0;
    let allDetails: any[] = [];

    while (hasMore) {
      batchNumber++;
      try {
        const response: Response = await fetch("/api/fix-image-tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            escortId: escortId || undefined,
            dryRun,
            batchSize: 50,
            startAfter: currentStartAfter,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        // Accumulate results
        totalFixedCount += data.results.fixed;
        totalAlreadyHaveToken += data.results.alreadyHaveToken;
        totalErrors += data.results.errors;
        allDetails = [...allDetails, ...data.results.details];

        // Update progress
        setProgress(Math.min(((batchNumber * 50) / 1000) * 100, 100));
        setTotalFixed(totalFixedCount);

        // Check if there are more files
        hasMore = data.results.hasMore;
        currentStartAfter = data.results.nextStartAfter;
        setStartAfter(currentStartAfter);

        // Update result progressively
        setResult({
          success: true,
          message: dryRun ? "Dry run in progress..." : "Fixing in progress...",
          results: {
            totalProcessed:
              totalFixedCount + totalAlreadyHaveToken + totalErrors,
            fixed: totalFixedCount,
            alreadyHaveToken: totalAlreadyHaveToken,
            errors: totalErrors,
            details: allDetails.slice(-20), // Show last 20
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        console.error("Error in batch:", error);
        alert(`Error in batch ${batchNumber}: ${error.message}`);
        break;
      }
    }

    setProcessing(false);

    // Refresh status after fixing
    if (!dryRun) {
      await checkStatus(true);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Fix Image Tokens</h1>

      {/* Status Check */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Check Status</h2>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Escort ID (optional)"
            value={escortId}
            onChange={(e) => setEscortId(e.target.value)}
            className="flex-1 min-w-50 px-3 py-2 border rounded"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={detailed}
              onChange={(e) => setDetailed(e.target.checked)}
            />
            Show detailed info
          </label>
          <button
            onClick={() => checkStatus(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
          <button
            onClick={loadAllStatus}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load All"}
          </button>
        </div>

        {status && (
          <div className="mt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Total in Batch</p>
                <p className="text-2xl font-bold">
                  {status.summary.totalInBatch}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <p className="text-sm text-gray-600">✅ With Token</p>
                <p className="text-2xl font-bold text-green-600">
                  {status.summary.withToken}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded">
                <p className="text-sm text-gray-600">❌ Without Token</p>
                <p className="text-2xl font-bold text-red-600">
                  {status.summary.withoutToken}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold text-blue-600">
                  {status.summary.totalSize}
                </p>
              </div>
            </div>

            <p
              className={`text-sm ${status.summary.withoutToken > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {status.summary.message}
            </p>
            {status.summary.hasMore && (
              <p className="text-sm text-blue-600 mt-1">
                ⚡ More files available. Use "Load All" to fetch all.
              </p>
            )}

            {/* Simple file list */}
            {!detailed &&
              status.filesWithoutToken &&
              status.filesWithoutToken.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded max-h-40 overflow-y-auto">
                  <p className="font-semibold text-red-600">
                    Files needing tokens:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                    {status.filesWithoutToken
                      .slice(0, 20)
                      .map((file: string, index: number) => (
                        <li key={index} className="font-mono text-xs">
                          {file}
                        </li>
                      ))}
                    {status.filesWithoutToken.length > 20 && (
                      <li className="text-blue-600">
                        ... and {status.filesWithoutToken.length - 20} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Fix Tokens */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">2. Fix Tokens</h2>

        {(processing || loading) && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {processing ? `Fixed ${totalFixed} images...` : "Loading..."}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => fixTokens(true)}
            disabled={processing || loading}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            {processing ? "Running..." : "Dry Run"}
          </button>
          <button
            onClick={() => fixTokens(false)}
            disabled={processing || loading || !status?.summary?.withoutToken}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {processing
              ? "Fixing..."
              : `Fix ${status?.summary?.withoutToken || 0} Images`}
          </button>
          {processing && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {escortId
            ? `Fixing tokens for: ${escortId}`
            : "Fixing tokens for ALL images"}
          {status?.summary?.hasMore && " (processing in batches)"}
        </p>
        {status?.summary?.withoutToken === 0 && (
          <p className="text-sm text-green-600 mt-2">
            ✅ All images already have tokens!
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>

          {result.success ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-sm text-gray-600">Fixed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {result.results.fixed}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Already Had Token</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {result.results.alreadyHaveToken}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">
                    {result.results.errors}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Total processed:{" "}
                {result.results.totalProcessed ||
                  result.results.fixed +
                    result.results.alreadyHaveToken +
                    result.results.errors}
              </p>

              {result.results.details && result.results.details.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-600 hover:underline">
                    View Last {result.results.details.length} Files
                  </summary>
                  <div className="mt-2 max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">File</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.results.details.map(
                          (detail: any, index: number) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2 font-mono text-xs truncate max-w-xs">
                                {detail.file}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    detail.status === "fixed"
                                      ? "bg-green-100 text-green-700"
                                      : detail.status === "already-has-token"
                                        ? "bg-blue-100 text-blue-700"
                                        : detail.status === "would-fix"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {detail.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {detail.token ||
                                  detail.error ||
                                  detail.message ||
                                  "-"}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          ) : (
            <div className="p-4 bg-red-50 text-red-600 rounded">
              Error: {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
