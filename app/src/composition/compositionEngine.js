// ============================================================
// COMPOSITION ASSIST ENGINE V3
//
// This layer does NOT replace the creator's musical choice.
//
// It provides:
// - pitch stability
// - rhythmic structure
// - harmonic context
// - chord / color / tension analysis
// - optional soft guidance
//
// Full pitch richness is preserved.
// ============================================================


const SETTINGS_KEY =
  "cross-modal-composition-settings-v3";


// ============================================================
// DEFAULT SETTINGS
// ============================================================

const DEFAULT_SETTINGS = {

  tempo:
    84,

  grid:
    "1/8",

  assistMode:
    "balanced",

  key:
    "C",

  harmony:
    "soft-major",
};


// ============================================================
// HARMONIC PROGRESSION
//
// Four bars:
//
// Cmaj7 → Am7 → Fmaj7 → G6
// ============================================================

const HARMONY_PROGRESSIONS = {

  "soft-major": [

    {
      name:
        "Cmaj7",

      root:
        0,

      chordPitchClasses: [
        0,  // C
        4,  // E
        7,  // G
        11, // B
      ],

      padNotes: [
        "C3",
        "G3",
        "B3",
        "E4",
      ],
    },


    {
      name:
        "Am7",

      root:
        9,

      chordPitchClasses: [
        9, // A
        0, // C
        4, // E
        7, // G
      ],

      padNotes: [
        "A2",
        "E3",
        "G3",
        "C4",
      ],
    },


    {
      name:
        "Fmaj7",

      root:
        5,

      chordPitchClasses: [
        5, // F
        9, // A
        0, // C
        4, // E
      ],

      padNotes: [
        "F2",
        "C3",
        "E3",
        "A3",
      ],
    },


    {
      name:
        "G6",

      root:
        7,

      chordPitchClasses: [
        7,  // G
        11, // B
        2,  // D
        4,  // E
      ],

      padNotes: [
        "G2",
        "D3",
        "E3",
        "B3",
      ],
    },
  ],
};


// ============================================================
// TONAL MATERIAL
// ============================================================

const TONAL_CONTEXTS = {

  major: [
    0,
    2,
    4,
    5,
    7,
    9,
    11,
  ],

  pentatonic: [
    0,
    2,
    4,
    7,
    9,
  ],

  minor: [
    0,
    2,
    3,
    5,
    7,
    8,
    10,
  ],

  dorian: [
    0,
    2,
    3,
    5,
    7,
    9,
    10,
  ],

  chromatic: [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
  ],
};


// ============================================================
// FACTORY
// ============================================================

export function createCompositionEngine() {

  const saved =
    loadSettings();


  const settings = {

    ...DEFAULT_SETTINGS,

    ...saved,
  };


  // ==========================================================
  // CLOCK
  // ==========================================================

  let clockOrigin =
    performance.now();


  // ==========================================================
  // PITCH STABILITY STATE
  // ==========================================================

  const pitchState = {

    currentIndex:
      null,

    candidateIndex:
      null,

    candidateSince:
      0,
  };


  // ==========================================================
  // START / RESET CLOCK
  // ==========================================================

  function startClock() {

    clockOrigin =
      performance.now();
  }


  // ==========================================================
  // PITCH STABILITY
  //
  // Full note range remains available.
  //
  // The engine only prevents tiny hand jitter from changing
  // note every frame.
  // ==========================================================

  function stabilizePitch(
    normalizedValue,
    noteCount,
    now = performance.now()
  ) {

    if (
      !Number.isFinite(
        normalizedValue
      ) ||
      noteCount <= 0
    ) {

      return 0;
    }


    const value =
      clamp01(
        normalizedValue
      );


    const rawIndex =
      Math.round(
        value *
        (
          noteCount -
          1
        )
      );


    // First pitch selection.

    if (
      pitchState.currentIndex ===
      null
    ) {

      pitchState.currentIndex =
        rawIndex;


      pitchState.candidateIndex =
        rawIndex;


      pitchState.candidateSince =
        now;


      return rawIndex;
    }


    // Still inside current note.

    if (
      rawIndex ===
      pitchState.currentIndex
    ) {

      pitchState.candidateIndex =
        rawIndex;


      pitchState.candidateSince =
        now;


      return (
        pitchState.currentIndex
      );
    }


    // New candidate.

    if (
      rawIndex !==
      pitchState.candidateIndex
    ) {

      pitchState.candidateIndex =
        rawIndex;


      pitchState.candidateSince =
        now;


      return (
        pitchState.currentIndex
      );
    }


    // ========================================================
    // DWELL
    //
    // Balanced:
    // slightly stable.
    //
    // Guided:
    // more stable.
    //
    // Free:
    // almost immediate.
    // ========================================================

    const dwellMs =
      getPitchDwellMs();


    if (
      now -
      pitchState.candidateSince >=
      dwellMs
    ) {

      pitchState.currentIndex =
        rawIndex;
    }


    return (
      pitchState.currentIndex
    );
  }


  // ==========================================================
  // RESET PITCH
  // ==========================================================

  function resetPitch() {

    pitchState.currentIndex =
      null;


    pitchState.candidateIndex =
      null;


    pitchState.candidateSince =
      0;
  }


  // ==========================================================
  // PITCH DWELL
  // ==========================================================

  function getPitchDwellMs() {

    switch (
      settings.assistMode
    ) {

      case "free":

        return 20;


      case "guided":

        return 145;


      case "balanced":

      default:

        return 90;
    }
  }


  // ==========================================================
  // CURRENT HARMONY
  // ==========================================================

  function getHarmony(
    now = performance.now()
  ) {

    const progression =
      HARMONY_PROGRESSIONS[
        settings.harmony
      ] ??
      HARMONY_PROGRESSIONS[
        "soft-major"
      ];


    const beatMs =
      60000 /
      settings.tempo;


    const barMs =
      beatMs *
      4;


    const elapsed =
      Math.max(
        0,
        now -
        clockOrigin
      );


    const absoluteBar =
      Math.floor(
        elapsed /
        barMs
      );


    const barIndex =
      absoluteBar %
      progression.length;


    const beatInBar =
      (
        elapsed %
        barMs
      ) /
      beatMs;


    const chord =
      progression[
        barIndex
      ];


    return {

      ...chord,

      barIndex,

      displayBar:
        barIndex + 1,

      absoluteBar,

      beat:
        Math.floor(
          beatInBar
        ) + 1,

      beatProgress:
        beatInBar %
        1,

      barProgress:
        (
          elapsed %
          barMs
        ) /
        barMs,

      progressionLength:
        progression.length,
    };
  }


  // ==========================================================
  // NOTE ROLE
  //
  // CHORD
  // Stable chord member.
  //
  // COLOR
  // Inside tonal context but not part of current chord.
  //
  // TENSION
  // Outside the tonal context or strongly dissonant.
  //
  // No note is forbidden.
  // ==========================================================

  function classifyNote(
    note,
    scaleName = "major",
    now = performance.now()
  ) {

    const midi =
      noteToMidi(
        note
      );


    const pitchClass =
      positiveMod(
        midi,
        12
      );


    const harmony =
      getHarmony(
        now
      );


    if (
      harmony
        .chordPitchClasses
        .includes(
          pitchClass
        )
    ) {

      return {

        role:
          "chord",

        label:
          "CHORD",

        score:
          1,

        harmony:
          harmony.name,
      };
    }


    const tonalContext =
      TONAL_CONTEXTS[
        scaleName
      ] ??
      TONAL_CONTEXTS.major;


    if (
      tonalContext.includes(
        pitchClass
      )
    ) {

      return {

        role:
          "color",

        label:
          "COLOR",

        score:
          0.68,

        harmony:
          harmony.name,
      };
    }


    return {

      role:
        "tension",

      label:
        "TENSION",

      score:
        0.32,

      harmony:
        harmony.name,
    };
  }


  // ==========================================================
  // SOFT HARMONIC ASSIST
  //
  // FREE:
  // never modifies note.
  //
  // BALANCED:
  // preserves selected note.
  // only exposes harmonic role.
  //
  // GUIDED:
  // may softly prefer an adjacent chord/color note.
  //
  // Full note access remains available.
  // ==========================================================

  function assistPitch({
    note,
    scaleNotes,
    scaleName = "major",
    now = performance.now(),
  }) {

    const classification =
      classifyNote(
        note,
        scaleName,
        now
      );


    if (
      settings.assistMode ===
      "free" ||
      settings.assistMode ===
      "balanced"
    ) {

      return {

        note,

        originalNote:
          note,

        changed:
          false,

        ...classification,
      };
    }


    // ========================================================
    // GUIDED
    //
    // Chord / color notes remain untouched.
    // Only tension notes get a nearby suggestion.
    // ========================================================

    if (
      classification.role !==
      "tension"
    ) {

      return {

        note,

        originalNote:
          note,

        changed:
          false,

        ...classification,
      };
    }


    const currentIndex =
      scaleNotes.indexOf(
        note
      );


    if (
      currentIndex ===
      -1
    ) {

      return {

        note,

        originalNote:
          note,

        changed:
          false,

        ...classification,
      };
    }


    const candidates =
      [];


    for (
      const offset
      of [
        -1,
        1,
      ]
    ) {

      const index =
        currentIndex +
        offset;


      if (
        index < 0 ||
        index >=
          scaleNotes.length
      ) {

        continue;
      }


      const candidate =
        scaleNotes[
          index
        ];


      const candidateClass =
        classifyNote(

          candidate,

          scaleName,

          now
        );


      candidates.push({

        note:
          candidate,

        classification:
          candidateClass,
      });
    }


    const preferred =
      candidates
        .sort(
          (
            a,
            b
          ) =>
            b.classification
              .score -
            a.classification
              .score
        )
        .find(
          (candidate) =>
            candidate
              .classification
              .role !==
            "tension"
        );


    if (
      !preferred
    ) {

      return {

        note,

        originalNote:
          note,

        changed:
          false,

        ...classification,
      };
    }


    return {

      note:
        preferred.note,

      originalNote:
        note,

      changed:
        true,

      ...preferred
        .classification,
    };
  }


  // ==========================================================
  // RHYTHM QUANTIZATION
  //
  // Returns delay until nearest future grid point.
  //
  // The Music Engine can schedule Tone.js playback
  // after this delay.
  // ==========================================================

  function getQuantizedDelay(
    now = performance.now()
  ) {

    if (
      settings.grid ===
      "free"
    ) {

      return 0;
    }


    const beatMs =
      60000 /
      settings.tempo;


    const gridMs =
      settings.grid ===
        "1/16"

        ? beatMs /
          4

        : beatMs /
          2;


    const elapsed =
      Math.max(
        0,
        now -
        clockOrigin
      );


    const remainder =
      elapsed %
      gridMs;


    // Close enough to grid:
    // play immediately.

    const tolerance =
      35;


    if (
      remainder <=
        tolerance ||
      gridMs -
        remainder <=
        tolerance
    ) {

      return 0;
    }


    return (
      gridMs -
      remainder
    );
  }


  // ==========================================================
  // SETTINGS API
  // ==========================================================

  function setTempo(
    tempo
  ) {

    const next =
      Math.round(
        Number(
          tempo
        )
      );


    settings.tempo =
      Math.max(
        50,
        Math.min(
          160,
          next
        )
      );


    saveSettings();


    startClock();


    return (
      settings.tempo
    );
  }


  function setGrid(
    grid
  ) {

    if (
      ![
        "free",
        "1/8",
        "1/16",
      ].includes(
        grid
      )
    ) {

      return false;
    }


    settings.grid =
      grid;


    saveSettings();


    return true;
  }


  function setAssistMode(
    mode
  ) {

    if (
      ![
        "free",
        "balanced",
        "guided",
      ].includes(
        mode
      )
    ) {

      return false;
    }


    settings.assistMode =
      mode;


    resetPitch();


    saveSettings();


    return true;
  }


  // ==========================================================
  // GET STATE
  // ==========================================================

  function getState() {

    return {

      ...settings,

      harmony:
        getHarmony(),

      pitch:
        {
          ...pitchState,
        },
    };
  }


  // ==========================================================
  // SAVE
  // ==========================================================

  function saveSettings() {

    try {

      localStorage.setItem(

        SETTINGS_KEY,

        JSON.stringify(
          settings
        )
      );

    }

    catch (error) {

      console.warn(
        "Unable to save composition settings.",
        error
      );
    }
  }


  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {

    startClock,

    stabilizePitch,

    resetPitch,

    classifyNote,

    assistPitch,

    getHarmony,

    getQuantizedDelay,

    setTempo,

    setGrid,

    setAssistMode,

    getState,
  };
}


// ============================================================
// STORAGE
// ============================================================

function loadSettings() {

  try {

    const raw =
      localStorage.getItem(
        SETTINGS_KEY
      );


    if (
      !raw
    ) {

      return {
        ...DEFAULT_SETTINGS,
      };
    }


    const parsed =
      JSON.parse(
        raw
      );


    return {

      ...DEFAULT_SETTINGS,

      ...parsed,
    };

  }

  catch {

    return {
      ...DEFAULT_SETTINGS,
    };
  }
}


// ============================================================
// NOTE → MIDI
// ============================================================

function noteToMidi(
  note
) {

  const match =
    /^([A-G])(#?)(-?\d+)$/
      .exec(
        note
      );


  if (
    !match
  ) {

    return 60;
  }


  const [
    ,
    letter,
    sharp,
    octaveText,
  ] =
    match;


  const pitchClasses = {

    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };


  let pitchClass =
    pitchClasses[
      letter
    ];


  if (
    sharp
  ) {

    pitchClass +=
      1;
  }


  const octave =
    Number(
      octaveText
    );


  return (
    octave +
    1
  ) *
    12 +
    pitchClass;
}


// ============================================================
// HELPERS
// ============================================================

function positiveMod(
  value,
  divisor
) {

  return (
    (
      value %
      divisor
    ) +
    divisor
  ) %
    divisor;
}


function clamp01(
  value
) {

  if (
    !Number.isFinite(
      value
    )
  ) {

    return 0;
  }


  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}