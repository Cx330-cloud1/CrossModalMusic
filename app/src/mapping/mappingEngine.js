// ============================================================
// PERSONAL MAPPING ENGINE
//
// Gesture / body feature
//        ↓
// Music + Visual + Haptic meaning
//
// The mappings belong to the user rather than being
// permanently defined by the system.
// ============================================================


const STORAGE_KEY =
  "cross-modal-mapping-profile-v1";


// ============================================================
// DEFAULT PROFILE
//
// These are only starting suggestions.
// Users will be able to modify them in the Mapping Studio.
// ============================================================

const DEFAULT_PROFILE = {

  name: "Default Music Language",

  version: 1,

  rules: [

    {
      id: "left-y",

      source: {
        hand: "Left",
        feature: "y",
      },

      targets: {

        music: {
          enabled: true,
          parameter: "pitch",
        },

        visual: {
          enabled: true,
          parameter: "rising-line",
        },

        haptic: {
          enabled: true,
          parameter: "center-to-right",
        },
      },
    },


    {
      id: "left-x",

      source: {
        hand: "Left",
        feature: "x",
      },

      targets: {

        music: {
          enabled: true,
          parameter: "timbre",
        },

        visual: {
          enabled: true,
          parameter: "color-shift",
        },

        haptic: {
          enabled: false,
          parameter: "left-pair",
        },
      },
    },


    {
      id: "right-pinch",

      source: {
        hand: "Right",
        feature: "pinchStarted",
      },

      targets: {

        music: {
          enabled: true,
          parameter: "note-trigger",
        },

        visual: {
          enabled: true,
          parameter: "pulse",
        },

        haptic: {
          enabled: true,
          parameter: "alternating",
        },
      },
    },


    {
      id: "right-speed",

      source: {
        hand: "Right",
        feature: "speed",
      },

      targets: {

        music: {
          enabled: true,
          parameter: "intensity",
        },

        visual: {
          enabled: true,
          parameter: "particle-energy",
        },

        haptic: {
          enabled: true,
          parameter: "intensity",
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


  // ----------------------------------------------------------
  // Resolve current hand data into semantic output
  // ----------------------------------------------------------

  function resolve(
    handData
  ) {

    const outputs = [];


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


      if (!hand) {
        continue;
      }


      const rawValue =
        hand[
          rule.source.feature
        ];


      if (
        rawValue === undefined
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


  // ----------------------------------------------------------
  // Change source
  // ----------------------------------------------------------

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


    if (!rule) {
      return false;
    }


    if (hand) {

      rule.source.hand =
        hand;
    }


    if (feature) {

      rule.source.feature =
        feature;
    }


    saveProfile();

    return true;
  }


  // ----------------------------------------------------------
  // Change target
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // Enable / disable target
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // Add custom mapping rule
  // ----------------------------------------------------------

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
          config.source?.hand ??
          "Left",

        feature:
          config.source?.feature ??
          "y",
      },

      targets: {

        music: {
          enabled:
            config.targets
              ?.music
              ?.enabled
            ?? true,

          parameter:
            config.targets
              ?.music
              ?.parameter
            ?? "pitch",
        },


        visual: {
          enabled:
            config.targets
              ?.visual
              ?.enabled
            ?? true,

          parameter:
            config.targets
              ?.visual
              ?.parameter
            ?? "line",
        },


        haptic: {
          enabled:
            config.targets
              ?.haptic
              ?.enabled
            ?? true,

          parameter:
            config.targets
              ?.haptic
              ?.parameter
            ?? "left",
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


  // ----------------------------------------------------------
  // Remove rule
  // ----------------------------------------------------------

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


    if (index === -1) {
      return false;
    }


    profile.rules.splice(
      index,
      1
    );


    saveProfile();

    return true;
  }


  // ----------------------------------------------------------
  // Profile
  // ----------------------------------------------------------

  function getProfile() {

    return clone(
      profile
    );
  }


  function setProfileName(
    name
  ) {

    profile.name =
      name;

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


  // ----------------------------------------------------------
  // Internal
  // ----------------------------------------------------------

  function findRule(
    ruleId
  ) {

    return (
      profile.rules.find(
        (rule) =>
          rule.id ===
          ruleId
      )
      ?? null
    );
  }


  function saveProfile() {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        profile
      )
    );
  }


  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

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
// STORAGE
// ============================================================

function loadProfile() {

  try {

    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (!stored) {

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
// VALUE NORMALIZATION
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