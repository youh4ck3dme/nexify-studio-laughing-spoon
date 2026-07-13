import { analyzeFleet, type InputRow } from "@fleet/shared";

export type AnalyzeWorkerResult =
  | { ok: true; analysis: ReturnType<typeof analyzeFleet> }
  | { ok: false; error: string };

export function runAnalysisSync(rides: InputRow[], leads: InputRow[]): AnalyzeWorkerResult {
  try {
    return { ok: true, analysis: analyzeFleet(rides, leads) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Analysis failed."
    };
  }
}

export async function runAnalysisAsync(
  rides: InputRow[],
  leads: InputRow[]
): Promise<AnalyzeWorkerResult> {
  const totalRows = rides.length + leads.length;
  if (totalRows < 200 || typeof Worker === "undefined") {
    return runAnalysisSync(rides, leads);
  }

  try {
    const worker = new Worker(new URL("../worker/analyze.worker.ts", import.meta.url), {
      type: "module"
    });

    return await new Promise((resolve) => {
      worker.onmessage = (event: MessageEvent<AnalyzeWorkerResult>) => {
        worker.terminate();
        resolve(event.data);
      };
      worker.onerror = () => {
        worker.terminate();
        resolve(runAnalysisSync(rides, leads));
      };
      worker.postMessage({ rides, leads });
    });
  } catch {
    return runAnalysisSync(rides, leads);
  }
}
