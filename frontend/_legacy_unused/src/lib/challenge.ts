/**
 * A fresh random digit challenge to speak back at each auth attempt, so the
 * enrollment recording (or anything overheard nearby) can't just be replayed.
 * Note: the backend only compares the MFCC voiceprint similarity — it does
 * not check that the spoken content matches these digits. This is a UX
 * device to get a natural, non-enrollment-phrase sample, not a server-side
 * liveness check.
 */

const DIGIT_WORDS: Record<string, string[]> = {
  en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
  pcm: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
  yo: ["odo", "ookan", "eeji", "eeta", "eerin", "aarun", "eefa", "eeje", "eejo", "eesan"],
  ha: ["sifiri", "daya", "biyu", "uku", "hudu", "biyar", "shida", "bakwai", "takwas", "tara"],
  ig: ["efu", "otu", "abụọ", "atọ", "anọ", "ise", "isii", "asaa", "asatọ", "itoolu"]
};

export interface Challenge {
  digits: string;
  spoken: string;
}

export function generateChallenge(lang: string): Challenge {
  const digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10).toString()).join("");
  const words = DIGIT_WORDS[lang] || DIGIT_WORDS.en;
  const spoken = digits.split("").map((d) => words[Number(d)]).join(" ");
  return { digits, spoken };
}
