import * as faceapi from "face-api.js";

/**
 * Real facial verification — face-api.js runs a dlib-based face-detection
 * and face-recognition model (via TensorFlow.js) entirely in the browser.
 * Only the resulting 128-float descriptor is ever sent to the backend —
 * never a raw photo, same privacy shape as the voice pipeline's MFCC
 * vectors. Models are self-hosted in /public/models so the live demo
 * never depends on a third-party CDN being reachable.
 */

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  ]).then(() => { modelsLoaded = true; });
  return loadingPromise;
}

/** Detects a single face in the current video frame and returns its
 * 128-dimension descriptor, or null if no face was clearly detected. */
export async function captureFaceDescriptor(video: HTMLVideoElement): Promise<number[] | null> {
  await loadFaceModels();
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor);
}
