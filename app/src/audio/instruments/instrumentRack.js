import {
  getInstrumentDefinition,
  getInstrumentOptions,
  hasInstrument,
} from "./instrumentBank.js";


// ============================================================
// INSTRUMENT RACK V4
//
// Routes pitch → register → instrument.
//
// Modes:
//
// REGISTER
// C3–B3 → LOW
// C4–B4 → MID
// C5–C6 → HIGH
//
// SINGLE
// Whole pitch range uses one instrument.
//
// Custom zone editing can be added later.
// ============================================================


const STORAGE_KEY =
  "cross-modal-instrument-rack-v4";


const DEFAULT_STATE = {

  mode:
    "register",

  singleInstrument:
    "kalimba",

  zones: {

    low: {

      id:
        "low",

      label:
        "LOW",

      minMidi:
        48, // C3

      maxMidi:
        59, // B3

      instrument:
        "marimba",
    },


    mid: {

      id:
        "mid",

      label:
        "MID",

      minMidi:
        60, // C4

      maxMidi:
        71, // B4

      instrument:
        "kalimba",
    },


    high: {

      id:
        "high",

      label:
        "HIGH",

      minMidi:
        72, // C5

      maxMidi:
        84, // C6

      instrument:
        "glassBell",
    },
  },
};


// ============================================================
// FACTORY
// ============================================================

export function createInstrumentRack() {

  const saved =
    loadState();


  const state = {

    mode:
      saved.mode,

    singleInstrument:
      saved.singleInstrument,

    zones:
      cloneZones(
        saved.zones
      ),
  };


  // ==========================================================
  // SAVE
  // ==========================================================

  function saveState() {

    try {

      localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify({

          mode:
            state.mode,

          singleInstrument:
            state.singleInstrument,

          zones:
            cloneZones(
              state.zones
            ),
        })
      );

    }

    catch (error) {

      console.warn(
        "[Instrument Rack] Unable to save settings.",
        error
      );
    }
  }


  // ==========================================================
  // MODE
  // ==========================================================

  function setMode(
    mode
  ) {

    if (
      mode !==
        "register" &&
      mode !==
        "single"
    ) {

      return false;
    }


    state.mode =
      mode;


    saveState();


    return true;
  }


  // ==========================================================
  // SINGLE INSTRUMENT
  // ==========================================================

  function setSingleInstrument(
    instrumentId
  ) {

    if (
      !hasInstrument(
        instrumentId
      )
    ) {

      return false;
    }


    state.singleInstrument =
      instrumentId;


    saveState();


    return true;
  }


  // ==========================================================
  // ZONE INSTRUMENT
  // ==========================================================

  function setZoneInstrument(
    zoneId,
    instrumentId
  ) {

    if (
      !state.zones[
        zoneId
      ] ||
      !hasInstrument(
        instrumentId
      )
    ) {

      return false;
    }


    state.zones[
      zoneId
    ].instrument =
      instrumentId;


    saveState();


    return true;
  }


  // ==========================================================
  // GET ZONE FROM NOTE
  // ==========================================================

  function getZoneForNote(
    note
  ) {

    const midi =
      noteToMidi(
        note
      );


    if (
      midi ===
      null
    ) {

      return (
        state.zones.mid
      );
    }


    if (
      midi >=
        state.zones.low
          .minMidi &&
      midi <=
        state.zones.low
          .maxMidi
    ) {

      return (
        state.zones.low
      );
    }


    if (
      midi >=
        state.zones.mid
          .minMidi &&
      midi <=
        state.zones.mid
          .maxMidi
    ) {

      return (
        state.zones.mid
      );
    }


    if (
      midi >=
        state.zones.high
          .minMidi &&
      midi <=
        state.zones.high
          .maxMidi
    ) {

      return (
        state.zones.high
      );
    }


    // Safety fallback:
    // below range → LOW
    // above range → HIGH

    if (
      midi <
      state.zones.low
        .minMidi
    ) {

      return (
        state.zones.low
      );
    }


    return (
      state.zones.high
    );
  }


  // ==========================================================
  // GET INSTRUMENT FOR NOTE
  // ==========================================================

  function getInstrumentForNote(
    note
  ) {

    if (
      state.mode ===
      "single"
    ) {

      return getInstrumentDefinition(
        state.singleInstrument
      );
    }


    const zone =
      getZoneForNote(
        note
      );


    return getInstrumentDefinition(
      zone.instrument
    );
  }


  // ==========================================================
  // ROUTE NOTE
  //
  // Music Engine V4 will call this before playback.
  // ==========================================================

  function routeNote(
    note
  ) {

    const midi =
      noteToMidi(
        note
      );


    const zone =
      getZoneForNote(
        note
      );


    const instrument =

      state.mode ===
        "single"

        ? getInstrumentDefinition(
            state.singleInstrument
          )

        : getInstrumentDefinition(
            zone.instrument
          );


    return {

      note,

      midi,

      mode:
        state.mode,

      zone: {

        id:
          zone.id,

        label:
          zone.label,

        minMidi:
          zone.minMidi,

        maxMidi:
          zone.maxMidi,
      },

      instrument,
    };
  }


  // ==========================================================
  // GET ZONE
  // ==========================================================

  function getZone(
    zoneId
  ) {

    const zone =
      state.zones[
        zoneId
      ];


    if (
      !zone
    ) {

      return null;
    }


    return {
      ...zone,
    };
  }


  // ==========================================================
  // GET ALL ZONES
  // ==========================================================

  function getZones() {

    return cloneZones(
      state.zones
    );
  }


  // ==========================================================
  // GET STATE
  // ==========================================================

  function getState() {

    return {

      mode:
        state.mode,

      singleInstrument:
        state.singleInstrument,

      zones:
        cloneZones(
          state.zones
        ),

      instruments:
        getInstrumentOptions(),
    };
  }


  // ==========================================================
  // RESET
  // ==========================================================

  function reset() {

    state.mode =
      DEFAULT_STATE.mode;


    state.singleInstrument =
      DEFAULT_STATE
        .singleInstrument;


    state.zones =
      cloneZones(
        DEFAULT_STATE.zones
      );


    saveState();


    return getState();
  }


  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {

    setMode,

    setSingleInstrument,

    setZoneInstrument,

    getZoneForNote,

    getInstrumentForNote,

    routeNote,

    getZone,

    getZones,

    getState,

    reset,
  };
}


// ============================================================
// STORAGE
// ============================================================

function loadState() {

  try {

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (
      !raw
    ) {

      return getDefaultState();
    }


    const parsed =
      JSON.parse(
        raw
      );


    const mode =

      parsed.mode ===
        "single"

        ? "single"

        : "register";


    const singleInstrument =

      hasInstrument(
        parsed.singleInstrument
      )

        ? parsed.singleInstrument

        : DEFAULT_STATE
            .singleInstrument;


    const zones =
      cloneZones(
        DEFAULT_STATE.zones
      );


    for (
      const zoneId
      of [
        "low",
        "mid",
        "high",
      ]
    ) {

      const savedZone =
        parsed.zones
          ?.[zoneId];


      if (
        savedZone &&
        hasInstrument(
          savedZone.instrument
        )
      ) {

        zones[
          zoneId
        ].instrument =
          savedZone.instrument;
      }
    }


    return {

      mode,

      singleInstrument,

      zones,
    };

  }

  catch (error) {

    console.warn(
      "[Instrument Rack] Invalid saved state. Using defaults.",
      error
    );


    return getDefaultState();
  }
}


// ============================================================
// DEFAULT STATE CLONE
// ============================================================

function getDefaultState() {

  return {

    mode:
      DEFAULT_STATE.mode,

    singleInstrument:
      DEFAULT_STATE
        .singleInstrument,

    zones:
      cloneZones(
        DEFAULT_STATE.zones
      ),
  };
}


// ============================================================
// NOTE → MIDI
// ============================================================

function noteToMidi(
  note
) {

  if (
    typeof note !==
    "string"
  ) {

    return null;
  }


  const match =
    /^([A-G])(#?)(-?\d+)$/
      .exec(
        note
      );


  if (
    !match
  ) {

    return null;
  }


  const pitchClasses = {

    C:
      0,

    D:
      2,

    E:
      4,

    F:
      5,

    G:
      7,

    A:
      9,

    B:
      11,
  };


  const [
    ,
    letter,
    sharp,
    octaveText,
  ] =
    match;


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
// CLONE ZONES
// ============================================================

function cloneZones(
  zones
) {

  return {

    low: {
      ...zones.low,
    },

    mid: {
      ...zones.mid,
    },

    high: {
      ...zones.high,
    },
  };
}