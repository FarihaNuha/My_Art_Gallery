// Smooth English Voice Narrator using Web Speech API (window.speechSynthesis)

const PREFERRED_VOICE_NAMES = [
  'Microsoft Aria Online (Natural)',
  'Microsoft Jenny Online (Natural)',
  'Microsoft Libby Online (Natural)',
  'Google UK English Female',
  'Google US English',
  'Samantha',
  'Karen',
  'Daniel',
  'Victoria',
];

let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceEnabled = true;

function selectBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  for (const preferred of PREFERRED_VOICE_NAMES) {
    const match = voices.find((v) => v.name.includes(preferred));
    if (match) return match;
  }

  const naturalEn = voices.find(
    (v) => v.lang.startsWith('en') && /natural|neural|google|samantha|aria|jenny/i.test(v.name)
  );
  if (naturalEn) return naturalEn;

  const anyEn = voices.find((v) => v.lang.startsWith('en'));
  return anyEn ?? voices[0] ?? null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoice = selectBestEnglishVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = selectBestEnglishVoice();
  });
}

export function isVoiceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function setVoiceEnabled(enabled: boolean): void {
  voiceEnabled = enabled;
  if (!enabled) {
    stopNarration();
  }
}

export function getVoiceEnabled(): boolean {
  return voiceEnabled;
}

export function stopNarration(): void {
  if (!isVoiceSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore speech synthesis cancel errors
  }
}

export function speakNarration(text: string): void {
  if (!voiceEnabled || !isVoiceSupported() || !text.trim()) return;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = cachedVoice ?? selectBestEnglishVoice();
    if (voice) {
      cachedVoice = voice;
      utterance.voice = voice;
      utterance.lang = voice.lang || 'en-US';
    } else {
      utterance.lang = 'en-US';
    }

    // Smooth, calm, museum-guide pacing
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 0.95;

    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully ignore if browser blocks synthesis
  }
}

export function speakBookOpening(): void {
  speakNarration(
    'Welcome to The Art Archive. Let us open these pages and explore a timeless collection of creative expressions.'
  );
}

export function speakBookClosingEnd(): void {
  speakNarration(
    'We have reached the final page of The Art Archive. Thank you for exploring these preserved moments. Closing the book now.'
  );
}

export function speakBookClosingFront(): void {
  speakNarration('Closing The Art Archive. Until we open these pages again.');
}

export function speakArtworkTitle(title: string, pageNumber?: number): void {
  if (pageNumber !== undefined) {
    speakNarration(`Plate ${pageNumber}. ${title}.`);
  } else {
    speakNarration(title);
  }
}

export function speakSpreadArtworks(
  leftArtwork?: { title: string; pageNumber: number },
  rightArtwork?: { title: string; pageNumber: number }
): void {
  if (leftArtwork && rightArtwork) {
    speakNarration(
      `On the left, Plate ${leftArtwork.pageNumber}, ${leftArtwork.title}. And on the right, Plate ${rightArtwork.pageNumber}, ${rightArtwork.title}.`
    );
  } else if (leftArtwork) {
    speakNarration(`Plate ${leftArtwork.pageNumber}. ${leftArtwork.title}.`);
  } else if (rightArtwork) {
    speakNarration(`Plate ${rightArtwork.pageNumber}. ${rightArtwork.title}.`);
  }
}
