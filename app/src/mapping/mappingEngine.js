// ============================================================
// PERSONAL MAPPING ENGINE V2
//
// Gesture / body feature
//        ↓
// User-defined semantic mapping
//        ↓
// Music + Visual + Haptic
//
// Core principle:
// The system does not permanently decide what a gesture means.
// The mapping belongs to the creator.
// ============================================================


const STORAGE_KEY =
  "cross-modal-mapping-profile-v1";


const CURRENT_PROFILE_VERSION =
  2;


// ============================================================
// DEFAULT PROFILE V2
// ============================================================

const DEFAULT_PROFILE = {

  name:
    "Default Music Language",

  version:
    CURRENT_PROFILE_VERSION,

  rules: [

    // ========================================================
    // LEFT Y
    //
    // Vertical position:
    // pitch + visual height + spatial haptic flow
    // ========================================================

    {
      id:
        "left-y",

      source: {

        hand:
          "Left",

        feature:
          "y",
      },

      targets: {

        music: {

          enabled:
            true,

          parameter:
            "pitch",
        },


        visual: {

          enabled:
            true,

          parameter:
            "rising-line",
        },


        haptic: {

          enabled:
            true,

          parameter:
            "center-to-right",
        },
      },
    },


    // ========================================================
    // LEFT X
    //
    // Horizontal position:
    // timbre + visual color
    // ========================================================

    {
      id:
        "left-x",

      source: {

        hand:
          "Left",

        feature:
          "x",
      },

      targets: {

        music: {

          enabled:
            true,

          parameter:
            "timbre",
        },


        visual: {

          enabled:
            true,

          parameter:
            "color-shift",
        },


        haptic: {

          enabled:
            false,

          parameter:
            "left-pair",
        },
      },
    },


    // ========================================================
    // RIGHT PINCH
    //
    // Intentional event trigger:
    // formal note + visual pulse + alternating body feedback
    // ========================================================

    {
      id:
        "right-pinch",

      source: {

        hand:
          "Right",

        feature:
          "pinchStarted",
      },

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


    // ========================================================
    // RIGHT MOVEMENT ENERGY
    //
    // Expressive intensity / velocity
    // ========================================================

    {
      id:
        "right-speed",

      source: {

        hand:
          "Right",

        feature:
          "speed",
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


    // ========================================================
    // RIGHT OPENNESS
    //
    // New in V2:
    // Opening the hand gradually introduces Ambient Pad.
    //
    // Internal parameter remains "texture" for compatibility
    // with existing saved mappings.
    // ========================================================

    {
      id:
        "right-openness",

      source: {

        hand:
          "Right",

        feature:
          "openness",
      },

      targets: {

        music: {

          enabled:
            true,

          parameter:
            "texture",
        },


        visual: {

          enabled:
            false,

          parameter:
            "expansion",
        },


        haptic: {

          enabled:
            false,

          parameter:
            "all",
        },
      },
    },
  ],
};


// ============================================================
// ENGINE
// ============================================================

export function createMappingEngine() {

  let profile =
    loadProfile();


  // ==========================================================
  // RESOLVE
  //
  // Current hand data
  //       ↓
  // active user mapping rules
  //       ↓
  // semantic outputs
  // ==========================================================

  function resolve(
    handData
  ) {

    if (
      !Array.isArray(
        handData
      )
    ) {

      return [];
    }


    const outputs =
      [];


    for (
      const rule
      of profile.rules
    ) {

      const hand =
        handData.find(
          (item) =>
            item.label ===
            rule.source.hand
        );


      if (
        !hand
      ) {

        continue;
      }


      const rawValue =
        hand[
          rule.source.feature
        ];


      if (
        rawValue ===
        undefined
      ) {

        continue;
      }


      const value =
        normalizeSourceValue(
          rawValue
        );


      outputs.push({

        ruleId:
          rule.id,


        source: {

          ...rule.source,
        },


        value,


        rawValue,


        targets:
          clone(
            rule.targets
          ),
      });
    }


    return outputs;
  }


  // ==========================================================
  // UPDATE SOURCE
  // ==========================================================

  function updateSource(
    ruleId,
    {
      hand,
      feature,
    }
  ) {

    const rule =
      findRule(
        ruleId
      );


    if (
      !rule
    ) {

      return false;
    }


    if (
      hand
    ) {

      rule.source.hand =
        hand;
    }


    if (
      feature
    ) {

      rule.source.feature =
        feature;
    }


    saveProfile();


    return true;
  }


  // ==========================================================
  // UPDATE TARGET PARAMETER
  // ==========================================================

  function updateTarget(
    ruleId,
    domain,
    parameter
  ) {

    const rule =
      findRule(
        ruleId
      );


    if (
      !rule ||
      !rule.targets[
        domain
      ]
    ) {

      return false;
    }


    rule.targets[
      domain
    ].parameter =
      parameter;


    saveProfile();


    return true;
  }


  // ==========================================================
  // ENABLE / DISABLE TARGET
  // ==========================================================

  function setTargetEnabled(
    ruleId,
    domain,
    enabled
  ) {

    const rule =
      findRule(
        ruleId
      );


    if (
      !rule ||
      !rule.targets[
        domain
      ]
    ) {

      return false;
    }


    rule.targets[
      domain
    ].enabled =
      Boolean(
        enabled
      );


    saveProfile();


    return true;
  }


  // ==========================================================
  // ADD MAPPING RULE
  // ==========================================================

  function addRule(
    config = {}
  ) {

    const id =
      config.id ??
      createRuleId();


    const rule = {

      id,


      source: {

        hand:
          config.source
            ?.hand ??
          "Left",

        feature:
          config.source
            ?.feature ??
          "y",
      },


      targets: {

        music: {

          enabled:
            config.targets
              ?.music
              ?.enabled ??
            true,

          parameter:
            config.targets
              ?.music
              ?.parameter ??
            "pitch",
        },


        visual: {

          enabled:
            config.targets
              ?.visual
              ?.enabled ??
            true,

          parameter:
            config.targets
              ?.visual
              ?.parameter ??
            "rising-line",
        },


        haptic: {

          enabled:
            config.targets
              ?.haptic
              ?.enabled ??
            false,

          parameter:
            config.targets
              ?.haptic
              ?.parameter ??
            "all",
        },
      },
    };


    profile.rules.push(
      rule
    );


    saveProfile();


    return clone(
      rule
    );
  }


  // ==========================================================
  // REMOVE RULE
  // ==========================================================

  function removeRule(
    ruleId
  ) {

    const index =
      profile.rules
        .findIndex(
          (rule) =>
            rule.id ===
            ruleId
        );


    if (
      index ===
      -1
    ) {

      return false;
    }


    profile.rules.splice(
      index,
      1
    );


    saveProfile();


    return true;
  }


  // ==========================================================
  // PROFILE
  // ==========================================================

  function getProfile() {

    return clone(
      profile
    );
  }


  function setProfileName(
    name
  ) {

    profile.name =
      name ||
      "Untitled Music Language";


    saveProfile();
  }


  function resetProfile() {

    profile =
      clone(
        DEFAULT_PROFILE
      );


    saveProfile();


    return getProfile();
  }


  // ==========================================================
  // FIND RULE
  // ==========================================================

  function findRule(
    ruleId
  ) {

    return (
      profile.rules.find(
        (rule) =>
          rule.id ===
          ruleId
      ) ??
      null
    );
  }


  // ==========================================================
  // SAVE
  // ==========================================================

  function saveProfile() {

    try {

      localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(
          profile
        )
      );

    }

    catch (error) {

      console.warn(
        "Unable to save mapping profile.",
        error
      );
    }
  }


  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {

    resolve,

    getProfile,

    updateSource,

    updateTarget,

    setTargetEnabled,

    addRule,

    removeRule,

    setProfileName,

    resetProfile,
  };
}


// ============================================================
// LOAD + MIGRATE PROFILE
// ============================================================

function loadProfile() {

  try {

    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (
      !stored
    ) {

      return clone(
        DEFAULT_PROFILE
      );
    }


    const parsed =
      JSON.parse(
        stored
      );


    if (
      !parsed ||
      !Array.isArray(
        parsed.rules
      )
    ) {

      return clone(
        DEFAULT_PROFILE
      );
    }


    // ========================================================
    // MIGRATION: V1 → V2
    //
    // Preserve the user's existing mapping choices.
    // Only add the new Ambient Pad rule if it does not exist.
    // ========================================================

    if (
      !parsed.version ||
      parsed.version <
        CURRENT_PROFILE_VERSION
    ) {

      const hasRightOpenness =
        parsed.rules.some(
          (rule) =>
            rule.id ===
            "right-openness"
        );


      if (
        !hasRightOpenness
      ) {

        parsed.rules.push({

          id:
            "right-openness",


          source: {

            hand:
              "Right",

            feature:
              "openness",
          },


          targets: {

            music: {

              enabled:
                true,

              parameter:
                "texture",
            },


            visual: {

              enabled:
                false,

              parameter:
                "expansion",
            },


            haptic: {

              enabled:
                false,

              parameter:
                "all",
            },
          },
        });
      }


      parsed.version =
        CURRENT_PROFILE_VERSION;


      localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(
          parsed
        )
      );
    }


    return parsed;

  }

  catch (error) {

    console.warn(
      "Unable to load mapping profile.",
      error
    );


    return clone(
      DEFAULT_PROFILE
    );
  }
}


// ============================================================
// NORMALIZE SOURCE VALUE
// ============================================================

function normalizeSourceValue(
  rawValue
) {

  if (
    typeof rawValue ===
    "boolean"
  ) {

    return rawValue
      ? 1
      : 0;
  }


  if (
    typeof rawValue ===
    "number"
  ) {

    return Math.max(

      0,

      Math.min(
        1,
        rawValue
      )
    );
  }


  return 0;
}


// ============================================================
// HELPERS
// ============================================================

function createRuleId() {

  return (
    "mapping-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(16)
      .slice(2)
  );
}


function clone(
  object
) {

  return JSON.parse(
    JSON.stringify(
      object
    )
  );
}