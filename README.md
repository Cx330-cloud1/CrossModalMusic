# Cross-modal Mapping Studio

A multisensory music-making system that enables users to create their own relationships between **gesture, sound, visuals, and body-based haptic feedback**.

Instead of using fixed accessibility mappings, the project explores **Mapping Ownership** — allowing each user to define their own cross-modal musical language.

## Concept

Traditional music interfaces are primarily designed around sound.

Cross-modal Mapping Studio explores another approach:

**Gesture → Music → Visual → Haptic**

Users can decide what a movement means, how it should sound, how it should appear visually, and where it should be felt on the body.

The goal is to shift accessibility from passive music reception toward **active musical authorship**.

## Current Prototype

The current computer-based prototype includes:

* Real-time webcam input
* MediaPipe hand tracking
* 21-point hand landmark detection
* Continuous gesture feature extraction

  * X position
  * Y position
  * Pinch
  * Hand openness
  * Movement energy
* Left / right hand tracking architecture
* Real-time technical visualization

No external hardware is required for the current prototype.

## System Architecture

```text
Camera
  ↓
Hand Tracking
  ↓
Gesture Features
  ↓
Personal Mapping Layer
  ↓
┌─────────┬─────────┬─────────┐
│ Sound   │ Visual  │ Haptic  │
└─────────┴─────────┴─────────┘
```

## Planned Development

* Independent dual-hand interaction
* Gesture signal smoothing and calibration
* User-defined Mapping Engine
* Real-time music generation with Tone.js
* Generative visual feedback
* Virtual four-point haptic body mapping
* Mapping profile saving
* Composition recording and replay

## Tech Stack

* JavaScript
* Vite
* MediaPipe Tasks Vision
* Tone.js
* HTML / CSS

## Project Structure

```text
CrossModalMusic/
├── app/        # Interactive prototype
├── assets/     # Screenshots, diagrams and demo media
├── docs/       # Design and technical documentation
├── research/   # References and related projects
└── README.md
```

## Status

**Work in progress.**

Current focus: building a stable gesture input layer and user-defined cross-modal mapping system.
