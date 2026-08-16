import * as Tone from "tone";


// ============================================================
// CROSS-MODAL MUSIC ENGINE
//
// Mapping semantic output
//          ↓
// Pitch / Trigger / Timbre / Intensity
//          ↓
// Mallet voice + Ambient Pad
// ============================================================


// C Major Pentatonic
//
// We deliberately quantize continuous hand position
// into a musical scale so that spatial movement remains
// expressive without producing arbitrary out-of-key notes.

const SCALE = [
  "C4",
  "D4",
  "E4",
  "G4",
  "A4",
  "C5",
  "D5",
  "E5",
  "G5",
  "A5",
];


// Soft ambient harmonies.
// Index is associated with the scale degree.

const PAD_CHORDS = [
  ["C3", "G3", "D4"],
  ["D3", "A3", "E4"],
  ["E3", "B3", "G4"],
  ["G3", "D4", "A4"],
  ["A3", "E4", "B4"],
];


// ============================================================
// FACTORY
// ============================================================

export function createMusicEngine() {

  let initialized = false;

  let mallet = null;
  let malletFilter = null;

  let pad = null;
  let padFilter = null;

  let reverb = null;
  let master = null;


  // ----------------------------------------------------------
  // Musical state
  // ----------------------------------------------------------

  const state = {

    pitchValue:
      0.5,

    note:
      "A4",

    scaleIndex:
      4,

    timbre:
      0.5,

    intensity:
      0.45,

    texture:
      0.4,

    volume:
      0.72,
  };


  // Prevent trigger mappings from firing continuously
  // every animation frame.

  const previousRuleValues =
    new Map();


  let lastNoteTime =
    0;


  let lastPadTime =
    0;


  // ==========================================================
  // START AUDIO
  // ==========================================================

  async function start() {

    // Tone.js requires this to happen after user interaction.
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
      "[Music Engine] Audio ready"
    );
  }


  // ==========================================================
  // AUDIO GRAPH
  // ==========================================================

  function setupAudioGraph() {

    // --------------------------------------------------------
    // Master
    // --------------------------------------------------------

    master =
      new Tone.Gain(
        0.7
      )
        .toDestination();


    // --------------------------------------------------------
    // Shared space / reverb
    // --------------------------------------------------------

    reverb =
      new Tone.Reverb(
        2.8
      );


    reverb.wet.value =
      0.28;


    reverb.connect(
      master
    );


    // --------------------------------------------------------
    // MALLET / GLOCK VOICE
    //
    // Short FM envelope:
    // clear attack + soft metallic tail
    // --------------------------------------------------------

    malletFilter =
      new Tone.Filter(
        3200,
        "lowpass"
      );


    malletFilter.connect(
      reverb
    );


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
            0.04,

          release:
            0.85,
        },

        modulation: {
          type:
            "sine",
        },

        modulationEnvelope: {

          attack:
            0.001,

          decay:
            0.24,

          sustain:
            0,

          release:
            0.35,
        },

        volume:
          -8,
      });


    mallet.connect(
      malletFilter
    );


    // --------------------------------------------------------
    // AMBIENT PAD
    // --------------------------------------------------------

    padFilter =
      new Tone.Filter(
        1700,
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
          0.8,

        decay:
          0.9,

        sustain:
          0.28,

        release:
          2.6,
      },
    });


    pad.volume.value =
      -16;


    pad.connect(
      padFilter
    );
  }


  // ==========================================================
  // PROCESS PERSONAL MAPPING OUTPUT
  // ==========================================================

  function process(
    mappingOutput
  ) {

    if (
      !initialized ||
      !Array.isArray(
        mappingOutput
      )
    ) {

      return;
    }


    // --------------------------------------------------------
    // PASS 1
    //
    // Continuous controls are processed first.
    // This ensures the newest Pitch / Timbre / Intensity
    // state exists before Note Trigger is processed.
    // --------------------------------------------------------

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


      const parameter =
        target.parameter;


      const value =
        clamp01(
          Number(
            output.value
          )
        );


      switch (
        parameter
      ) {

        case "pitch":

          updatePitch(
            value
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

          updateTexture(
            value
          );

          break;


        case "volume":

          updateVolume(
            value
          );

          break;


        case "rhythm":

          // Stored now.
          // A dedicated rhythmic sequencer can be added later.

          state.rhythm =
            value;

          break;
      }
    }


    // --------------------------------------------------------
    // PASS 2
    //
    // Event / note-trigger mappings
    // --------------------------------------------------------

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


    // Debug API

    window.crossModalAudio = {
      ...state,
      initialized,
    };
  }


  // ==========================================================
  // PITCH
  // ==========================================================

  function updatePitch(
    value
  ) {

    state.pitchValue =
      value;


    const index =
      Math.round(
        value *
        (
          SCALE.length - 1
        )
      );


    state.scaleIndex =
      Math.max(
        0,
        Math.min(
          SCALE.length - 1,
          index
        )
      );


    state.note =
      SCALE[
        state.scaleIndex
      ];
  }


  // ==========================================================
  // TIMBRE
  // ==========================================================

  function updateTimbre(
    value
  ) {

    state.timbre =
      value;


    // Dark -> bright
    //
    // 900 Hz -> ~6500 Hz

    const cutoff =
      900 +
      value *
      5600;


    malletFilter
      ?.frequency
      .rampTo(
        cutoff,
        0.08
      );


    // Pad follows more gently

    const padCutoff =
      700 +
      value *
      2600;


    padFilter
      ?.frequency
      .rampTo(
        padCutoff,
        0.15
      );
  }


  // ==========================================================
  // INTENSITY
  // ==========================================================

  function updateIntensity(
    value
  ) {

    state.intensity =
      value;
  }


  // ==========================================================
  // TEXTURE
  // ==========================================================

  function updateTexture(
    value
  ) {

    state.texture =
      value;


    // More texture -> more ambient space

    if (
      reverb
    ) {

      reverb.wet.rampTo(
        0.16 +
        value *
        0.32,

        0.2
      );
    }
  }


  // ==========================================================
  // VOLUME
  // ==========================================================

  function updateVolume(
    value
  ) {

    state.volume =
      value;


    if (
      master
    ) {

      master.gain.rampTo(

        0.12 +
        value *
        0.72,

        0.12
      );
    }
  }


  // ==========================================================
  // GENERIC NOTE TRIGGER
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


    // Rising edge
    //
    // Works both with:
    // pinchStarted -> boolean
    //
    // and continuous mappings:
    // openness -> note trigger

    const triggered =
      value >= 0.55 &&
      previous < 0.55;


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
  // PLAY NOTE
  // ==========================================================

  function triggerCurrentNote() {

    const now =
      performance.now();


    // Safety debounce

    if (
      now -
      lastNoteTime <
      110
    ) {

      return;
    }


    lastNoteTime =
      now;


    const velocity =
      0.3 +
      state.intensity *
      0.55;


    // --------------------------------------------------------
    // MALLET
    // --------------------------------------------------------

    mallet
      ?.triggerAttackRelease(

        state.note,

        "8n",

        undefined,

        velocity
      );


    // --------------------------------------------------------
    // AMBIENT PAD
    // --------------------------------------------------------

    triggerPad();
  }


  // ==========================================================
  // PAD
  // ==========================================================

  function triggerPad() {

    const now =
      performance.now();


    // Avoid building an enormous wash of overlapping pads.

    if (
      now -
      lastPadTime <
      420
    ) {

      return;
    }


    lastPadTime =
      now;


    const chordIndex =
      state.scaleIndex %
      PAD_CHORDS.length;


    const chord =
      PAD_CHORDS[
        chordIndex
      ];


    const velocity =
      0.08 +
      state.intensity *
      0.16;


    pad
      ?.triggerAttackRelease(

        chord,

        "2n",

        undefined,

        velocity
      );
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

    }

    catch (error) {

      console.warn(
        "[Music Engine] Unable to stop voices",
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
    };
  }


  // ==========================================================
  // API
  // ==========================================================

  return {

    start,

    process,

    stopAll,

    getState,
  };
}


// ============================================================
// HELPERS
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