// ============================================================
// FINGER SLEEVE ENGINE
//
// Device abstraction layer.
//
// Current stage:
// - supports simulation input
// - future-ready for real hardware input
//
// State model:
// {
//   connected: true/false,
//   mode: "simulation" | "live" | "fallback",
//   finger: "index",
//   pressure: 0..1,
//   impact: 0..1,
//   contact: true/false,
//   sampleRate: 120,
//   updatedAt: number,
//   contactStarted: bool,
//   contactEnded: bool,
//   tapTriggered: bool
// }
// ============================================================

export function createFingerSleeveEngine() {
  let state = createInitialState();

  const listeners =
    new Set();


  function getState() {
    return {
      ...state,
    };
  }


  function subscribe(
    listener
  ) {
    if (
      typeof listener !==
      "function"
    ) {
      return () => {};
    }

    listeners.add(
      listener
    );

    listener(
      getState()
    );

    return () => {
      listeners.delete(
        listener
      );
    };
  }


  function emit() {
    const snapshot =
      getState();

    listeners.forEach(
      (listener) => {
        listener(
          snapshot
        );
      }
    );
  }


  function patch(
    partial
  ) {
    state = {
      ...state,
      ...partial,
      updatedAt:
        performance.now(),
    };

    emit();
  }


  function connect({
    mode =
      "simulation",
  } = {}) {
    patch({
      connected: true,
      mode,
    });
  }


  function disconnect() {
    state =
      createInitialState();
    emit();
  }


  function setPressure(
    value
  ) {
    const pressure =
      clamp01(value);

    const previous =
      state.pressure;

    const impact =
      clamp01(
        Math.abs(
          pressure -
            previous
        ) * 1.8
      );

    patch({
      pressure,
      impact,
    });
  }


  function setContact(
    active
  ) {
    const nextContact =
      Boolean(active);

    const contactStarted =
      nextContact &&
      !state.contact;

    const contactEnded =
      !nextContact &&
      state.contact;

    patch({
      contact:
        nextContact,
      contactStarted,
      contactEnded,
      tapTriggered:
        false,
    });

    clearTransientFlagsSoon();
  }


  function triggerTap({
    pressure = 0.72,
    impact = 0.84,
  } = {}) {
    patch({
      contact: true,
      pressure:
        clamp01(
          pressure
        ),
      impact:
        clamp01(
          impact
        ),
      contactStarted:
        !state.contact,
      contactEnded:
        false,
      tapTriggered:
        true,
    });

    clearTransientFlagsSoon();
  }


  function release() {
    patch({
      contact: false,
      pressure: 0,
      impact: 0,
      contactStarted:
        false,
      contactEnded:
        true,
      tapTriggered:
        false,
    });

    clearTransientFlagsSoon();
  }


  function ingestLiveInput(
    input = {}
  ) {
    const nextContact =
      Boolean(
        input.contact
      );

    const contactStarted =
      nextContact &&
      !state.contact;

    const contactEnded =
      !nextContact &&
      state.contact;

    patch({
      connected:
        true,
      mode: "live",
      finger:
        input.finger ??
        state.finger,
      pressure:
        clamp01(
          input.pressure ?? 0
        ),
      impact:
        clamp01(
          input.impact ?? 0
        ),
      contact:
        nextContact,
      sampleRate:
        input.sampleRate ??
        state.sampleRate,
      contactStarted,
      contactEnded,
      tapTriggered:
        Boolean(
          input.tapTriggered
        ),
    });

    clearTransientFlagsSoon();
  }


  function clearTransientFlagsSoon() {
    queueMicrotask(() => {
      state = {
        ...state,
        contactStarted:
          false,
        contactEnded:
          false,
        tapTriggered:
          false,
      };

      emit();
    });
  }


  return {
    getState,
    subscribe,
    connect,
    disconnect,
    setPressure,
    setContact,
    triggerTap,
    release,
    ingestLiveInput,
  };
}


function createInitialState() {
  return {
    connected: false,
    mode:
      "simulation",
    finger:
      "index",
    pressure: 0,
    impact: 0,
    contact: false,
    sampleRate: 120,
    updatedAt: 0,
    contactStarted:
      false,
    contactEnded:
      false,
    tapTriggered:
      false,
  };
}


function clamp01(
  value
) {
  const number =
    Number(value);

  if (
    Number.isNaN(
      number
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number)
  );
}