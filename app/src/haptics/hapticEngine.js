// ============================================================
// VIRTUAL HAPTIC ENGINE
//
// Mapping output
//      ↓
// Four-point virtual clavicle haptic system
//
// L2 —— L1      R1 —— R2
// ============================================================

export function createHapticEngine({
  root,
}) {

  if (!root) {
    return {
      process() {},
      clear() {},
      getState() {
        return {};
      },
    };
  }


  const pointElements = {

    L1:
      root.querySelector(
        '[data-haptic-point="L1"]'
      ),

    L2:
      root.querySelector(
        '[data-haptic-point="L2"]'
      ),

    R1:
      root.querySelector(
        '[data-haptic-point="R1"]'
      ),

    R2:
      root.querySelector(
        '[data-haptic-point="R2"]'
      ),
  };


  const statusElement =
    root.querySelector(
      "#hapticStatus"
    );


  const patternElement =
    root.querySelector(
      "#hapticPattern"
    );


  const intensityElement =
    root.querySelector(
      "#hapticIntensity"
    );


  const state = {

    points: {
      L1: 0,
      L2: 0,
      R1: 0,
      R2: 0,
    },

    pattern:
      "idle",

    intensity:
      0,

    alternatingSide:
      "left",
  };


  const previousEventValues =
    new Map();


  let lastFrame =
    performance.now();


  requestAnimationFrame(
    animationLoop
  );


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


    let receivedHapticMapping =
      false;


    for (
      const output
      of mappingOutput
    ) {

      const target =
        output.targets
          ?.haptic;


      if (
        !target?.enabled
      ) {
        continue;
      }


      receivedHapticMapping =
        true;


      const value =
        clamp01(
          Number(
            output.value
          )
        );


      const pattern =
        target.parameter;


      switch (
        pattern
      ) {

        case "left-pair":

          applyLeftPair(
            value
          );

          break;


        case "right-pair":

          applyRightPair(
            value
          );

          break;


        case "alternating":

          processAlternating(
            output.ruleId,
            value
          );

          break;


        case "center-to-right":

          applyCenterToRight(
            value
          );

          break;


        case "intensity":

          applyAll(
            value
          );

          state.pattern =
            "intensity";

          break;


        case "all":

          applyAll(
            value
          );

          state.pattern =
            "all-points";

          break;
      }
    }


    if (
      !receivedHapticMapping
    ) {

      state.pattern =
        "idle";
    }


    updateDebugState();
  }


  // ==========================================================
  // LEFT PAIR
  // ==========================================================

  function applyLeftPair(
    value
  ) {

    state.points.L1 =
      value;

    state.points.L2 =
      value;


    state.points.R1 *=
      0.75;

    state.points.R2 *=
      0.75;


    state.pattern =
      "left-pair";


    state.intensity =
      value;
  }


  // ==========================================================
  // RIGHT PAIR
  // ==========================================================

  function applyRightPair(
    value
  ) {

    state.points.R1 =
      value;

    state.points.R2 =
      value;


    state.points.L1 *=
      0.75;

    state.points.L2 *=
      0.75;


    state.pattern =
      "right-pair";


    state.intensity =
      value;
  }


  // ==========================================================
  // ALL POINTS
  // ==========================================================

  function applyAll(
    value
  ) {

    state.points.L1 =
      value;

    state.points.L2 =
      value;

    state.points.R1 =
      value;

    state.points.R2 =
      value;


    state.intensity =
      value;
  }


  // ==========================================================
  // CENTER → RIGHT
  //
  // Continuous value becomes a spatial vibration path.
  // ==========================================================

  function applyCenterToRight(
    value
  ) {

    const positions = {

      L1:
        0,

      R1:
        0.38,

      R2:
        0.72,

      L2:
        1,
    };


    for (
      const [
        point,
        position,
      ]
      of Object.entries(
        positions
      )
    ) {

      const distance =
        Math.abs(
          value -
          position
        );


      state.points[
        point
      ] =
        Math.max(
          0,
          1 -
          distance *
          3.2
        );
    }


    state.pattern =
      "spatial-flow";


    state.intensity =
      value;
  }


  // ==========================================================
  // ALTERNATING EVENT
  // ==========================================================

  function processAlternating(
    ruleId,
    value
  ) {

    const previous =
      previousEventValues.get(
        ruleId
      ) ?? 0;


    const triggered =
      value >= 0.5 &&
      previous < 0.5;


    previousEventValues.set(
      ruleId,
      value
    );


    if (
      !triggered
    ) {
      return;
    }


    if (
      state.alternatingSide ===
      "left"
    ) {

      state.points.L1 =
        1;

      state.points.L2 =
        0.85;


      state.alternatingSide =
        "right";

    }

    else {

      state.points.R1 =
        1;

      state.points.R2 =
        0.85;


      state.alternatingSide =
        "left";
    }


    state.pattern =
      "alternating";


    state.intensity =
      1;
  }


  // ==========================================================
  // ANIMATION LOOP
  // ==========================================================

  function animationLoop(
    now
  ) {

    const delta =
      Math.min(
        50,
        now -
        lastFrame
      );


    lastFrame =
      now;


    const decay =
      Math.pow(
        0.965,
        delta / 16.67
      );


    // Event pulses fade naturally.
    // Continuous mappings will immediately overwrite
    // these values on the next processing frame.

    if (
      state.pattern ===
      "alternating"
    ) {

      for (
        const point
        of Object.keys(
          state.points
        )
      ) {

        state.points[
          point
        ] *=
          decay;
      }


      state.intensity *=
        decay;
    }


    render();


    requestAnimationFrame(
      animationLoop
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  function render() {

    for (
      const [
        point,
        value,
      ]
      of Object.entries(
        state.points
      )
    ) {

      const element =
        pointElements[
          point
        ];


      if (!element) {
        continue;
      }


      const normalized =
        clamp01(
          value
        );


      element.style.setProperty(
        "--haptic-level",
        normalized
      );


      element.classList.toggle(
        "active",
        normalized >
          0.08
      );


      const valueElement =
        element.querySelector(
          ".haptic-point-value"
        );


      if (
        valueElement
      ) {

        valueElement.textContent =
          normalized.toFixed(
            2
          );
      }
    }


    if (
      statusElement
    ) {

      statusElement.textContent =

        state.intensity >
        0.04

          ? "ACTIVE"

          : "IDLE";
    }


    if (
      patternElement
    ) {

      patternElement.textContent =
        state.pattern
          .replaceAll(
            "-",
            " "
          )
          .toUpperCase();
    }


    if (
      intensityElement
    ) {

      intensityElement.textContent =
        clamp01(
          state.intensity
        ).toFixed(
          2
        );
    }


    updateDebugState();
  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  function clear() {

    state.points.L1 =
      0;

    state.points.L2 =
      0;

    state.points.R1 =
      0;

    state.points.R2 =
      0;


    state.intensity =
      0;


    state.pattern =
      "idle";


    render();
  }


  // ==========================================================
  // DEBUG
  // ==========================================================

  function getState() {

    return {

      pattern:
        state.pattern,

      intensity:
        state.intensity,

      points: {
        ...state.points,
      },
    };
  }


  function updateDebugState() {

    window.crossModalHaptics =
      getState();
  }


  render();


  return {

    process,

    clear,

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