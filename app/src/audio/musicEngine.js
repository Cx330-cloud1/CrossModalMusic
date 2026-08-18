import * as Tone from "tone";

import {
  createSamplePlayer,
} from "./instruments/samplePlayer.js";


// ============================================================
// MUSIC ENGINE V4
//
// Composition Assist
//        ↓
// Instrument Rack
//        ↓
// Sample Player
//        ↓
// Instrument FX
//        ↓
// Shared Reverb
//
// Preview + Formal playback now share the same instrument.
// ============================================================


const SETTINGS_KEY =
  "cross-modal-music-settings-v4";


const MIDI_MIN =
  48; // C3


const MIDI_MAX =
  84; // C6


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

export function createMusicEngine({
  compositionEngine,
  instrumentRack,
}) {

  if (
    !compositionEngine
  ) {

    throw new Error(
      "Music Engine V4 requires Composition Engine."
    );
  }


  if (
    !instrumentRack
  ) {

    throw new Error(
      "Music Engine V4 requires Instrument Rack."
    );
  }


  const settings =
    loadSettings();


  let initialized =
    false;


  let scaleNotes =
    buildScaleNotes(
      settings.scale
    );


  // ==========================================================
  // AUDIO
  // ==========================================================

  let master =
    null;


  let reverb =
    null;


  let instrumentFilter =
    null;


  let samplePlayer =
    null;


  let pad =
    null;


  let padFilter =
    null;


  // ==========================================================
  // STATE
  // ==========================================================

  const state = {

    scale:
      settings.scale,

    mode:
      settings.mode,

    pitchValue:
      0.5,

    originalNote:
      "",

    note:
      "",

    noteRole:
      "color",

    noteRoleLabel:
      "COLOR",

    assistChanged:
      false,

    timbre:
      0.5,

    intensity:
      0.35,

    expression:
      0.35,

    volume:
      0.72,

    lastVelocity:
      0.5,

    harmony:
      null,

    // --------------------------------------------------------
    // INSTRUMENT ROUTING
    // --------------------------------------------------------

    instrumentId:
      "kalimba",

    instrumentLabel:
      "Kalimba",

    instrumentFamily:
      "Plucked",

    instrumentSource:
      "synth-fallback",

    zoneId:
      "mid",

    zoneLabel:
      "MID",

    rackMode:
      "register",
  };


  // ==========================================================
  // EVENT STATE
  // ==========================================================

  const previousRuleValues =
    new Map();


  let lastPreviewTime =
    0;


  let lastPreviewNote =
    null;


  let suppressPreviewUntil =
    0;


  let lastScheduledNoteTime =
    -Infinity;


  let lastHarmonyAbsoluteBar =
    null;


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


    samplePlayer =
      createSamplePlayer({

        destination:
          instrumentFilter,
      });


    await samplePlayer
      .initialize();


    compositionEngine
      .startClock();


    lastHarmonyAbsoluteBar =
      null;


    initialized =
      true;


    updateInstrumentRouting();


    exposeState();


    console.log(
      "[Music Engine V4] Audio ready",
      getState()
    );
  }


  // ==========================================================
  // AUDIO GRAPH
  // ==========================================================

  function setupAudioGraph() {

    master =
      new Tone.Gain(
        0.72
      );


    master.toDestination();


    reverb =
      new Tone.Reverb(
        2.9
      );


    reverb.wet.value =
      0.20;


    reverb.connect(
      master
    );


    // --------------------------------------------------------
    // ALL INSTRUMENTS
    //
    // Left X still works as global timbre.
    // --------------------------------------------------------

    instrumentFilter =
      new Tone.Filter({

        type:
          "lowpass",

        frequency:
          4200,

        rolloff:
          -12,
      });


    instrumentFilter.connect(
      reverb
    );


    // --------------------------------------------------------
    // HARMONIC PAD
    // --------------------------------------------------------

    padFilter =
      new Tone.Filter({

        type:
          "lowpass",

        frequency:
          1450,

        rolloff:
          -12,
      });


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
          0.78,

        decay:
          0.8,

        sustain:
          0.38,

        release:
          2.1,
      },
    });


    pad.volume.value =
      -22;


    pad.connect(
      padFilter
    );
  }


  // ==========================================================
  // PROCESS
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


    updateHarmonyContext();


    // ========================================================
    // CONTINUOUS CONTROLS
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


        case "texture":

        case "expression":

          updateExpression(
            value
          );

          break;


        case "volume":

          updateVolume(
            value
          );

          break;
      }
    }


    // ========================================================
    // EVENT CONTROLS
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


    const stableIndex =
      compositionEngine
        .stabilizePitch(

          state.pitchValue,

          scaleNotes.length
        );


    const index =
      Math.max(

        0,

        Math.min(

          scaleNotes.length -
          1,

          stableIndex
        )
      );


    const originalNote =
      scaleNotes[
        index
      ];


    const assisted =
      compositionEngine
        .assistPitch({

          note:
            originalNote,

          scaleNotes,

          scaleName:
            getTonalContextName(
              state.scale
            ),
        });


    const previousNote =
      state.note;


    state.originalNote =
      originalNote;


    state.note =
      assisted.note;


    state.noteRole =
      assisted.role;


    state.noteRoleLabel =
      assisted.label;


    state.assistChanged =
      assisted.changed;


    updateInstrumentRouting();


    const changed =
      previousNote !==
      state.note;


    if (
      changed &&
      allowPreview
    ) {

      maybePreviewNote(
        state.note
      );
    }
  }


  // ==========================================================
  // INSTRUMENT ROUTING
  // ==========================================================

  function updateInstrumentRouting() {

    if (
      !state.note
    ) {

      return;
    }


    const route =
      instrumentRack
        .routeNote(
          state.note
        );


    state.instrumentId =
      route.instrument.id;


    state.instrumentLabel =
      route.instrument.label;


    state.instrumentFamily =
      route.instrument.family;


    state.zoneId =
      route.zone.id;


    state.zoneLabel =
      route.zone.label;


    state.rackMode =
      route.mode;


    if (
      samplePlayer
    ) {

      const voice =
        samplePlayer.getVoice(
          route.instrument.id
        );


      state.instrumentSource =
        voice?.sourceType ??
        route.instrument
          .sourceType;
    }
  }


  // ==========================================================
  // PREVIEW
  // ==========================================================

  function maybePreviewNote(
    note
  ) {

    if (
      !initialized ||
      state.mode !==
        "guided" ||
      !samplePlayer
    ) {

      return;
    }


    const now =
      performance.now();


    if (
      now <
      suppressPreviewUntil
    ) {

      return;
    }


    if (
      now -
      lastPreviewTime <
      110
    ) {

      return;
    }


    if (
      note ===
      lastPreviewNote
    ) {

      return;
    }


    const route =
      instrumentRack
        .routeNote(
          note
        );


    lastPreviewTime =
      now;


    lastPreviewNote =
      note;


    samplePlayer
      .playPreview({

        note,

        instrumentId:
          route.instrument.id,

        velocity:
          0.11,

        duration:
          0.075,
      });
  }


  // ==========================================================
  // TIMBRE
  // ==========================================================

  function updateTimbre(
    value
  ) {

    state.timbre =
      clamp01(
        value
      );


    const cutoff =
      1100 +
      state.timbre *
      6500;


    instrumentFilter
      ?.frequency
      .rampTo(

        cutoff,

        0.08
      );
  }


  // ==========================================================
  // INTENSITY
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
  // EXPRESSION
  // ==========================================================

  function updateExpression(
    value
  ) {

    state.expression =
      clamp01(
        value
      );


    samplePlayer
      ?.setExpression(
        state.expression
      );


    padFilter
      ?.frequency
      .rampTo(

        900 +
        state.expression *
        2300,

        0.16
      );


    if (
      pad
    ) {

      pad.volume
        .rampTo(

          -26 +
          state.expression *
          9,

          0.18
        );
    }


    reverb
      ?.wet
      .rampTo(

        0.12 +
        state.expression *
        0.28,

        0.18
      );
  }


  // ==========================================================
  // VOLUME
  // ==========================================================

  function updateVolume(
    value
  ) {

    state.volume =
      clamp01(
        value
      );


    master
      ?.gain
      .rampTo(

        0.12 +
        state.volume *
        0.74,

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
      previousRuleValues
        .get(
          output.ruleId
        ) ?? 0;


    const triggered =

      value >= 0.5 &&
      previous < 0.5;


    previousRuleValues
      .set(
        output.ruleId,
        value
      );


    if (
      !triggered
    ) {

      return;
    }


    const now =
      performance.now();


    suppressPreviewUntil =
      now +
      420;


    const delay =
      compositionEngine
        .getQuantizedDelay(
          now
        );


    scheduleFormalNote(
      delay
    );
  }


  // ==========================================================
  // FORMAL NOTE
  // ==========================================================

  function scheduleFormalNote(
    delayMs
  ) {

    if (
      !initialized ||
      !samplePlayer
    ) {

      return;
    }


    const targetTime =
      performance.now() +
      delayMs;


    if (
      Math.abs(
        targetTime -
        lastScheduledNoteTime
      ) <
      55
    ) {

      return;
    }


    lastScheduledNoteTime =
      targetTime;


    // --------------------------------------------------------
    // Snapshot current intention.
    // --------------------------------------------------------

    const note =
      state.note;


    const route =
      instrumentRack
        .routeNote(
          note
        );


    const velocity =
      0.28 +
      state.intensity *
      0.68;


    state.lastVelocity =
      velocity;


    const audioTime =
      Tone.now() +
      delayMs /
      1000;


    samplePlayer
      .playNote({

        note,

        instrumentId:
          route.instrument.id,

        velocity,

        duration:
          getNoteDuration(
            route.instrument.id
          ),

        time:
          audioTime,
      });
  }


  // ==========================================================
  // NOTE DURATION
  // ==========================================================

  function getNoteDuration(
    instrumentId
  ) {

    switch (
      instrumentId
    ) {

      case "glassBell":

        return 0.62;


      case "warmSynth":

        return 0.72;


      case "softPiano":

        return 0.46;


      case "marimba":

        return 0.32;


      case "mutedPluck":

        return 0.20;


      case "kalimba":

      default:

        return 0.34;
    }
  }


  // ==========================================================
  // HARMONY
  // ==========================================================

  function updateHarmonyContext() {

    const harmony =
      compositionEngine
        .getHarmony();


    state.harmony =
      harmony;


    if (
      !initialized
    ) {

      return;
    }


    if (
      harmony.absoluteBar ===
      lastHarmonyAbsoluteBar
    ) {

      return;
    }


    lastHarmonyAbsoluteBar =
      harmony.absoluteBar;


    const compositionState =
      compositionEngine
        .getState();


    const beatSeconds =
      60 /
      compositionState.tempo;


    const barDuration =
      beatSeconds *
      4 *
      0.96;


    const velocity =
      0.055 +
      state.expression *
      0.075;


    const startTime =
      Tone.now() +
      0.015;


    pad
      ?.releaseAll(
        startTime
      );


    pad
      ?.triggerAttackRelease(

        harmony.padNotes,

        barDuration,

        startTime,

        velocity
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


    compositionEngine
      .resetPitch();


    updatePitch(
      state.pitchValue,
      false
    );


    saveSettings();


    exposeState();


    return true;
  }


  // ==========================================================
  // PLAY MODE
  // ==========================================================

  function setMode(
    mode
  ) {

    if (
      mode !==
        "guided" &&
      mode !==
        "perform"
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
  // RACK API
  // ==========================================================

  function setRackMode(
    mode
  ) {

    const success =
      instrumentRack
        .setMode(
          mode
        );


    if (
      success
    ) {

      updateInstrumentRouting();

      exposeState();
    }


    return success;
  }


  function setZoneInstrument(
    zoneId,
    instrumentId
  ) {

    const success =
      instrumentRack
        .setZoneInstrument(
          zoneId,
          instrumentId
        );


    if (
      success
    ) {

      updateInstrumentRouting();

      exposeState();
    }


    return success;
  }


  function setSingleInstrument(
    instrumentId
  ) {

    const success =
      instrumentRack
        .setSingleInstrument(
          instrumentId
        );


    if (
      success
    ) {

      updateInstrumentRouting();

      exposeState();
    }


    return success;
  }


  function refreshInstrumentRouting() {

    updateInstrumentRouting();

    exposeState();
  }


  // ==========================================================
  // COMPOSITION REFRESH
  // ==========================================================

  function refreshComposition() {

    compositionEngine
      .resetPitch();


    lastHarmonyAbsoluteBar =
      null;


    updatePitch(
      state.pitchValue,
      false
    );


    exposeState();
  }


  // ==========================================================
  // STOP
  // ==========================================================

  function stopAll() {

    samplePlayer
      ?.stopAll();


    try {

      pad
        ?.releaseAll();

    }

    catch {

      // Ignore release errors.
    }
  }


  // ==========================================================
  // STATE
  // ==========================================================

  function getState() {

    const composition =
      compositionEngine
        .getState();


    return {

      ...state,

      initialized,

      scaleNotes:
        [
          ...scaleNotes,
        ],

      noteCount:
        scaleNotes.length,

      harmony:
        composition.harmony,

      tempo:
        composition.tempo,

      grid:
        composition.grid,

      assistMode:
        composition.assistMode,

      rack:
        instrumentRack
          .getState(),

      audioSources:
        samplePlayer
          ?.getStatus() ??
        null,
    };
  }


  // ==========================================================
  // DEBUG
  // ==========================================================

  function exposeState() {

    window.crossModalAudio =
      getState();
  }


  // ==========================================================
  // SAVE
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
        "[Music Engine V4] Unable to save settings.",
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

    setRackMode,

    setZoneInstrument,

    setSingleInstrument,

    refreshInstrumentRouting,

    refreshComposition,
  };
}


// ============================================================
// SCALE
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
    let midi =
      MIDI_MIN;

    midi <=
      MIDI_MAX;

    midi++
  ) {

    const relative =
      positiveMod(

        midi -
        MIDI_MIN,

        12
      );


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
// TONAL CONTEXT
// ============================================================

function getTonalContextName(
  scale
) {

  if (
    scale ===
    "chromatic"
  ) {

    return "major";
  }


  return scale;
}


// ============================================================
// MIDI
// ============================================================

function midiToNote(
  midi
) {

  const normalized =
    Math.round(
      midi
    );


  const name =
    NOTE_NAMES[
      positiveMod(
        normalized,
        12
      )
    ];


  const octave =
    Math.floor(
      normalized /
      12
    ) -
    1;


  return (
    name +
    octave
  );
}


// ============================================================
// STORAGE
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