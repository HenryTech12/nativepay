import { useEffect, useState } from "react";
import { subscribeSpeaking } from "./phrases";

/** True whenever speak() is actively playing audio. Pages use this to
 * block every input (buttons, keypad) until the system has finished
 * talking, not just to show an indicator. */
export function useIsSpeaking(): boolean {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => subscribeSpeaking(setSpeaking), []);
  return speaking;
}
