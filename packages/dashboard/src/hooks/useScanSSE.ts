import { useState, useCallback, useRef } from "react";
import type { ScanResult, Finding, WCAGStandard, Viewport } from "../types";

interface ScanProgress {
  status:
    | "idle"
    | "connecting"
    | "scanning"
    | "processing"
    | "complete"
    | "error"
    | "cancelled";
  percent: number;
  message: string;
}

interface UseScanSSEOptions {
  onFinding?: (finding: Finding) => void;
  onProgress?: (progress: ScanProgress) => void;
  onComplete?: (result: ScanResult) => void;
  onError?: (error: string) => void;
}

interface ScanOptions {
  standard?: WCAGStandard;
  viewport?: Viewport;
  includeWarnings?: boolean;
}

export function useScanSSE(options: UseScanSSEOptions = {}) {
  const { onFinding, onProgress, onComplete, onError } = options;

  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({
    status: "idle",
    percent: 0,
    message: "",
  });
  const [findings, setFindings] = useState<Finding[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProgress = useCallback(
    (newProgress: Partial<ScanProgress>) => {
      setProgress((prev) => {
        const updated = { ...prev, ...newProgress };
        onProgress?.(updated);
        return updated;
      });
    },
    [onProgress]
  );

  const cancelScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsScanning(false);
    updateProgress({
      status: "cancelled",
      percent: 0,
      message: "Scan cancelled",
    });
  }, [updateProgress]);

  const startScan = useCallback(
    async (url: string, scanOptions: ScanOptions = {}) => {
      // Reset state
      setIsScanning(true);
      setFindings([]);
      setResult(null);
      setError(null);
      updateProgress({
        status: "connecting",
        percent: 0,
        message: "Connecting to scanner...",
      });

      // Create abort controller
      abortControllerRef.current = new AbortController();

      // Track current event type for SSE parsing
      let currentEventType = "";

      function handleSSEEvent(eventType: string, data: unknown) {
        switch (eventType) {
          case "status": {
            const statusData = data as { message: string; phase?: string };
            updateProgress({
              status: "scanning",
              message: statusData.message,
            });
            break;
          }

          case "progress": {
            const progressData = data as { percent: number; message: string };
            updateProgress({
              status: "scanning",
              percent: progressData.percent,
              message: progressData.message,
            });
            break;
          }

          case "finding": {
            const finding = data as Finding;
            setFindings((prev) => [...prev, finding]);
            onFinding?.(finding);
            break;
          }

          case "complete": {
            const scanResult = data as ScanResult;
            setResult(scanResult);
            updateProgress({
              status: "complete",
              percent: 100,
              message: `Found ${scanResult.totalIssues} issues`,
            });
            onComplete?.(scanResult);
            break;
          }

          case "error": {
            const errorData = data as { message?: string; error?: string } | string;
            const errorMessage = typeof errorData === 'string' 
              ? errorData 
              : errorData.message || errorData.error || "Unknown error";
            setError(errorMessage);
            updateProgress({
              status: "error",
              percent: 0,
              message: errorMessage,
            });
            onError?.(errorMessage);
            break;
          }
        }
      }

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            url,
            standard: scanOptions.standard || "wcag21aa",
            viewport: scanOptions.viewport || "desktop",
            includeWarnings: scanOptions.includeWarnings || false,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Scan failed" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        updateProgress({
          status: "scanning",
          percent: 10,
          message: "Loading page...",
        });

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith("event:")) {
              currentEventType = trimmedLine.slice(6).trim();
            } else if (trimmedLine.startsWith("data:")) {
              try {
                const jsonStr = trimmedLine.slice(5).trim();
                if (jsonStr) {
                  const data = JSON.parse(jsonStr);
                  handleSSEEvent(currentEventType, data);
                }
              } catch {
                // Ignore JSON parse errors
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        updateProgress({ status: "error", percent: 0, message });
        onError?.(message);
      } finally {
        setIsScanning(false);
        abortControllerRef.current = null;
      }
    },
    [updateProgress, onFinding, onComplete, onError]
  );

  const reset = useCallback(() => {
    setFindings([]);
    setResult(null);
    setError(null);
    setProgress({ status: "idle", percent: 0, message: "" });
  }, []);

  return {
    isScanning,
    progress,
    findings,
    result,
    error,
    startScan,
    cancelScan,
    reset,
  };
}