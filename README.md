# Cross-modal Music

A multisensory music-making prototype that explores how **gesture, touch, sound, visuals, and haptic feedback** can become part of the same creative system.

The project is built around **Mapping Ownership**: users can define their own relationships between body input, musical behavior, visual expression, and tactile feedback.

## Concept

Most digital music interfaces are designed around hearing-first interaction. Cross-modal Music explores an alternative workflow:

```text
Gesture + Touch
      ↓
Feature Extraction
      ↓
Personal Mapping
      ↓
Composition Assist
      ↓
Audio / Visual / Haptic
```

The goal is to support **active musical authorship through multiple sensory channels**, rather than simply translating sound into another format.

## Current Prototype

The browser-based prototype currently includes:

- Real-time webcam interaction with MediaPipe hand tracking
- Independent left / right hand input
- Gesture features including X / Y position, pinch, openness, and movement energy
- Gesture smoothing and event detection
- Personal Mapping Engine
- Tone.js music engine
- Composition Assist
- Multi-instrument rack
- Camera pitch guidance
- Generative visual feedback
- Finger Sleeve digital twin
- Pressure / impact / contact / tap simulation
- Virtual four-point haptic body map
- Create / Device / Debug / Map workspace modes

The software prototype can run without physical hardware.

## Interaction Model

```text
CAMERA

Position        → Pitch
Pinch           → Note Trigger
Movement Speed  → Intensity
Openness        → Expression


FINGER SLEEVE

Touch           → Note Trigger
Pressure        → Velocity
Impact          → Attack Energy
```

The long-term goal is to make both gesture and device inputs fully configurable through the same Mapping Ownership system.

## System Architecture

```text
Camera                  Finger Sleeve
  ↓                          ↓
Hand Tracking           Touch Features
  ↓                          ↓
Gesture Features ───────┬────┘
                        ↓
               Personal Mapping
                        ↓
               Composition Assist
                        ↓
                Instrument System
                        ↓
          ┌─────────┬─────────┬─────────┐
          │  Audio  │ Visual  │ Haptic  │
          └─────────┴─────────┴─────────┘
```

## Tech Stack

- JavaScript
- Vite
- MediaPipe Tasks Vision
- Tone.js
- Web Audio API
- HTML / CSS
- LocalStorage

## Project Structure

```text
CrossModalMusic/
├── app/
│   ├── public/
│   └── src/
│       ├── audio/
│       ├── composition/
│       ├── cv/
│       ├── device/
│       ├── haptics/
│       ├── mapping/
│       ├── ui/
│       ├── visual/
│       ├── main.js
│       └── style.css
├── assets/
├── docs/
├── research/
└── README.md
```

## Run Locally

```bash
git clone https://github.com/Cx330-cloud1/CrossModalMusic.git
cd CrossModalMusic/app
npm install
npm run dev
```

Open:

```text
http://localhost:5173/
```

A webcam-enabled browser is required for gesture input.

## Next Steps

- Extend Mapping Ownership to Finger Sleeve inputs
- Improve instrument realism and transitions
- Add richer music visualization
- Optimize application startup
- Connect real Finger Sleeve hardware
- Add recording and replay
- Validate physical four-point haptic output

## Status

**Active development / functional software prototype.**

Core gesture tracking, mapping, composition, audio, visual, haptic, and Finger Sleeve simulation modules are already integrated.
