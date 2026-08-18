// ============================================================
// PERSONAL MAPPING STUDIO UI V2
// ============================================================


// ============================================================
// SOURCE OPTIONS
// ============================================================

const HAND_OPTIONS = [

  [
    "Left",
    "Left Hand",
  ],

  [
    "Right",
    "Right Hand",
  ],
];


const FEATURE_OPTIONS = [

  [
    "x",
    "X Position",
  ],

  [
    "y",
    "Y Position",
  ],

  [
    "pinch",
    "Pinch Amount",
  ],

  [
    "pinchStarted",
    "Pinch Trigger",
  ],

  [
    "openness",
    "Hand Openness",
  ],

  [
    "speed",
    "Movement Energy",
  ],
];


// ============================================================
// MUSIC OPTIONS
// ============================================================

const MUSIC_OPTIONS = [

  [
    "pitch",
    "Pitch",
  ],

  [
    "note-trigger",
    "Note Trigger",
  ],

  [
    "rhythm",
    "Rhythm",
  ],

  [
    "timbre",
    "Timbre",
  ],

  [
    "intensity",
    "Intensity / Velocity",
  ],

  [
    "texture",
    "Expression / Space",
  ],

  [
    "volume",
    "Volume",
  ],
];


// ============================================================
// VISUAL OPTIONS
// ============================================================

const VISUAL_OPTIONS = [

  [
    "rising-line",
    "Rising Line",
  ],

  [
    "pulse",
    "Pulse",
  ],

  [
    "particle-energy",
    "Particles",
  ],

  [
    "color-shift",
    "Color Shift",
  ],

  [
    "wave",
    "Wave",
  ],

  [
    "expansion",
    "Expansion",
  ],
];


// ============================================================
// HAPTIC OPTIONS
// ============================================================

const HAPTIC_OPTIONS = [

  [
    "left-pair",
    "Left Pair",
  ],

  [
    "right-pair",
    "Right Pair",
  ],

  [
    "alternating",
    "Alternating",
  ],

  [
    "center-to-right",
    "Spatial Flow",
  ],

  [
    "intensity",
    "Intensity",
  ],

  [
    "all",
    "All Points",
  ],
];


// ============================================================
// FACTORY
// ============================================================

export function createMappingStudioUI({
  container,
  engine,
}) {

  if (
    !container
  ) {

    return {

      render() {},

      updateLiveValues() {},
    };
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  function render() {

    const profile =
      engine.getProfile();


    container.innerHTML = `
      <div class="mapping-studio">

        <div class="mapping-studio-header">

          <div>

            <p class="eyebrow">
              02 / PERSONAL MAPPING
            </p>

            <h2>
              My Music Language
            </h2>

            <p class="mapping-description">
              Define what each movement means across
              sound, vision and body feedback.
            </p>

          </div>


          <div class="mapping-profile-controls">

            <label>

              PROFILE

              <input
                id="mappingProfileName"
                value="${escapeHTML(
                  profile.name
                )}"
              />

            </label>


            <div class="mapping-actions">

              <button
                id="addMappingButton"
                class="mapping-button primary"
                type="button"
              >
                + ADD MAPPING
              </button>


              <button
                id="resetMappingButton"
                class="mapping-button secondary"
                type="button"
              >
                RESET
              </button>

            </div>

          </div>

        </div>


        <div class="mapping-column-labels">

          <span>
            BODY INPUT
          </span>

          <span></span>

          <span>
            MUSIC
          </span>

          <span>
            VISUAL
          </span>

          <span>
            BODY / HAPTIC
          </span>

          <span>
            LIVE
          </span>

        </div>


        <div
          id="mappingRules"
          class="mapping-rules"
        >

          ${profile.rules
            .map(
              renderRule
            )
            .join("")}

        </div>

      </div>
    `;


    bindEvents();
  }


  // ==========================================================
  // RULE
  // ==========================================================

  function renderRule(
    rule
  ) {

    return `
      <article
        class="mapping-rule"
        data-rule-id="${rule.id}"
      >

        <div class="mapping-source">

          <select
            data-role="hand"
            aria-label="Input hand"
          >

            ${buildOptions(
              HAND_OPTIONS,
              rule.source.hand
            )}

          </select>


          <select
            data-role="feature"
            aria-label="Input feature"
          >

            ${buildOptions(
              FEATURE_OPTIONS,
              rule.source.feature
            )}

          </select>

        </div>


        <div class="mapping-arrow">
          →
        </div>


        ${renderTarget(
          rule,
          "music",
          MUSIC_OPTIONS
        )}


        ${renderTarget(
          rule,
          "visual",
          VISUAL_OPTIONS
        )}


        ${renderTarget(
          rule,
          "haptic",
          HAPTIC_OPTIONS
        )}


        <div class="mapping-live">

          <span>
            VALUE
          </span>


          <strong
            data-live-value="${rule.id}"
          >
            —
          </strong>


          <button
            class="remove-mapping"
            data-remove-rule="${rule.id}"
            title="Remove mapping"
            type="button"
          >
            ×
          </button>

        </div>

      </article>
    `;
  }


  // ==========================================================
  // TARGET
  // ==========================================================

  function renderTarget(
    rule,
    domain,
    options
  ) {

    const target =
      rule.targets[
        domain
      ];


    return `
      <div
        class="mapping-target"
        data-domain="${domain}"
      >

        <label class="mapping-toggle">

          <input
            type="checkbox"
            data-role="${domain}-enabled"
            ${
              target.enabled
                ? "checked"
                : ""
            }
          />

          <span>
            ${domain.toUpperCase()}
          </span>

        </label>


        <select
          data-role="${domain}"
          ${
            target.enabled
              ? ""
              : "disabled"
          }
        >

          ${buildOptions(
            options,
            target.parameter
          )}

        </select>

      </div>
    `;
  }


  // ==========================================================
  // EVENTS
  // ==========================================================

  function bindEvents() {

    const profileName =
      container.querySelector(
        "#mappingProfileName"
      );


    profileName
      ?.addEventListener(
        "change",
        (event) => {

          const name =
            event.target
              .value
              .trim();


          engine.setProfileName(

            name ||
            "Untitled Music Language"
          );
        }
      );


    // --------------------------------------------------------
    // ADD RULE
    // --------------------------------------------------------

    container
      .querySelector(
        "#addMappingButton"
      )
      ?.addEventListener(
        "click",
        () => {

          engine.addRule();


          render();
        }
      );


    // --------------------------------------------------------
    // RESET PROFILE
    // --------------------------------------------------------

    container
      .querySelector(
        "#resetMappingButton"
      )
      ?.addEventListener(
        "click",
        () => {

          engine.resetProfile();


          render();
        }
      );


    // --------------------------------------------------------
    // RULE EVENTS
    // --------------------------------------------------------

    container
      .querySelectorAll(
        ".mapping-rule"
      )
      .forEach(
        (ruleElement) => {

          bindRule(
            ruleElement
          );
        }
      );


    // --------------------------------------------------------
    // REMOVE
    // --------------------------------------------------------

    container
      .querySelectorAll(
        "[data-remove-rule]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              engine.removeRule(
                button.dataset
                  .removeRule
              );


              render();
            }
          );
        }
      );
  }


  // ==========================================================
  // BIND ONE RULE
  // ==========================================================

  function bindRule(
    element
  ) {

    const ruleId =
      element.dataset
        .ruleId;


    const handSelect =
      element.querySelector(
        '[data-role="hand"]'
      );


    const featureSelect =
      element.querySelector(
        '[data-role="feature"]'
      );


    // --------------------------------------------------------
    // SOURCE
    // --------------------------------------------------------

    function updateSource() {

      engine.updateSource(

        ruleId,

        {

          hand:
            handSelect.value,

          feature:
            featureSelect.value,
        }
      );
    }


    handSelect
      .addEventListener(
        "change",
        updateSource
      );


    featureSelect
      .addEventListener(
        "change",
        updateSource
      );


    // --------------------------------------------------------
    // TARGETS
    // --------------------------------------------------------

    for (
      const domain
      of [
        "music",
        "visual",
        "haptic",
      ]
    ) {

      const select =
        element.querySelector(
          `[data-role="${domain}"]`
        );


      const checkbox =
        element.querySelector(
          `[data-role="${domain}-enabled"]`
        );


      if (
        !select ||
        !checkbox
      ) {

        continue;
      }


      select.addEventListener(
        "change",
        () => {

          engine.updateTarget(

            ruleId,

            domain,

            select.value
          );
        }
      );


      checkbox.addEventListener(
        "change",
        () => {

          engine.setTargetEnabled(

            ruleId,

            domain,

            checkbox.checked
          );


          select.disabled =
            !checkbox.checked;
        }
      );
    }
  }


  // ==========================================================
  // LIVE DATA
  // ==========================================================

  function updateLiveValues(
    mappingOutput
  ) {

    if (
      !Array.isArray(
        mappingOutput
      )
    ) {

      mappingOutput =
        [];
    }


    const activeRuleIds =
      new Set();


    for (
      const output
      of mappingOutput
    ) {

      activeRuleIds.add(
        output.ruleId
      );


      const valueElement =
        container.querySelector(
          `[data-live-value="${output.ruleId}"]`
        );


      if (
        !valueElement
      ) {

        continue;
      }


      valueElement.textContent =
        Number(
          output.value
        ).toFixed(
          2
        );


      valueElement
        .closest(
          ".mapping-rule"
        )
        ?.classList
        .add(
          "mapping-active"
        );
    }


    // --------------------------------------------------------
    // Inactive mappings
    // --------------------------------------------------------

    container
      .querySelectorAll(
        ".mapping-rule"
      )
      .forEach(
        (ruleElement) => {

          const ruleId =
            ruleElement.dataset
              .ruleId;


          if (
            activeRuleIds.has(
              ruleId
            )
          ) {

            return;
          }


          const valueElement =
            ruleElement.querySelector(
              "[data-live-value]"
            );


          if (
            valueElement
          ) {

            valueElement.textContent =
              "—";
          }


          ruleElement
            .classList
            .remove(
              "mapping-active"
            );
        }
      );
  }


  // ==========================================================
  // INITIAL RENDER
  // ==========================================================

  render();


  return {

    render,

    updateLiveValues,
  };
}


// ============================================================
// OPTION BUILDER
// ============================================================

function buildOptions(
  options,
  selectedValue
) {

  return options
    .map(
      ([
        value,
        label,
      ]) => {

        const selected =

          value ===
          selectedValue

            ? "selected"

            : "";


        return `
          <option
            value="${value}"
            ${selected}
          >
            ${label}
          </option>
        `;
      }
    )
    .join("");
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(
  value
) {

  return String(
    value
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}