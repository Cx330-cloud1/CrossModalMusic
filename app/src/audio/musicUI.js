// ============================================================
// MUSIC PERFORMANCE UI
//
// Makes the gesture instrument learnable:
//
// Scale
// Guided / Perform
// Current note
// Pitch lane
// Velocity
// Ambient Pad
// ============================================================

const SCALE_LABELS = {

  pentatonic:
    "Pentatonic",

  major:
    "Major",

  minor:
    "Minor",

  dorian:
    "Dorian",

  chromatic:
    "Chromatic",
};


export function createMusicPerformanceUI({
  engine,
  afterElement,
}) {

  if (
    !engine ||
    !afterElement
  ) {

    return {
      update() {},
    };
  }


  const section =
    document.createElement(
      "section"
    );


  section.className =
    "music-performance-section";


  afterElement.insertAdjacentElement(
    "afterend",
    section
  );


  let lastNote =
    null;


  // ==========================================================
  // RENDER
  // ==========================================================

  function render() {

    const state =
      engine.getState();


    section.innerHTML = `
      <div class="music-performance-header">

        <div>
          <p class="eyebrow">
            03 / MUSICAL INSTRUMENT
          </p>

          <h2>
            Gesture Performance
          </h2>

          <p>
            Learn the spatial pitch language in Guided mode,
            then switch to Performance mode for intentional playing.
          </p>
        </div>


        <div class="music-performance-controls">

          <label>
            SCALE

            <select id="musicScaleSelect">
              ${Object.entries(
                SCALE_LABELS
              )
                .map(
                  ([
                    value,
                    label,
                  ]) => `
                    <option
                      value="${value}"
                      ${
                        value ===
                        state.scale
                          ? "selected"
                          : ""
                      }
                    >
                      ${label}
                    </option>
                  `
                )
                .join("")}
            </select>
          </label>


          <div class="mode-control">

            <span>
              PLAY MODE
            </span>

            <div class="mode-buttons">

              <button
                type="button"
                data-music-mode="guided"
                class="${
                  state.mode ===
                  "guided"
                    ? "active"
                    : ""
                }"
              >
                GUIDED
              </button>

              <button
                type="button"
                data-music-mode="perform"
                class="${
                  state.mode ===
                  "perform"
                    ? "active"
                    : ""
                }"
              >
                PERFORM
              </button>

            </div>

          </div>

        </div>

      </div>


      <div class="music-performance-grid">

        <div class="music-status-panel">

          <div class="current-note-block">

            <span>
              CURRENT PITCH
            </span>

            <strong id="currentMusicNote">
              ${state.note}
            </strong>

            <small id="currentScaleInfo">
              ${SCALE_LABELS[state.scale]}
              ·
              ${state.noteCount} NOTES
            </small>

          </div>


          <div class="music-mode-explanation">

            <div
              id="musicModeIndicator"
              class="music-mode-badge"
            >
              ${
                state.mode ===
                "guided"
                  ? "GUIDED"
                  : "PERFORM"
              }
            </div>

            <p id="musicModeDescription">
              ${
                state.mode ===
                "guided"
                  ? "Move vertically to hear a quiet pitch preview. Pinch to perform the full note."
                  : "Movement selects pitch silently. Pinch performs the note."
              }
            </p>

          </div>


          <div class="performance-meter">

            <div>

              <span>
                STRIKE INTENSITY
              </span>

              <strong id="musicIntensityValue">
                ${state.intensity.toFixed(2)}
              </strong>

            </div>

            <div class="performance-meter-track">
              <div
                id="musicIntensityBar"
                style="width: ${
                  state.intensity *
                  100
                }%"
              ></div>
            </div>

          </div>


          <div class="performance-meter pad-meter">

            <div>

              <span>
                AMBIENT PAD
              </span>

              <strong id="musicPadValue">
                ${state.padAmount.toFixed(2)}
              </strong>

            </div>

            <div class="performance-meter-track">
              <div
                id="musicPadBar"
                style="width: ${
                  state.padAmount *
                  100
                }%"
              ></div>
            </div>

          </div>


          <div class="gesture-instrument-guide">

            <div>
              <span>LEFT / Y</span>
              <strong>PITCH</strong>
            </div>

            <div>
              <span>LEFT / X</span>
              <strong>TIMBRE</strong>
            </div>

            <div>
              <span>RIGHT / PINCH</span>
              <strong>PLAY NOTE</strong>
            </div>

            <div>
              <span>RIGHT / ENERGY</span>
              <strong>VELOCITY</strong>
            </div>

            <div>
              <span>RIGHT / OPENNESS</span>
              <strong>AMBIENT PAD</strong>
            </div>

          </div>

        </div>


        <div class="pitch-lane-panel">

          <div class="pitch-lane-header">

            <span>
              HIGH
            </span>

            <strong>
              PITCH SPACE
            </strong>

            <span>
              LOW
            </span>

          </div>


          <div
            id="pitchLane"
            class="pitch-lane"
          >

            ${[
              ...state.scaleNotes,
            ]
              .reverse()
              .map(
                (note) => `
                  <div
                    class="pitch-note ${
                      note ===
                      state.note
                        ? "active"
                        : ""
                    }"
                    data-pitch-note="${note}"
                  >

                    <span></span>

                    <strong>
                      ${note}
                    </strong>

                  </div>
                `
              )
              .join("")}

          </div>

        </div>

      </div>
    `;


    bindEvents();


    update(
      state
    );
  }


  // ==========================================================
  // EVENTS
  // ==========================================================

  function bindEvents() {

    const scaleSelect =
      section.querySelector(
        "#musicScaleSelect"
      );


    scaleSelect
      ?.addEventListener(
        "change",
        () => {

          engine.setScale(
            scaleSelect.value
          );


          lastNote =
            null;


          render();
        }
      );


    section
      .querySelectorAll(
        "[data-music-mode]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              engine.setMode(
                button.dataset
                  .musicMode
              );


              render();
            }
          );
        }
      );
  }


  // ==========================================================
  // LIVE UPDATE
  // ==========================================================

  function update(
    state
  ) {

    if (
      !state
    ) {

      state =
        engine.getState();
    }


    setText(
      "#currentMusicNote",
      state.note
    );


    setText(
      "#musicIntensityValue",
      state.intensity.toFixed(
        2
      )
    );


    setText(
      "#musicPadValue",
      state.padAmount.toFixed(
        2
      )
    );


    const intensityBar =
      section.querySelector(
        "#musicIntensityBar"
      );


    if (
      intensityBar
    ) {

      intensityBar.style.width =
        `${
          state.intensity *
          100
        }%`;
    }


    const padBar =
      section.querySelector(
        "#musicPadBar"
      );


    if (
      padBar
    ) {

      padBar.style.width =
        `${
          state.padAmount *
          100
        }%`;
    }


    if (
      state.note !==
      lastNote
    ) {

      section
        .querySelectorAll(
          ".pitch-note"
        )
        .forEach(
          (element) => {

            element.classList.toggle(

              "active",

              element.dataset
                .pitchNote ===
                state.note
            );
          }
        );


      lastNote =
        state.note;
    }
  }


  function setText(
    selector,
    value
  ) {

    const element =
      section.querySelector(
        selector
      );


    if (
      element
    ) {

      element.textContent =
        value;
    }
  }


  render();


  return {

    update,

    render,
  };
}