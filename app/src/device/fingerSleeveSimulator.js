// ============================================================
// FINGER SLEEVE SIMULATOR
//
// UI-side helper for simulation mode.
//
// Responsibilities:
// - connect/disconnect simulated device
// - pressure slider input
// - tap gesture simulation
// - contact hold / release
// ============================================================

export function createFingerSleeveSimulator({
  engine,
}) {
  if (!engine) {
    return {
      connect() {},
      disconnect() {},
      setPressure() {},
      toggleContact() {},
      tap() {},
      getState() {
        return {
          connected: false,
        };
      },
    };
  }


  function connect() {
    engine.connect({
      mode:
        "simulation",
    });
  }


  function disconnect() {
    engine.disconnect();
  }


  function setPressure(
    value
  ) {
    engine.setPressure(
      value
    );
  }


  function toggleContact() {
    const state =
      engine.getState();

    engine.setContact(
      !state.contact
    );
  }


  function tap() {
    const state =
      engine.getState();

    if (
      !state.connected
    ) {
      connect();
    }

    const pressure =
      Math.max(
        0.55,
        state.pressure || 0.72
      );

    engine.triggerTap({
      pressure,
      impact: 0.88,
    });

    setTimeout(() => {
      engine.release();
    }, 120);
  }


  return {
    connect,
    disconnect,
    setPressure,
    toggleContact,
    tap,
    getState() {
      return engine.getState();
    },
  };
}