import Meyda from "meyda";

/**
 * Real audio capture + a lightweight MFCC feature vector, used for the
 * voice pre-check (see backend voiceAuth.ts for the honesty notes on
 * what this is and isn't).
 */

export function recordAudio(): Promise<{ stop: () => void; result: Promise<Blob> }> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      let resolveResult: (b: Blob) => void;
      const result = new Promise<Blob>((res) => { resolveResult = res; });

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        resolveResult(new Blob(chunks, { type: "audio/webm" }));
      };
      recorder.start();

      resolve({
        stop: () => { if (recorder.state === "recording") recorder.stop(); },
        result
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function blobToMfccVector(blob: Blob): Promise<number[] | null> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  const samples = decoded.getChannelData(0);
  const bufferSize = 512;

  Meyda.sampleRate = decoded.sampleRate;
  Meyda.bufferSize = bufferSize;

  const frames: number[][] = [];
  for (let i = 0; i + bufferSize <= samples.length; i += bufferSize) {
    try {
      const frame = samples.slice(i, i + bufferSize);
      const mfcc = Meyda.extract("mfcc", frame) as number[] | null;
      if (mfcc) frames.push(mfcc);
    } catch {
      /* skip malformed frame */
    }
  }
  audioCtx.close();

  if (frames.length === 0) return null;
  const dim = frames[0].length;
  const avg = new Array(dim).fill(0);
  frames.forEach((v) => v.forEach((val, i) => (avg[i] += val)));
  return avg.map((v) => v / frames.length);
}
