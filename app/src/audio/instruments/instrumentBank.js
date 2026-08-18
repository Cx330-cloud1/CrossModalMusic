// ============================================================
// INSTRUMENT BANK V4
//
// Describes every instrument available to the music system.
//
// Audio playback is NOT handled here.
// This file only defines:
// - identity
// - display information
// - sample locations
// - musical character
// ============================================================


export const INSTRUMENT_BANK = {

  // ==========================================================
  // KALIMBA
  // ==========================================================

  kalimba: {

    id:
      "kalimba",

    label:
      "Kalimba",

    shortLabel:
      "KALIMBA",

    family:
      "Plucked",

    sourceType:
      "sampler",

    description:
      "Clear metallic pluck with a soft wooden resonance.",

    samples: {

      C3:
        "/audio/instruments/kalimba/C3.wav",

      C4:
        "/audio/instruments/kalimba/C4.wav",

      C5:
        "/audio/instruments/kalimba/C5.wav",

      C6:
        "/audio/instruments/kalimba/C6.wav",
    },

    character: {

      brightness:
        0.62,

      reverb:
        0.18,

      release:
        1.0,

      gain:
        0.82,
    },
  },


  // ==========================================================
  // MARIMBA
  // ==========================================================

  marimba: {

    id:
      "marimba",

    label:
      "Warm Marimba",

    shortLabel:
      "MARIMBA",

    family:
      "Mallet",

    sourceType:
      "sampler",

    description:
      "Warm wooden mallet tone for the lower register.",

    samples: {

      C3:
        "/audio/instruments/marimba/C3.wav",

      C4:
        "/audio/instruments/marimba/C4.wav",

      C5:
        "/audio/instruments/marimba/C5.wav",
    },

    character: {

      brightness:
        0.38,

      reverb:
        0.14,

      release:
        0.75,

      gain:
        0.86,
    },
  },


  // ==========================================================
  // SOFT PIANO
  // ==========================================================

  softPiano: {

    id:
      "softPiano",

    label:
      "Soft Piano",

    shortLabel:
      "PIANO",

    family:
      "Keys",

    sourceType:
      "sampler",

    description:
      "Soft acoustic piano for melodic and harmonic playing.",

    samples: {

      C3:
        "/audio/instruments/piano/C3.wav",

      C4:
        "/audio/instruments/piano/C4.wav",

      C5:
        "/audio/instruments/piano/C5.wav",

      C6:
        "/audio/instruments/piano/C6.wav",
    },

    character: {

      brightness:
        0.48,

      reverb:
        0.20,

      release:
        1.35,

      gain:
        0.78,
    },
  },


  // ==========================================================
  // GLASS BELL
  // ==========================================================

  glassBell: {

    id:
      "glassBell",

    label:
      "Glass Bell",

    shortLabel:
      "GLASS",

    family:
      "Bell",

    sourceType:
      "sampler",

    description:
      "Bright glass-like resonance for the upper register.",

    samples: {

      C4:
        "/audio/instruments/glass/C4.wav",

      C5:
        "/audio/instruments/glass/C5.wav",

      C6:
        "/audio/instruments/glass/C6.wav",
    },

    character: {

      brightness:
        0.84,

      reverb:
        0.34,

      release:
        1.8,

      gain:
        0.68,
    },
  },


  // ==========================================================
  // MUTED PLUCK
  //
  // This one will remain synthesis-based.
  // ==========================================================

  mutedPluck: {

    id:
      "mutedPluck",

    label:
      "Muted Pluck",

    shortLabel:
      "PLUCK",

    family:
      "Electronic",

    sourceType:
      "synth",

    description:
      "Dry contemporary plucked sound for rhythmic material.",

    character: {

      brightness:
        0.52,

      reverb:
        0.10,

      release:
        0.45,

      gain:
        0.76,
    },
  },


  // ==========================================================
  // WARM SYNTH
  // ==========================================================

  warmSynth: {

    id:
      "warmSynth",

    label:
      "Warm Synth",

    shortLabel:
      "SYNTH",

    family:
      "Electronic",

    sourceType:
      "synth",

    description:
      "Soft sustained electronic voice for experimental playing.",

    character: {

      brightness:
        0.34,

      reverb:
        0.30,

      release:
        1.6,

      gain:
        0.68,
    },
  },
};


// ============================================================
// HELPERS
// ============================================================

export function getInstrumentDefinition(
  instrumentId
) {

  return (
    INSTRUMENT_BANK[
      instrumentId
    ] ??
    INSTRUMENT_BANK.kalimba
  );
}


export function hasInstrument(
  instrumentId
) {

  return Boolean(
    INSTRUMENT_BANK[
      instrumentId
    ]
  );
}


export function getInstrumentOptions() {

  return Object.values(
    INSTRUMENT_BANK
  ).map(
    (instrument) => ({

      value:
        instrument.id,

      label:
        instrument.label,

      family:
        instrument.family,

      sourceType:
        instrument.sourceType,
    })
  );
}


export function getInstrumentIds() {

  return Object.keys(
    INSTRUMENT_BANK
  );
}