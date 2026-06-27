"""Generate WAV SFX matching SoundManager synth fallbacks in src/sounds.js."""

import math
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 44100
OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "audio"


def envelope(t, duration, volume):
    if t < 0 or t >= duration:
        return 0.0
    return volume * math.exp(-6.0 * t / max(duration, 0.001))


def sine(t, freq):
    return math.sin(2.0 * math.pi * freq * t)


def square(t, freq):
    return 1.0 if sine(t, freq) >= 0 else -1.0


def sawtooth(t, freq):
  phase = (freq * t) % 1.0
  return 2.0 * phase - 1.0


def tone(freq, duration, wave_type, volume, start=0.0, total=None):
    total = total or duration
    samples = []
    n = int(total * SAMPLE_RATE)
    for i in range(n):
        t = i / SAMPLE_RATE
        local = t - start
        if local < 0 or local >= duration:
            samples.append(0.0)
            continue
        if wave_type == "sine":
            value = sine(local, freq)
        elif wave_type == "square":
            value = square(local, freq)
        else:
            value = sawtooth(local, freq)
        samples.append(value * envelope(local, duration, volume))
    return samples


def mix(*tracks):
    length = max(len(track) for track in tracks)
    mixed = [0.0] * length
    for track in tracks:
        for i, sample in enumerate(track):
            mixed[i] += sample
    peak = max((abs(s) for s in mixed), default=1.0)
    if peak > 0.98:
        scale = 0.98 / peak
        mixed = [s * scale for s in mixed]
    return mixed


def sweep(from_hz, to_hz, duration, volume, total=None):
    total = total or duration
    samples = []
    n = int(total * SAMPLE_RATE)
    for i in range(n):
        t = i / SAMPLE_RATE
        if t >= duration:
            samples.append(0.0)
            continue
        ratio = t / max(duration, 0.001)
        freq = from_hz * ((to_hz / from_hz) ** ratio)
        value = sine(t, freq) * envelope(t, duration, volume)
        samples.append(value)
    return samples


def write_wav(path, samples):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            clipped = max(-1.0, min(1.0, sample))
            frames.extend(struct.pack("<h", int(clipped * 32767)))
        wav.writeframes(frames)


def generate_tick():
    return tone(1200, 0.04, "square", 0.35)


def generate_success():
    total = 0.28
    return mix(
        tone(523.25, 0.08, "sine", 0.45, start=0.0, total=total),
        tone(659.25, 0.08, "sine", 0.38, start=0.07, total=total),
        tone(783.99, 0.12, "sine", 0.32, start=0.14, total=total),
    )


def generate_fail():
    total = 0.35
    return mix(
        tone(220, 0.15, "sawtooth", 0.42, start=0.0, total=total),
        tone(165, 0.2, "sawtooth", 0.34, start=0.09, total=total),
    )


def generate_tap():
    return tone(800, 0.04, "sine", 0.4)


def generate_whoosh():
    return sweep(200, 800, 0.14, 0.38)


def main():
    assets = {
        "tick.wav": generate_tick(),
        "success.wav": generate_success(),
        "fail.wav": generate_fail(),
        "tap.wav": generate_tap(),
        "whoosh.wav": generate_whoosh(),
    }
    for name, samples in assets.items():
        path = OUT_DIR / name
        write_wav(path, samples)
        print(f"Wrote {path} ({len(samples) / SAMPLE_RATE:.2f}s)")


if __name__ == "__main__":
    main()
