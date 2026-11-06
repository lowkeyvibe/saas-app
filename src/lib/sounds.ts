"use client";

// Sonidos de la app, generados con Web Audio (sin archivos). Hoy solo el "cha-ching" de dinero al convertir.
// (El clic al tocar botones se sacó: molestaba.) Se apagan en Configuración → Apariencia; se guarda en el navegador.

const KEY = "sonidos";
export const SOUNDS_EVENT = "sonido-clic";

let ctx: AudioContext | null = null;

export function soundsEnabled() {
  try {
    return localStorage.getItem(KEY) !== "no"; // prendido por defecto
  } catch {
    return true;
  }
}

export function setSounds(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "si" : "no");
  } catch {
    // Sin localStorage, cambia igual pero no se recuerda.
  }
  window.dispatchEvent(new Event(SOUNDS_EVENT));
}

function audio() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// "Cha-ching" de dinero para cuando una conversión (u otra operación de plata) sale bien:
// dos campanitas que suben y un brillo agudo al final.
export function playSuccess() {
  if (!soundsEnabled()) return;
  try {
    const ac = audio();
    const t = ac.currentTime;
    const bell = (freq: number, start: number, duration: number, volume: number) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + start);
      gain.gain.setValueAtTime(0.0001, t + start);
      gain.gain.exponentialRampToValueAtTime(volume, t + start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + start + duration);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + start);
      osc.stop(t + start + duration + 0.02);
    };
    bell(1046.5, 0, 0.14, 0.09); // do
    bell(1568, 0.075, 0.38, 0.09); // sol, más largo
    bell(3136, 0.075, 0.22, 0.025); // brillo
    bell(2093, 0.16, 0.3, 0.03); // destello final
  } catch {
    // Si el navegador no permite audio, no pasa nada.
  }
}
