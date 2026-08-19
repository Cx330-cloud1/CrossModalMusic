// ============================================================
// DEVICE UI
//
// Finger Sleeve Digital Twin
// + Simulation controls
//
// Current phase:
// - standalone device layer
// - visual state display
// - simulation controls
//
// Later:
// - feed contact / pressure into music engine
// ============================================================

export function createDeviceUI({
  container,
  engine,
  simulator,
}) {
  if (
    !container ||
    !engine
  ) {
    return createFallbackAPI();
  }


  container.classList.add(
    "device-ui-shell"
  );

  container.innerHTML = `
    <section class="device-panel">
      <div class="device-panel-header">
        <div>
          <span class="device-kicker">
            02 / DEVICE INPUT
          </span>

          <h3>
            Finger Sleeve
          </h3>

          <p>
            Tactile Sampling Interface
          </p>
        </div>

        <div class="device-badge-group">
          <span
            class="device-badge"
            data-device-mode
          >
            SIMULATION
          </span>

          <span
            class="device-badge"
            data-device-status
          >
            OFFLINE
          </span>
        </div>
      </div>


      <div class="device-visual">
        <div class="device-finger-illustration">
          <div class="finger-tip"></div>
          <div class="finger-body"></div>
          <div class="sleeve-ring"></div>
        </div>

        <div class="device-live-metrics">
          <div class="device-metric">
            <span>PRESSURE</span>
            <strong data-pressure-value>
              0.00
            </strong>

            <div class="device-meter">
              <div
                data-pressure-bar
              ></div>
            </div>
          </div>

          <div class="device-metric">
            <span>IMPACT</span>
            <strong data-impact-value>
              0.00
            </strong>

            <div class="device-meter">
              <div
                data-impact-bar
              ></div>
            </div>
          </div>

          <div class="device-metric">
            <span>CONTACT</span>
            <strong data-contact-value>
              INACTIVE
            </strong>
          </div>

          <div class="device-metric">
            <span>SAMPLING</span>
            <strong data-sample-rate>
              120 Hz
            </strong>
          </div>
        </div>
      </div>


      <div class="device-controls">
        <div class="device-control-block">
          <label for="pressureSlider">
            Pressure
          </label>

          <input
            id="pressureSlider"
            data-pressure-slider
            type="range"
            min="0"
            max="1"
            step="0.01"
            value="0"
          />
        </div>

        <div class="device-button-row">
          <button
            type="button"
            data-connect-button
          >
            CONNECT
          </button>

          <button
            type="button"
            data-contact-button
          >
            CONTACT ON / OFF
          </button>

          <button
            type="button"
            data-tap-button
          >
            TAP
          </button>
        </div>
      </div>
    </section>
  `;


  const statusElement =
    container.querySelector(
      "[data-device-status]"
    );

  const modeElement =
    container.querySelector(
      "[data-device-mode]"
    );

  const pressureValue =
    container.querySelector(
      "[data-pressure-value]"
    );

  const pressureBar =
    container.querySelector(
      "[data-pressure-bar]"
    );

  const impactValue =
    container.querySelector(
      "[data-impact-value]"
    );

  const impactBar =
    container.querySelector(
      "[data-impact-bar]"
    );

  const contactValue =
    container.querySelector(
      "[data-contact-value]"
    );

  const sampleRateValue =
    container.querySelector(
      "[data-sample-rate]"
    );

  const pressureSlider =
    container.querySelector(
      "[data-pressure-slider]"
    );

  const connectButton =
    container.querySelector(
      "[data-connect-button]"
    );

  const contactButton =
    container.querySelector(
      "[data-contact-button]"
    );

  const tapButton =
    container.querySelector(
      "[data-tap-button]"
    );


  pressureSlider.addEventListener(
    "input",
    (event) => {
      simulator?.setPressure(
        event.target.value
      );
    }
  );


  connectButton.addEventListener(
    "click",
    () => {
      const state =
        engine.getState();

      if (
        state.connected
      ) {
        simulator?.disconnect();
      } else {
        simulator?.connect();
      }
    }
  );


  contactButton.addEventListener(
    "click",
    () => {
      const state =
        engine.getState();

      if (
        !state.connected
      ) {
        simulator?.connect();
      }

      simulator?.toggleContact();
    }
  );


  tapButton.addEventListener(
    "click",
    () => {
      simulator?.tap();
    }
  );


  const unsubscribe =
    engine.subscribe(
      update
    );


  function update(
    state
  ) {
    statusElement.textContent =
      state.connected
        ? "CONNECTED"
        : "OFFLINE";

    statusElement.classList.toggle(
      "active",
      state.connected
    );

    modeElement.textContent =
      (
        state.mode ||
        "simulation"
      ).toUpperCase();

    pressureValue.textContent =
      state.pressure.toFixed(
        2
      );

    impactValue.textContent =
      state.impact.toFixed(
        2
      );

    contactValue.textContent =
      state.contact
        ? "ACTIVE"
        : "INACTIVE";

    sampleRateValue.textContent =
      `${state.sampleRate} Hz`;

    pressureBar.style.width =
      `${state.pressure * 100}%`;

    impactBar.style.width =
      `${state.impact * 100}%`;

    pressureSlider.value =
      state.pressure;

    connectButton.textContent =
      state.connected
        ? "DISCONNECT"
        : "CONNECT";

    contactButton.classList.toggle(
      "active",
      state.contact
    );

    tapButton.classList.toggle(
      "pulse",
      state.tapTriggered
    );
  }


  return {
    update,
    destroy() {
      unsubscribe?.();
    },
  };
}


function createFallbackAPI() {
  return {
    update() {},
    destroy() {},
  };
}