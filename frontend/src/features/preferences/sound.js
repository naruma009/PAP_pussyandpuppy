let audioContext;
let lastSoundAt = 0;

export function playCommerceSound(enabled, type = "click", species = "both") {
  if (!enabled || typeof window === "undefined") return false;
  const now = performance.now();
  if (now - lastSoundAt < 90) return false;
  lastSoundAt = now;
  const Engine = window.AudioContext || window.webkitAudioContext;
  if (!Engine) return false;
  audioContext ||= new Engine();
  if (audioContext.state === "suspended") audioContext.resume();
  const notes = type === "success" ? [523, 659, 784] : type === "cart" ? [420, 620] : type === "mood" ? [392, 523, 659] : type === "feed" ? (species === "cat" ? [680, 820] : [360, 520]) : type === "pet" ? (species === "cat" ? [420, 500] : [520, 660]) : [480];
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + index * 0.055;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.045, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.12);
  });
  return true;
}
