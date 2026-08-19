// ============================================================
// FINGER SLEEVE → CROSS-MODAL MAPPING ADAPTER
//
// Hardware / Simulation State
//        ↓
// Generic Mapping Output
//        ↓
// Music + Visual + Haptic
//
// Important:
// Music Engine does NOT need to know whether the source
// came from MediaPipe, simulated hardware, or real hardware.
// ============================================================

export function createDeviceMappingAdapter() {

  function resolve(
    state
  ) {

    if (
      !state
    ) {

      return [];
    }


    // ========================================================
    // STRIKE ENERGY
    //
    // Pressure:
    // sustained intentional force
    //
    // Impact:
    // transient attack energy
    //
    // For V1 they are combined into one expressive intensity.
    //
    // Later Audio V4.1 can separate:
    // Pressure → velocity / sustain
    // Impact   → attack envelope
    // ========================================================

    const strikeEnergy =
      state.connected

        ? clamp01(

            0.12 +

            state.pressure *
              0.68 +

            state.impact *
              0.32
          )

        : 0;


    // ========================================================
    // TOUCH EVENT
    // ========================================================

    const touchTriggered =
      Boolean(

        state.connected &&

        (
          state.tapTriggered ||
          state.contactStarted
        )
      );


    // ========================================================
    // OUTPUTS
    // ========================================================

    return [

      // ------------------------------------------------------
      // PRESSURE + IMPACT
      //
      // → musical intensity
      // → visual energy
      // → body vibration strength
      // ------------------------------------------------------

      {

        ruleId:
          "finger-sleeve-strike-energy",


        source: {

          device:
            "finger-sleeve",

          finger:
            state.finger ??
            "index",

          feature:
            "strike-energy",
        },


        value:
          strikeEnergy,


        rawValue: {

          pressure:
            state.pressure,

          impact:
            state.impact,
        },


        targets: {

          music: {

            enabled:
              true,

            parameter:
              "intensity",
          },


          visual: {

            enabled:
              true,

            parameter:
              "particle-energy",
          },


          haptic: {

            enabled:
              true,

            parameter:
              "intensity",
          },
        },
      },


      // ------------------------------------------------------
      // CONTACT / TAP
      //
      // → play note
      // → visual pulse
      // → alternating clavicle feedback
      // ------------------------------------------------------

      {

        ruleId:
          "finger-sleeve-touch-trigger",


        source: {

          device:
            "finger-sleeve",

          finger:
            state.finger ??
            "index",

          feature:
            "contactStarted",
        },


        value:
          touchTriggered
            ? 1
            : 0,


        rawValue:
          touchTriggered,


        targets: {

          music: {

            enabled:
              true,

            parameter:
              "note-trigger",
          },


          visual: {

            enabled:
              true,

            parameter:
              "pulse",
          },


          haptic: {

            enabled:
              true,

            parameter:
              "alternating",
          },
        },
      },
    ];
  }


  return {
    resolve,
  };
}


function clamp01(
  value
) {

  return Math.max(

    0,

    Math.min(
      1,
      Number(value) ||
      0
    )
  );
}