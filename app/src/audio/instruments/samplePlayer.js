import * as Tone from "tone";

import {
  INSTRUMENT_BANK,
} from "./instrumentBank.js";


// ============================================================
// SAMPLE PLAYER V4
//
// Unified instrument playback layer.
//
// Features:
//
// 1. Real WAV samples when available
// 2. Synth fallback when samples are missing
// 3. Preview + formal note use the SAME instrument
// 4. Independent instrument character
// 5. Shared expression control
//
// Music Engine only needs:
//
// playNote(...)
// playPreview(...)
// setExpression(...)
//
// ============================================================


export function createSamplePlayer({
  destination = null,
} = {}) {

  // ==========================================================
  // MASTER OUTPUT
  // ==========================================================

  const output =
    new Tone.Gain(
      0.9
    );


  if (
    destination
  ) {

    output.connect(
      destination
    );

  }

  else {

    output.toDestination();
  }


  // ==========================================================
  // STATE
  // ==========================================================

  const voices =
    new Map();


  let initialized =
    false;


  let initializing =
    false;


  let initializationPromise =
    null;


  let expression =
    0.35;


  // ==========================================================
  // INITIALIZE
  // ==========================================================

  async function initialize() {

    if (
      initialized
    ) {

      return getStatus();
    }


    if (
      initializationPromise
    ) {

      return initializationPromise;
    }


    initializationPromise =
      initializeInternal();


    return initializationPromise;
  }


  async function initializeInternal() {

    initializing =
      true;


    try {

      await Tone.start();


      // ------------------------------------------------------
      // Build all instruments.
      // ------------------------------------------------------

      for (
        const instrument
        of Object.values(
          INSTRUMENT_BANK
        )
      ) {

        try {

          const voice =
            await createInstrumentVoice(
              instrument
            );


          voices.set(
            instrument.id,
            voice
          );


        }

        catch (error) {

          console.warn(
            `[Sample Player] Unable to create ${instrument.label}. Using fallback.`,
            error
          );


          const fallback =
            createFallbackVoice(
              instrument
            );


          voices.set(
            instrument.id,
            fallback
          );
        }
      }


      // ------------------------------------------------------
      // Wait for every Tone.js sample buffer.
      // ------------------------------------------------------

      try {

        await Tone.loaded();

      }

      catch (error) {

        console.warn(
          "[Sample Player] Some audio samples failed to load.",
          error
        );
      }


      initialized =
        true;


      applyExpression();


      console.log(
        "[Sample Player V4] Ready",
        getStatus()
      );


      return getStatus();

    }

    finally {

      initializing =
        false;


      initializationPromise =
        null;
    }
  }


  // ==========================================================
  // CREATE INSTRUMENT
  // ==========================================================

  async function createInstrumentVoice(
    instrument
  ) {

    // --------------------------------------------------------
    // SAMPLE-BASED INSTRUMENT
    // --------------------------------------------------------

    if (
      instrument.sourceType ===
      "sampler"
    ) {

      const availableSamples =
        await getAvailableSamples(
          instrument.samples ??
          {}
        );


      if (
        Object.keys(
          availableSamples
        ).length >
        0
      ) {

        return createSamplerVoice(

          instrument,

          availableSamples
        );
      }


      console.info(
        `[Sample Player] No WAV files found for ${instrument.label}. Synth fallback enabled.`
      );
    }


    // --------------------------------------------------------
    // SYNTH INSTRUMENT
    // OR
    // MISSING-SAMPLE FALLBACK
    // --------------------------------------------------------

    return createFallbackVoice(
      instrument
    );
  }


  // ==========================================================
  // SAMPLER
  // ==========================================================

  function createSamplerVoice(
    instrument,
    samples
  ) {

    const filter =
      createCharacterFilter(
        instrument
      );


    const gain =
      new Tone.Gain(
        instrument.character
          ?.gain ??
        0.8
      );


    // --------------------------------------------------------
    // ROUTING
    //
    // Sampler
    // ↓
    // Instrument Filter
    // ↓
    // Instrument Gain
    // ↓
    // Sample Player Output
    // --------------------------------------------------------

    filter.connect(
      gain
    );


    gain.connect(
      output
    );


    const sampler =
      new Tone.Sampler({

        urls:
          samples,

        attack:
          0,

        release:
          instrument.character
            ?.release ??
          1,
      });


    sampler.connect(
      filter
    );


    return {

      id:
        instrument.id,

      definition:
        instrument,

      sourceType:
        "sampler",

      source:
        sampler,

      filter,

      gain,

      loadedSampleCount:
        Object.keys(
          samples
        ).length,
    };
  }


  // ==========================================================
  // FALLBACK VOICE
  // ==========================================================

  function createFallbackVoice(
    instrument
  ) {

    const filter =
      createCharacterFilter(
        instrument
      );


    const gain =
      new Tone.Gain(
        instrument.character
          ?.gain ??
        0.8
      );


    filter.connect(
      gain
    );


    gain.connect(
      output
    );


    const source =
      createFallbackSynth(
        instrument.id
      );


    source.connect(
      filter
    );


    return {

      id:
        instrument.id,

      definition:
        instrument,

      sourceType:
        "synth-fallback",

      source,

      filter,

      gain,

      loadedSampleCount:
        0,
    };
  }


  // ==========================================================
  // SYNTH FALLBACKS
  // ==========================================================

  function createFallbackSynth(
    instrumentId
  ) {

    switch (
      instrumentId
    ) {

      // ======================================================
      // KALIMBA
      // ======================================================

      case "kalimba":

        return new Tone.PolySynth(

          Tone.FMSynth,

          {

            harmonicity:
              3.2,

            modulationIndex:
              5.8,

            oscillator: {

              type:
                "sine",
            },

            envelope: {

              attack:
                0.001,

              decay:
                0.34,

              sustain:
                0.025,

              release:
                0.95,
            },

            modulation: {

              type:
                "sine",
            },

            modulationEnvelope: {

              attack:
                0.001,

              decay:
                0.19,

              sustain:
                0,

              release:
                0.22,
            },
          }
        );


      // ======================================================
      // MARIMBA
      // ======================================================

      case "marimba":

        return new Tone.PolySynth(

          Tone.FMSynth,

          {

            harmonicity:
              2.0,

            modulationIndex:
              2.1,

            oscillator: {

              type:
                "sine",
            },

            envelope: {

              attack:
                0.003,

              decay:
                0.48,

              sustain:
                0.04,

              release:
                0.68,
            },

            modulation: {

              type:
                "sine",
            },

            modulationEnvelope: {

              attack:
                0.002,

              decay:
                0.32,

              sustain:
                0,

              release:
                0.25,
            },
          }
        );


      // ======================================================
      // SOFT PIANO
      //
      // This is intentionally only a temporary fallback.
      // Real piano quality comes from the Sampler later.
      // ======================================================

      case "softPiano":

        return new Tone.PolySynth(

          Tone.Synth,

          {

            oscillator: {

              type:
                "triangle",
            },

            envelope: {

              attack:
                0.004,

              decay:
                0.55,

              sustain:
                0.20,

              release:
                1.3,
            },
          }
        );


      // ======================================================
      // GLASS BELL
      // ======================================================

      case "glassBell":

        return new Tone.PolySynth(

          Tone.FMSynth,

          {

            harmonicity:
              4.15,

            modulationIndex:
              8.5,

            oscillator: {

              type:
                "sine",
            },

            envelope: {

              attack:
                0.001,

              decay:
                0.92,

              sustain:
                0.015,

              release:
                1.85,
            },

            modulation: {

              type:
                "sine",
            },

            modulationEnvelope: {

              attack:
                0.001,

              decay:
                0.68,

              sustain:
                0,

              release:
                0.75,
            },
          }
        );


      // ======================================================
      // MUTED PLUCK
      // ======================================================

      case "mutedPluck":

        return new Tone.PolySynth(

          Tone.Synth,

          {

            oscillator: {

              type:
                "triangle",
            },

            envelope: {

              attack:
                0.001,

              decay:
                0.16,

              sustain:
                0.02,

              release:
                0.36,
            },
          }
        );


      // ======================================================
      // WARM SYNTH
      // ======================================================

      case "warmSynth":

        return new Tone.PolySynth(

          Tone.Synth,

          {

            oscillator: {

              type:
                "sine",
            },

            envelope: {

              attack:
                0.16,

              decay:
                0.42,

              sustain:
                0.38,

              release:
                1.55,
            },
          }
        );


      // ======================================================
      // SAFETY FALLBACK
      // ======================================================

      default:

        return new Tone.PolySynth(

          Tone.Synth,

          {

            oscillator: {

              type:
                "triangle",
            },

            envelope: {

              attack:
                0.003,

              decay:
                0.35,

              sustain:
                0.08,

              release:
                0.75,
            },
          }
        );
    }
  }


  // ==========================================================
  // CHARACTER FILTER
  // ==========================================================

  function createCharacterFilter(
    instrument
  ) {

    const brightness =
      clamp01(
        instrument.character
          ?.brightness ??
        0.5
      );


    const frequency =

      900 +

      brightness *
      6500;


    return new Tone.Filter({

      type:
        "lowpass",

      frequency,

      rolloff:
        -12,
    });
  }


  // ==========================================================
  // FORMAL NOTE
  // ==========================================================

  function playNote({

    note,

    instrumentId,

    velocity =
      0.7,

    duration =
      0.32,

    time =
      undefined,

  }) {

    if (
      !initialized
    ) {

      return false;
    }


    const voice =
      getVoice(
        instrumentId
      );


    if (
      !voice ||
      !note
    ) {

      return false;
    }


    const finalVelocity =
      clamp01(
        velocity
      );


    try {

      voice.source
        .triggerAttackRelease(

          note,

          duration,

          time,

          finalVelocity
        );


      return true;

    }

    catch (error) {

      console.warn(
        `[Sample Player] Unable to play ${note} on ${instrumentId}.`,
        error
      );


      return false;
    }
  }


  // ==========================================================
  // PREVIEW NOTE
  //
  // IMPORTANT:
  //
  // Preview uses the SAME voice as formal playback.
  //
  // Only:
  // - lower velocity
  // - shorter duration
  //
  // are different.
  // ==========================================================

  function playPreview({

    note,

    instrumentId,

    velocity =
      0.11,

    duration =
      0.075,

    time =
      undefined,

  }) {

    if (
      !initialized
    ) {

      return false;
    }


    const voice =
      getVoice(
        instrumentId
      );


    if (
      !voice ||
      !note
    ) {

      return false;
    }


    const finalVelocity =
      Math.min(

        0.22,

        clamp01(
          velocity
        )
      );


    try {

      voice.source
        .triggerAttackRelease(

          note,

          duration,

          time,

          finalVelocity
        );


      return true;

    }

    catch (error) {

      console.warn(
        `[Sample Player] Unable to preview ${note} on ${instrumentId}.`,
        error
      );


      return false;
    }
  }


  // ==========================================================
  // GENERIC PLAY
  // ==========================================================

  function play({

    note,

    instrumentId,

    type =
      "formal",

    velocity =
      0.7,

    duration,

    time,

  }) {

    if (
      type ===
      "preview"
    ) {

      return playPreview({

        note,

        instrumentId,

        velocity,

        duration:
          duration ??
          0.075,

        time,
      });
    }


    return playNote({

      note,

      instrumentId,

      velocity,

      duration:
        duration ??
        0.32,

      time,
    });
  }


  // ==========================================================
  // EXPRESSION
  // ==========================================================

  function setExpression(
    value
  ) {

    expression =
      clamp01(
        value
      );


    applyExpression();
  }


  // ==========================================================
  // APPLY EXPRESSION
  // ==========================================================

  function applyExpression() {

    for (
      const voice
      of voices.values()
    ) {

      const baseBrightness =
        clamp01(
          voice.definition
            .character
            ?.brightness ??
          0.5
        );


      // ------------------------------------------------------
      // Each instrument keeps its own identity.
      //
      // Openness only moves it inside a controlled range.
      // ------------------------------------------------------

      const frequency =

        700 +

        baseBrightness *
        5200 +

        expression *
        1900;


      voice.filter
        .frequency
        .rampTo(

          frequency,

          0.12
        );
    }
  }


  // ==========================================================
  // GET VOICE
  // ==========================================================

  function getVoice(
    instrumentId
  ) {

    if (
      voices.has(
        instrumentId
      )
    ) {

      return voices.get(
        instrumentId
      );
    }


    // --------------------------------------------------------
    // Default musical fallback.
    // --------------------------------------------------------

    if (
      voices.has(
        "kalimba"
      )
    ) {

      return voices.get(
        "kalimba"
      );
    }


    const firstVoice =
      voices.values()
        .next()
        .value;


    return (
      firstVoice ??
      null
    );
  }


  // ==========================================================
  // STOP ALL
  // ==========================================================

  function stopAll() {

    for (
      const voice
      of voices.values()
    ) {

      try {

        if (
          typeof voice.source
            .releaseAll ===
          "function"
        ) {

          voice.source
            .releaseAll();
        }

      }

      catch (error) {

        console.warn(
          `[Sample Player] Unable to release ${voice.id}.`,
          error
        );
      }
    }
  }


  // ==========================================================
  // STATUS
  // ==========================================================

  function getStatus() {

    const instruments =
      {};


    for (
      const [
        id,
        voice,
      ]
      of voices.entries()
    ) {

      instruments[
        id
      ] = {

        id,

        label:
          voice.definition
            .label,

        family:
          voice.definition
            .family,

        sourceType:
          voice.sourceType,

        loadedSampleCount:
          voice
            .loadedSampleCount,

        usingSamples:
          voice.sourceType ===
          "sampler",
      };
    }


    return {

      initialized,

      initializing,

      expression,

      instruments,
    };
  }


  // ==========================================================
  // DISPOSE
  // ==========================================================

  function dispose() {

    stopAll();


    for (
      const voice
      of voices.values()
    ) {

      try {

        voice.source
          ?.dispose();


        voice.filter
          ?.dispose();


        voice.gain
          ?.dispose();

      }

      catch (error) {

        console.warn(
          `[Sample Player] Unable to dispose ${voice.id}.`,
          error
        );
      }
    }


    voices.clear();


    try {

      output.dispose();

    }

    catch {

      // Ignore output disposal errors.
    }


    initialized =
      false;
  }


  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {

    initialize,

    play,

    playNote,

    playPreview,

    setExpression,

    stopAll,

    getStatus,

    getVoice,

    dispose,

    output,
  };
}


// ============================================================
// FIND AVAILABLE SAMPLES
// ============================================================

async function getAvailableSamples(
  samples
) {

  const available =
    {};


  const entries =
    Object.entries(
      samples
    );


  await Promise.all(

    entries.map(

      async ([
        note,
        rawUrl,
      ]) => {

        const url =
          resolvePublicUrl(
            rawUrl
          );


        const exists =
          await sampleExists(
            url
          );


        if (
          exists
        ) {

          available[
            note
          ] =
            url;
        }
      }
    )
  );


  return available;
}


// ============================================================
// SAMPLE EXISTS
//
// Important for Vite:
//
// Missing public assets can sometimes resolve to an HTML
// fallback depending on deployment configuration.
//
// HTML must never be treated as a WAV sample.
// ============================================================

async function sampleExists(
  url
) {

  try {

    const response =
      await fetch(

        url,

        {

          method:
            "HEAD",

          cache:
            "no-store",
        }
      );


    if (
      !response.ok
    ) {

      return false;
    }


    const contentType =
      response.headers
        .get(
          "content-type"
        ) ??
      "";


    // --------------------------------------------------------
    // Never accept an HTML fallback page.
    // --------------------------------------------------------

    if (
      contentType
        .toLowerCase()
        .includes(
          "text/html"
        )
    ) {

      return false;
    }


    return true;

  }

  catch {

    return false;
  }
}


// ============================================================
// PUBLIC URL
//
// Example:
//
// raw:
// /audio/instruments/kalimba/C4.wav
//
// Vite root deployment:
// /audio/instruments/kalimba/C4.wav
//
// GitHub Pages subpath:
// /CrossModalMusic/audio/instruments/kalimba/C4.wav
// ============================================================

function resolvePublicUrl(
  rawUrl
) {

  const cleanPath =
    String(
      rawUrl
    ).replace(
      /^\/+/,
      ""
    );


  const rawBase =
    import.meta.env
      .BASE_URL ??
    "/";


  const base =
    rawBase.endsWith(
      "/"
    )

      ? rawBase

      : `${rawBase}/`;


  return (
    base +
    cleanPath
  );
}


// ============================================================
// HELPERS
// ============================================================

function clamp01(
  value
) {

  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return 0;
  }


  return Math.max(

    0,

    Math.min(
      1,
      number
    )
  );
}