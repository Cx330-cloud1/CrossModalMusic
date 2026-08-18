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


const HARMONY_SEQUENCE = [
  "Cmaj7",
  "Am7",
  "Fmaj7",
  "G6",
];


// ============================================================
// MUSIC UI V4
// ============================================================

export function createMusicPerformanceUI({
  engine,
  compositionEngine,
  instrumentRack,
  afterElement,
}) {

  if (
    !engine ||
    !compositionEngine ||
    !instrumentRack ||
    !afterElement
  ) {

    return {
      update() {},
      render() {},
    };
  }


  const section =
    document.createElement(
      "section"
    );


  section.className =
    "music-performance-section";


  afterElement
    .insertAdjacentElement(
      "afterend",
      section
    );


  let lastNote =
    null;


  let lastHarmonyBar =
    null;


  // ==========================================================
  // RENDER
  // ==========================================================

  function render() {

    const state =
      engine.getState();


    section.innerHTML = `
      <div class="music-v4-heading">

        <div>
          <p class="eyebrow">
            03 / PERFORMANCE
          </p>

          <h2>
            Instrument Space
          </h2>

          <p>
            Explore pitch, timbre and instrument regions
            through gesture.
          </p>
        </div>


        <div class="now-playing-card">

          <span>
            NOW PLAYING
          </span>

          <strong id="currentMusicNote">
            ${state.note}
          </strong>

          <div>
            <b id="currentInstrument">
              ${state.instrumentLabel}
            </b>

            <small id="currentZone">
              ${state.zoneLabel} REGISTER
            </small>
          </div>

          <em
            id="currentNoteRole"
            class="note-role-badge role-${state.noteRole}"
          >
            ${state.noteRoleLabel}
          </em>

        </div>

      </div>


      <!-- =================================================
           GLOBAL MUSIC SETTINGS
      ================================================== -->

      <div class="music-control-strip">

        <label>
          <span>SCALE</span>

          <select id="musicScaleSelect">

            ${Object.entries(
              SCALE_LABELS
            ).map(
              ([value, label]) => `
                <option
                  value="${value}"
                  ${
                    value === state.scale
                      ? "selected"
                      : ""
                  }
                >
                  ${label}
                </option>
              `
            ).join("")}

          </select>
        </label>


        <label>
          <span>TEMPO</span>

          <input
            id="compositionTempo"
            type="number"
            min="50"
            max="160"
            value="${state.tempo}"
          />
        </label>


        <label>
          <span>GRID</span>

          <select id="compositionGrid">

            <option
              value="free"
              ${
                state.grid === "free"
                  ? "selected"
                  : ""
              }
            >
              Free
            </option>

            <option
              value="1/8"
              ${
                state.grid === "1/8"
                  ? "selected"
                  : ""
              }
            >
              1 / 8
            </option>

            <option
              value="1/16"
              ${
                state.grid === "1/16"
                  ? "selected"
                  : ""
              }
            >
              1 / 16
            </option>

          </select>
        </label>


        <div class="compact-mode-control">

          <span>
            ASSIST
          </span>

          <div class="mode-buttons">

            ${[
              "free",
              "balanced",
              "guided",
            ].map(
              (mode) => `
                <button
                  type="button"
                  data-assist-mode="${mode}"
                  class="${
                    state.assistMode === mode
                      ? "active"
                      : ""
                  }"
                >
                  ${mode.toUpperCase()}
                </button>
              `
            ).join("")}

          </div>
        </div>


        <div class="compact-mode-control">

          <span>
            PLAY
          </span>

          <div class="mode-buttons">

            <button
              type="button"
              data-music-mode="guided"
              class="${
                state.mode === "guided"
                  ? "active"
                  : ""
              }"
            >
              PREVIEW
            </button>

            <button
              type="button"
              data-music-mode="perform"
              class="${
                state.mode === "perform"
                  ? "active"
                  : ""
              }"
            >
              PERFORM
            </button>

          </div>
        </div>

      </div>


      <!-- =================================================
           INSTRUMENT RACK
      ================================================== -->

      <div class="instrument-rack-panel">

        <div class="instrument-rack-header">

          <div>
            <span>
              INSTRUMENT PALETTE
            </span>

            <strong>
              Assign sound by register
            </strong>
          </div>


          <div class="rack-mode-switch">

            <button
              type="button"
              data-rack-mode="register"
              class="${
                state.rack.mode ===
                "register"
                  ? "active"
                  : ""
              }"
            >
              REGISTER
            </button>

            <button
              type="button"
              data-rack-mode="single"
              class="${
                state.rack.mode ===
                "single"
                  ? "active"
                  : ""
              }"
            >
              SINGLE
            </button>

          </div>

        </div>


        ${
          state.rack.mode ===
          "register"

            ? renderRegisterRack(
                state
              )

            : renderSingleRack(
                state
              )
        }

      </div>


      <!-- =================================================
           PERFORMANCE
      ================================================== -->

      <div class="music-v4-grid">

        <div class="performance-context-panel">

          <div class="harmony-hero">

            <span>
              HARMONY
            </span>

            <strong id="currentHarmonyName">
              ${state.harmony?.name ?? "—"}
            </strong>

            <small id="harmonyPosition">
              BAR
              ${state.harmony?.displayBar ?? 1}
              / 4
              ·
              BEAT
              ${state.harmony?.beat ?? 1}
              / 4
            </small>
          </div>


          <div
            id="phraseTimeline"
            class="phrase-timeline"
          >

            ${HARMONY_SEQUENCE.map(
              (chord, index) => `
                <div
                  class="phrase-bar ${
                    state.harmony
                      ?.barIndex === index
                        ? "active"
                        : ""
                  }"
                  data-harmony-bar="${index}"
                >
                  <span>
                    0${index + 1}
                  </span>

                  <strong>
                    ${chord}
                  </strong>
                </div>
              `
            ).join("")}

          </div>


          <div class="v4-meter-group">

            ${renderMeter(
              "musicIntensity",
              "STRIKE",
              state.intensity
            )}

            ${renderMeter(
              "musicExpression",
              "SPACE",
              state.expression
            )}

          </div>


          <div class="gesture-mini-guide">

            <span>
              LEFT Y
              <b>PITCH</b>
            </span>

            <span>
              LEFT X
              <b>TIMBRE</b>
            </span>

            <span>
              RIGHT PINCH
              <b>PLAY</b>
            </span>

            <span>
              RIGHT ENERGY
              <b>VELOCITY</b>
            </span>

            <span>
              RIGHT OPEN
              <b>SPACE</b>
            </span>

          </div>

        </div>


        <!-- ===============================================
             PITCH MAP
        ================================================ -->

        <div class="pitch-space-panel">

          <div class="pitch-space-heading">

            <div>
              <span>
                PITCH MAP
              </span>

              <strong>
                C3 — C6
              </strong>
            </div>

            <small>
              CHORD · COLOR · TENSION
            </small>

          </div>


          <div
            id="pitchRegisterMap"
            class="pitch-register-map"
          >

            ${renderPitchMap(
              state
            )}

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
  // REGISTER RACK
  // ==========================================================

  function renderRegisterRack(
    state
  ) {

    const zones =
      [
        state.rack.zones.low,
        state.rack.zones.mid,
        state.rack.zones.high,
      ];


    return `
      <div class="instrument-zone-grid">

        ${zones.map(
          (zone) => {

            const instrument =
              state.rack
                .instruments
                .find(
                  (item) =>
                    item.value ===
                    zone.instrument
                );


            return `
              <article
                class="instrument-zone-card ${
                  state.zoneId === zone.id
                    ? "active"
                    : ""
                }"
              >

                <div class="zone-card-top">

                  <span>
                    ${zone.label}
                  </span>

                  <small>
                    ${getZoneRange(zone.id)}
                  </small>

                </div>


                <strong>
                  ${instrument?.label ?? zone.instrument}
                </strong>


                <small>
                  ${instrument?.family ?? ""}
                </small>


                <select
                  data-zone-instrument="${zone.id}"
                >
                  ${renderInstrumentOptions(
                    state,
                    zone.instrument
                  )}
                </select>

              </article>
            `;
          }
        ).join("")}

      </div>
    `;
  }


  // ==========================================================
  // SINGLE RACK
  // ==========================================================

  function renderSingleRack(
    state
  ) {

    const selected =
      state.rack
        .singleInstrument;


    return `
      <div class="single-instrument-rack">

        <div>
          <span>
            FULL RANGE
          </span>

          <strong>
            C3 — C6
          </strong>
        </div>


        <select
          id="singleInstrumentSelect"
        >
          ${renderInstrumentOptions(
            state,
            selected
          )}
        </select>

      </div>
    `;
  }


  // ==========================================================
  // INSTRUMENT OPTIONS
  // ==========================================================

  function renderInstrumentOptions(
    state,
    selected
  ) {

    return state.rack
      .instruments
      .map(
        (instrument) => `
          <option
            value="${instrument.value}"
            ${
              instrument.value ===
              selected
                ? "selected"
                : ""
            }
          >
            ${instrument.label}
          </option>
        `
      )
      .join("");
  }


  // ==========================================================
  // PITCH MAP
  // ==========================================================

  function renderPitchMap(
    state
  ) {

    const groups = {

      low:
        [],

      mid:
        [],

      high:
        [],
    };


    for (
      const note
      of state.scaleNotes
    ) {

      const route =
        instrumentRack
          .routeNote(
            note
          );


      groups[
        route.zone.id
      ].push(
        note
      );
    }


    return [
      "low",
      "mid",
      "high",
    ].map(
      (zoneId) => {

        const notes =
          groups[
            zoneId
          ];


        const firstNote =
          notes[0];


        const route =
          firstNote
            ? instrumentRack
                .routeNote(
                  firstNote
                )
            : null;


        return `
          <div class="register-band">

            <div class="register-band-heading">

              <span>
                ${zoneId.toUpperCase()}
              </span>

              <strong>
                ${
                  route
                    ?.instrument
                    ?.label ??
                  ""
                }
              </strong>

            </div>


            <div class="register-note-grid">

              ${notes.map(
                (note) => {

                  const role =
                    classifyForUI(
                      note,
                      state.scale
                    );


                  return `
                    <div
                      class="
                        register-note
                        role-${role.role}
                        ${
                          note ===
                          state.note
                            ? "active"
                            : ""
                        }
                      "
                      data-pitch-note="${note}"
                    >

                      <strong>
                        ${note}
                      </strong>

                      <small
                        class="note-role-label"
                      >
                        ${role.label}
                      </small>

                    </div>
                  `;
                }
              ).join("")}

            </div>

          </div>
        `;
      }
    ).join("");
  }


  // ==========================================================
  // METER
  // ==========================================================

  function renderMeter(
    id,
    label,
    value
  ) {

    return `
      <div class="v4-meter">

        <div>
          <span>
            ${label}
          </span>

          <strong
            id="${id}Value"
          >
            ${value.toFixed(2)}
          </strong>
        </div>


        <div class="v4-meter-track">

          <div
            id="${id}Bar"
            style="
              width:
              ${value * 100}%;
            "
          ></div>

        </div>

      </div>
    `;
  }


  // ==========================================================
  // EVENTS
  // ==========================================================

  function bindEvents() {

    section
      .querySelector(
        "#musicScaleSelect"
      )
      ?.addEventListener(
        "change",
        (event) => {

          engine.setScale(
            event.target.value
          );

          render();
        }
      );


    section
      .querySelector(
        "#compositionTempo"
      )
      ?.addEventListener(
        "change",
        (event) => {

          compositionEngine
            .setTempo(
              event.target.value
            );

          engine
            .refreshComposition();

          render();
        }
      );


    section
      .querySelector(
        "#compositionGrid"
      )
      ?.addEventListener(
        "change",
        (event) => {

          compositionEngine
            .setGrid(
              event.target.value
            );

          engine
            .refreshComposition();

          render();
        }
      );


    section
      .querySelectorAll(
        "[data-assist-mode]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              compositionEngine
                .setAssistMode(
                  button.dataset
                    .assistMode
                );

              engine
                .refreshComposition();

              render();
            }
          );
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


    section
      .querySelectorAll(
        "[data-rack-mode]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              engine
                .setRackMode(
                  button.dataset
                    .rackMode
                );

              render();
            }
          );
        }
      );


    section
      .querySelectorAll(
        "[data-zone-instrument]"
      )
      .forEach(
        (select) => {

          select.addEventListener(
            "change",
            () => {

              engine
                .setZoneInstrument(

                  select.dataset
                    .zoneInstrument,

                  select.value
                );

              render();
            }
          );
        }
      );


    section
      .querySelector(
        "#singleInstrumentSelect"
      )
      ?.addEventListener(
        "change",
        (event) => {

          engine
            .setSingleInstrument(
              event.target.value
            );

          render();
        }
      );
  }


  // ==========================================================
  // UPDATE
  // ==========================================================

  function update(
    state =
      engine.getState()
  ) {

    setText(
      "#currentMusicNote",
      state.note
    );


    setText(
      "#currentInstrument",
      state.instrumentLabel
    );


    setText(
      "#currentZone",
      `${
        state.zoneLabel
      } REGISTER`
    );


    setText(
      "#currentHarmonyName",
      state.harmony?.name ??
      "—"
    );


    setText(
      "#harmonyPosition",
      `BAR ${
        state.harmony
          ?.displayBar ??
        1
      } / 4 · BEAT ${
        state.harmony
          ?.beat ??
        1
      } / 4`
    );


    updateMeter(
      "musicIntensity",
      state.intensity
    );


    updateMeter(
      "musicExpression",
      state.expression
    );


    const role =
      section.querySelector(
        "#currentNoteRole"
      );


    if (
      role
    ) {

      role.textContent =
        state.noteRoleLabel;


      role.className =
        `note-role-badge role-${state.noteRole}`;
    }


    if (
      state.note !==
      lastNote
    ) {

      section
        .querySelectorAll(
          "[data-pitch-note]"
        )
        .forEach(
          (element) => {

            element.classList
              .toggle(

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


    if (
      state.harmony
        ?.absoluteBar !==
      lastHarmonyBar
    ) {

      updateHarmonyDisplay(
        state
      );


      lastHarmonyBar =
        state.harmony
          ?.absoluteBar;
    }
  }


  // ==========================================================
  // HARMONY UI
  // ==========================================================

  function updateHarmonyDisplay(
    state
  ) {

    section
      .querySelectorAll(
        "[data-harmony-bar]"
      )
      .forEach(
        (element) => {

          element.classList.toggle(

            "active",

            Number(
              element.dataset
                .harmonyBar
            ) ===
              state.harmony
                ?.barIndex
          );
        }
      );


    section
      .querySelectorAll(
        "[data-pitch-note]"
      )
      .forEach(
        (element) => {

          const role =
            classifyForUI(

              element.dataset
                .pitchNote,

              state.scale
            );


          element.classList.remove(
            "role-chord",
            "role-color",
            "role-tension"
          );


          element.classList.add(
            `role-${role.role}`
          );


          const label =
            element.querySelector(
              ".note-role-label"
            );


          if (
            label
          ) {

            label.textContent =
              role.label;
          }
        }
      );
  }


  // ==========================================================
  // CLASSIFY
  // ==========================================================

  function classifyForUI(
    note,
    scale
  ) {

    return compositionEngine
      .classifyNote(

        note,

        scale ===
          "chromatic"

          ? "major"

          : scale
      );
  }


  // ==========================================================
  // METER UPDATE
  // ==========================================================

  function updateMeter(
    id,
    value
  ) {

    setText(
      `#${id}Value`,
      value.toFixed(
        2
      )
    );


    const bar =
      section.querySelector(
        `#${id}Bar`
      );


    if (
      bar
    ) {

      bar.style.width =
        `${
          value *
          100
        }%`;
    }
  }


  // ==========================================================
  // TEXT
  // ==========================================================

  function setText(
    selector,
    text
  ) {

    const element =
      section.querySelector(
        selector
      );


    if (
      element
    ) {

      element.textContent =
        text;
    }
  }


  render();


  return {

    render,

    update,
  };
}


// ============================================================
// RANGE LABEL
// ============================================================

function getZoneRange(
  zoneId
) {

  switch (
    zoneId
  ) {

    case "low":
      return "C3 — B3";

    case "high":
      return "C5 — C6";

    case "mid":
    default:
      return "C4 — B4";
  }
}