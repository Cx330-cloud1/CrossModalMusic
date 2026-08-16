// ============================================================
// SIGNAL PROCESSING
// Raw CV data -> stable interaction signals
// ============================================================

const POSITION_SMOOTHING = 0.22;
const PINCH_SMOOTHING = 0.30;
const SPEED_SMOOTHING = 0.35;

const POSITION_DEAD_ZONE = 0.008;
const SPEED_NOISE_FLOOR = 0.025;

// Hysteresis:
// require a stronger signal to start,
// and a lower signal to release.
const PINCH_ON_THRESHOLD = 0.68;
const PINCH_OFF_THRESHOLD = 0.52;


export function createHandSignalProcessor() {

  let previous = null;
  let pinchActive = false;


  function process(raw) {

    if (!raw) {
      return null;
    }


    // First valid frame
    if (!previous) {

      previous = {
        x: raw.x,
        y: raw.y,
        pinch: raw.pinch,
        openness: raw.openness,
        speed: raw.speed,
      };
    }


    // --------------------------------------------------------
    // Exponential smoothing
    // --------------------------------------------------------

    const smoothedX =
      smooth(
        previous.x,
        raw.x,
        POSITION_SMOOTHING
      );


    const smoothedY =
      smooth(
        previous.y,
        raw.y,
        POSITION_SMOOTHING
      );


    const pinch =
      smooth(
        previous.pinch,
        raw.pinch,
        PINCH_SMOOTHING
      );


    const openness =
      smooth(
        previous.openness,
        raw.openness,
        POSITION_SMOOTHING
      );


    let speed =
      smooth(
        previous.speed,
        raw.speed,
        SPEED_SMOOTHING
      );


    // --------------------------------------------------------
    // Position dead zone
    // Ignore tiny involuntary movements
    // --------------------------------------------------------

    const x =
      Math.abs(
        smoothedX - previous.x
      ) < POSITION_DEAD_ZONE
        ? previous.x
        : smoothedX;


    const y =
      Math.abs(
        smoothedY - previous.y
      ) < POSITION_DEAD_ZONE
        ? previous.y
        : smoothedY;


    // --------------------------------------------------------
    // Speed noise floor
    // --------------------------------------------------------

    if (
      speed <
      SPEED_NOISE_FLOOR
    ) {

      speed = 0;
    }


    // --------------------------------------------------------
    // Pinch event detection
    // --------------------------------------------------------

    let pinchStarted = false;
    let pinchEnded = false;


    if (
      !pinchActive &&
      pinch >= PINCH_ON_THRESHOLD
    ) {

      pinchActive = true;
      pinchStarted = true;
    }


    else if (
      pinchActive &&
      pinch <= PINCH_OFF_THRESHOLD
    ) {

      pinchActive = false;
      pinchEnded = true;
    }


    previous = {
      x,
      y,
      pinch,
      openness,
      speed,
    };


    return {
      x,
      y,
      pinch,
      openness,
      speed,

      pinchActive,
      pinchStarted,
      pinchEnded,
    };
  }


  function reset() {

    previous = null;
    pinchActive = false;
  }


  return {
    process,
    reset,
  };
}


// ============================================================
// HELPERS
// ============================================================

function smooth(
  previous,
  current,
  alpha
) {

  return (
    previous +
    alpha *
    (
      current - previous
    )
  );
}