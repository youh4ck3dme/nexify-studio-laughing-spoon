import { analyzeFleet, type InputRow } from "@fleet/shared";

self.onmessage = (event: MessageEvent<{ rides: InputRow[]; leads: InputRow[] }>) => {
  try {
    const analysis = analyzeFleet(event.data.rides, event.data.leads);
    self.postMessage({ ok: true, analysis });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : "Analysis failed."
    });
  }
};
