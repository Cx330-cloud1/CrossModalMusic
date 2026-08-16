import * as Tone from "tone";


// ============================================================
// MUSIC ENGINE V2
//
// Gesture
//   ↓
// Personal Mapping
//   ↓
// 3-octave scale system
//   ↓
// Guided / Performance interaction
//   ↓
// Mallet + Ambient Pad
// ============================================================

const SETTINGS_KEY =
  "cross-modal-music-settings-v2";


// MIDI range:
//
// C3 = 48
// C6 = 84

const MIDI_MIN = 48;
const MIDI_MAX = 84;


const SCALE_INTERVALS = {

  pentatonic: [
    0,
    2,
    4,
    7,
    9,
  ],

  major: [
    0,
    2,
    4,
    5,
    7,
    9,
    11,
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


const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];


// ============================================================
// FACTORY
// ============================================================

export function createMusicEngine() {

  const settings =
    loadSettings();


  let initialized =
    false;


  let scaleNotes =
    buildScaleNotes(
      settings.scale
    );


  // ==========================================================
  // AUDIO NODES
  // ==========================================================

  let master =
    null;

  let reverb =
    null;

  let mallet =
    null;

  let malletFilter =
    null;

  let previewSynth =
    null;

  let pad =
    null;

  let padFilter =
    null;


  // ==========================================================
  // PERFORMANCE STATE
  // ==========================================================

  const state = {

    scale:
      settings.scale,

    mode:
      settings.mode,

    pitchValue:
      0.5,

    note:
      "",

    scaleIndex:
      0,

    timbre:
      0.5,

    intensity:
      0.35,

    padAmount:
      0.35,

    texture:
      0.35,

    volume:
      0.72,

    rhythm:
      0,

    lastVelocity:
      0.5,
  };


  const previousRuleValues =
    new Map();


  let lastFormalNoteTime =
    0;


  let lastPreviewTime =
    0;


  let lastPreviewNote =
    null;


  let lastPadTime =
    0;


  updatePitch(
    state.pitchValue,
    false
  );


  // ==========================================================
  // START
  // ==========================================================

  async function start() {

    await Tone.start();


    if (
      initialized
    ) {

      return;
    }


    setupAudioGraph();


    if (
      reverb?.ready
    ) {

      await reverb.ready;
    }


    initialized =
      true;


    console.log(
      "[Music Engine V2] Audio ready"
    );
  }


  // ==========================================================
  // AUDIO GRAPH
  // ==========================================================

  function setupAudioGraph() {

    // --------------------------------------------------------
    // MASTER
    // --------------------------------------------------------

    master =
      new Tone.Gain(
        0.7
      )
        .toDestination();


    // --------------------------------------------------------
    // SPACE
    // --------------------------------------------------------

    reverb =
      new Tone.Reverb(
        2.8
      );


    reverb.wet.value =
      0.24;


    reverb.connect(
      master
    );


    // --------------------------------------------------------
    // MALLET FILTER
    // --------------------------------------------------------

    malletFilter =
      new Tone.Filter(
        3200,
        "lowpass"
      );


    malletFilter.connect(
      reverb
    );


    // --------------------------------------------------------
    // MAIN MALLET
    // --------------------------------------------------------

    mallet =
      new Tone.FMSynth({

        harmonicity:
          3.01,

        modulationIndex:
          7,

        oscillator: {
          type:
            "sine",
        },

        envelope: {

          attack:
            0.002,

          decay:
            0.32,

          sustain:
            0.035,

          release:
            0.8,
        },

        modulation: {
          type:
            "sine",
        },

        modulationEnvelope: {

          attack:
            0.001,

          decay:
            0.23,

          sustain:
            0,

          release:
            0.3,
        },

        volume:
          -8,
      });


    mallet.connect(
      malletFilter
    );


    // --------------------------------------------------------
    // GUIDED PREVIEW VOICE
    //
    // Much quieter than formal performance notes.
    // --------------------------------------------------------

    previewSynth =
      new Tone.FMSynth({

        harmonicity:
          2,

        modulationIndex:
          2.5,

        oscillator: {
          type:
            "sine",
        },

        envelope: {

          attack:
            0.001,

          decay:
            0.08,

          sustain:
            0,

          release:
            0.15,
        },

        modulationEnvelope: {

          attack:
            0.001,

          decay:
            0.05,

          sustain:
            0,

          release:
            0.1,
        },

        volume:
          -21,
      });


    previewSynth.connect(
      malletFilter
    );


    // --------------------------------------------------------
    // AMBIENT PAD
    // --------------------------------------------------------

    padFilter =
      new Tone.Filter(
        1500,
        "lowpass"
      );


    padFilter.connect(
      reverb
    );


    pad =
      new Tone.PolySynth(
        Tone.Synth
      );


    pad.set({

      oscillator: {
        type:
          "triangle",
      },

      envelope: {

        attack:
          0.75,

        decay:
          0.85,

        sustain:
          0.25,

        release:
          2.5,
      },
    });


    pad.volume.value =
      -22;


    pad.connect(
      padFilter
    );
  }


  // ==========================================================
  // PROCESS MAPPING
  // ==========================================================

  function process(
    mappingOutput
  ) {

    if (
      !Array.isArray(
        mappingOutput
      )
    ) {

      return;
    }


    // ========================================================
    // PASS 1
    //
    // Continuous musical controls.
    // ========================================================

    for (
      const output
      of mappingOutput
    ) {

      const target =
        output.targets
          ?.music;


      if (
        !target?.enabled
      ) {

        continue;
      }


      const value =
        clamp01(
          Number(
            output.value
          )
        );


      switch (
        target.parameter
      ) {

        case "pitch":

          updatePitch(
            value,
            true
          );

          break;


        case "timbre":

          updateTimbre(
            value
          );

          break;


        case "intensity":

          updateIntensity(
            value
          );

          break;


        // Existing Mapping UI calls this "texture".
        //
        // In V2 it controls the Ambient Pad amount.

        case "texture":

          updatePadAmount(
            value
          );

          break;


        case "pad-amount":

          updatePadAmount(
            value
          );

          break;


        case "volume":

          updateVolume(
            value
          );

          break;


        case "rhythm":

          state.rhythm =
            value;

          break;
      }
    }


    // ========================================================
    // PASS 2
    //
    // Discrete note triggers.
    // ========================================================

    for (
      const output
      of mappingOutput
    ) {

      const target =
        output.targets
          ?.music;


      if (
        !target?.enabled ||
        target.parameter !==
          "note-trigger"
      ) {

        continue;
      }


      processNoteTrigger(
        output
      );
    }


    exposeState();
  }


  // ==========================================================
  // PITCH
  // ==========================================================

  function updatePitch(
    value,
    allowPreview = true
  ) {

    state.pitchValue =
      clamp01(
        value
      );


    const index =
      Math.round(

        state.pitchValue *

        (
          scaleNotes.length -
          1
        )
      );


    const nextIndex =
      Math.max(

        0,

        Math.min(
          scaleNotes.length - 1,
          index
        )
      );


    const nextNote =
      scaleNotes[
        nextIndex
      ];


    const noteChanged =
      nextNote !==
      state.note;


    state.scaleIndex =
      nextIndex;


    state.note =
      nextNote;


    if (
      noteChanged &&
      allowPreview
    ) {

      maybePreviewNote(
        nextNote
      );
    }
  }


  // ==========================================================
  // GUIDED PREVIEW
  // ==========================================================

  function maybePreviewNote(
    note
  ) {

    if (
      !initialized ||
      state.mode !==
        "guided"
    ) {

      return;
    }


    const now =
      performance.now();


    if (
      now -
      lastPreviewTime <
      85
    ) {

      return;
    }


    if (
      note ===
      lastPreviewNote
    ) {

      return;
    }


    lastPreviewTime =
      now;


    lastPreviewNote =
      note;


    previewSynth
      ?.triggerAttackRelease(

        note,

        "32n",

        undefined,

        0.18
      );
  }


  // ==========================================================
  // TIMBRE
  // ==========================================================

  function updateTimbre(
    value
  ) {

    state.timbre =
      value;


    // Dark → Bright

    const malletCutoff =
      850 +
      value *
      6100;


    malletFilter
      ?.frequency
      .rampTo(
        malletCutoff,
        0.08
      );


    const ambientCutoff =
      650 +
      value *
      2800;


    padFilter
      ?.frequency
      .rampTo(
        ambientCutoff,
        0.14
      );
  }


  // ==========================================================
  // EXPRESSIVE INTENSITY
  // ==========================================================

  function updateIntensity(
    value
  ) {

    state.intensity =
      clamp01(
        value
      );
  }


  // ==========================================================
  // AMBIENT PAD AMOUNT
  // ==========================================================

  function updatePadAmount(
    value
  ) {

    state.padAmount =
      clamp01(
        value
      );


    state.texture =
      state.padAmount;


    if (
      pad
    ) {

      const padDb =
        -30 +
        state.padAmount *
        17;


      pad.volume.rampTo(
        padDb,
        0.18
      );
    }


    if (
      reverb
    ) {

      reverb.wet.rampTo(

        0.14 +
        state.padAmount *
        0.28,

        0.2
      );
    }
  }


  // ==========================================================
  // MASTER VOLUME
  // ==========================================================

  function updateVolume(
    value
  ) {

    state.volume =
      value;


    master
      ?.gain
      .rampTo(

        0.12 +
        value *
        0.72,

        0.12
      );
  }


  // ==========================================================
  // NOTE TRIGGER
  // ==========================================================

  function processNoteTrigger(
    output
  ) {

    const value =
      clamp01(
        Number(
          output.value
        )
      );


    const previous =
      previousRuleValues.get(
        output.ruleId
      ) ?? 0;


    const triggered =
      value >= 0.5 &&
      previous < 0.5;


    previousRuleValues.set(
      output.ruleId,
      value
    );


    if (
      triggered
    ) {

      triggerCurrentNote();
    }
  }


  // ==========================================================
  // FORMAL PERFORMANCE NOTE
  // ==========================================================

  function triggerCurrentNote() {

    if (
      !initialized
    ) {

      return;
    }


    const now =
      performance.now();


    if (
      now -
      lastFormalNoteTime <
      105
    ) {

      return;
    }


    lastFormalNoteTime =
      now;


    // --------------------------------------------------------
    // Expressive velocity
    //
    // Movement energy changes how hard the virtual
    // instrument is struck.
    // --------------------------------------------------------

    const velocity =
      0.26 +
      state.intensity *
      0.68;


    state.lastVelocity =
      velocity;


    mallet
      ?.triggerAttackRelease(

        state.note,

        "8n",

        undefined,

        velocity
      );


    triggerPad();
  }


  // ==========================================================
  // AMBIENT PAD
  // ==========================================================

  function triggerPad() {

    if (
      state.padAmount <
      0.06
    ) {

      return;
    }


    const now =
      performance.now();


    if (
      now -
      lastPadTime <
      360
    ) {

      return;
    }


    lastPadTime =
      now;


    const chord =
      buildPadChord();


    const velocity =
      Math.min(

        0.36,

        0.05 +
        state.padAmount *
        0.2 +
        state.intensity *
        0.08
      );


    pad
      ?.triggerAttackRelease(

        chord,

        "2n",

        undefined,

        velocity
      );
  }


  // ==========================================================
  // PAD CHORD FROM CURRENT SCALE
  // ==========================================================

  function buildPadChord() {

    const current =
      state.scaleIndex;


    const noteIndexes = [

      current,

      Math.min(
        scaleNotes.length - 1,
        current + 2
      ),

      Math.min(
        scaleNotes.length - 1,
        current + 4
      ),
    ];


    const unique =
      [
        ...new Set(
          noteIndexes
        ),
      ];


    return unique.map(
      (index) => {

        let midi =
          noteToMidi(
            scaleNotes[
              index
            ]
          );


        // Keep the pad below the lead whenever possible.

        if (
          midi >= 60
        ) {

          midi -=
            12;
        }


        return midiToNote(
          midi
        );
      }
    );
  }


  // ==========================================================
  // SCALE
  // ==========================================================

  function setScale(
    scaleName
  ) {

    if (
      !SCALE_INTERVALS[
        scaleName
      ]
    ) {

      return false;
    }


    state.scale =
      scaleName;


    scaleNotes =
      buildScaleNotes(
        scaleName
      );


    updatePitch(
      state.pitchValue,
      false
    );


    saveSettings();


    exposeState();


    return true;
  }


  // ==========================================================
  // GUIDED / PERFORM MODE
  // ==========================================================

  function setMode(
    mode
  ) {

    if (
      mode !== "guided" &&
      mode !== "perform"
    ) {

      return false;
    }


    state.mode =
      mode;


    lastPreviewNote =
      null;


    saveSettings();


    exposeState();


    return true;
  }


  // ==========================================================
  // STOP
  // ==========================================================

  function stopAll() {

    try {

      pad
        ?.releaseAll();


      mallet
        ?.triggerRelease();


      previewSynth
        ?.triggerRelease();

    }

    catch (error) {

      console.warn(
        "[Music Engine V2] stopAll failed",
        error
      );
    }
  }


  // ==========================================================
  // STATE
  // ==========================================================

  function getState() {

    return {

      ...state,

      initialized,

      scaleNotes:
        [
          ...scaleNotes,
        ],

      noteCount:
        scaleNotes.length,
    };
  }


  function exposeState() {

    window.crossModalAudio =
      getState();
  }


  // ==========================================================
  // SETTINGS
  // ==========================================================

  function saveSettings() {

    try {

      localStorage.setItem(

        SETTINGS_KEY,

        JSON.stringify({

          scale:
            state.scale,

          mode:
            state.mode,
        })
      );

    }

    catch (error) {

      console.warn(
        "Unable to save music settings",
        error
      );
    }
  }


  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {

    start,

    process,

    stopAll,

    getState,

    setScale,

    setMode,
  };
}


// ============================================================
// BUILD SCALE
// ============================================================

function buildScaleNotes(
  scaleName
) {

  const intervals =
    SCALE_INTERVALS[
      scaleName
    ] ??
    SCALE_INTERVALS.major;


  const notes =
    [];


  for (
    let midi = MIDI_MIN;
    midi <= MIDI_MAX;
    midi++
  ) {

    const relative =
      (
        midi -
        MIDI_MIN
      ) %
      12;


    if (
      intervals.includes(
        relative
      )
    ) {

      notes.push(
        midiToNote(
          midi
        )
      );
    }
  }


  return notes;
}


// ============================================================
// MIDI HELPERS
// ============================================================

function midiToNote(
  midi
) {

  const normalized =
    Math.round(
      midi
    );


  const noteName =
    NOTE_NAMES[
      (
        normalized %
        12 +
        12
      ) %
      12
    ];


  const octave =
    Math.floor(
      normalized /
      12
    ) -
    1;


  return (
    noteName +
    octave
  );
}


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
// SETTINGS
// ============================================================

function loadSettings() {

  const defaults = {

    scale:
      "major",

    mode:
      "guided",
  };


  try {

    const raw =
      localStorage.getItem(
        SETTINGS_KEY
      );


    if (
      !raw
    ) {

      return defaults;
    }


    const parsed =
      JSON.parse(
        raw
      );


    return {

      scale:
        SCALE_INTERVALS[
          parsed.scale
        ]
          ? parsed.scale
          : defaults.scale,

      mode:
        parsed.mode ===
          "perform"
          ? "perform"
          : "guided",
    };

  }

  catch {

    return defaults;
  }
}


// ============================================================
// UTIL
// ============================================================

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