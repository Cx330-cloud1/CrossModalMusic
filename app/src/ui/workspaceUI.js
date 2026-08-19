// ============================================================
// PERFORMANCE WORKSPACE V2.1
//
// UI-only layer.
//
// Does NOT change:
// - MediaPipe
// - gesture processing
// - mapping
// - composition
// - audio routing
// - haptics
//
// Responsibilities:
// - CREATE / DEBUG modes
// - compact workspace toolbar
// - Now Playing card
// - gesture guidance
// - Mapping drawer
// ============================================================

export function createPerformanceWorkspaceUI({
  mappingElement,
  cameraSection,
  technicalPanel,
}) {
  const header =
    document.querySelector("header");

  if (!header) {
    return createFallbackAPI();
  }


  // ==========================================================
  // ROOT STATE
  // ==========================================================

  let mode =
    "create";

  let drawerOpen =
    false;

  let lastNote =
    null;

  let lastPinchActive =
    false;


  document.body.classList.add(
    "workspace-create"
  );


  // ==========================================================
  // TOOLBAR
  // ==========================================================

  const toolbar =
    document.createElement("section");

  toolbar.className =
    "workspace-toolbar";

  toolbar.innerHTML = `
    <div class="workspace-brand">

      <div>
        <span class="workspace-kicker">
          PERFORMANCE WORKSPACE
        </span>

        <strong>
          Multisensory Gesture Instrument
        </strong>
      </div>

    </div>


    <div class="workspace-actions">

      <div
        class="workspace-view-switch"
        role="group"
        aria-label="Workspace view"
      >

        <button
          type="button"
          class="workspace-view-button active"
          data-workspace-view="create"
        >
          CREATE
        </button>

        <button
          type="button"
          class="workspace-view-button"
          data-workspace-view="debug"
        >
          DEBUG
        </button>

      </div>


      <button
        type="button"
        class="workspace-map-button"
        data-open-mapping
      >
        MAP
      </button>

    </div>
  `;

  header.insertAdjacentElement(
    "afterend",
    toolbar
  );


  // ==========================================================
  // CAMERA GUIDANCE
  // ==========================================================

  const guidance =
    document.createElement("div");

  guidance.className =
    "workspace-gesture-guide";

  guidance.innerHTML = `
    <div class="gesture-guide-item left-guide">

      <span class="gesture-guide-dot"></span>

      <div>
        <small>LEFT HAND</small>
        <strong>MOVE FOR PITCH</strong>
      </div>

    </div>


    <div class="gesture-guide-item right-guide">

      <span class="gesture-guide-dot"></span>

      <div>
        <small>RIGHT HAND</small>
        <strong>PINCH TO PLAY</strong>
      </div>

    </div>
  `;


  const cameraContainer =
    cameraSection?.querySelector(
      ".camera-container"
    );


  if (cameraContainer) {

    cameraContainer.appendChild(
      guidance
    );
  }


  // ==========================================================
  // NOW PLAYING
  // ==========================================================

  const nowPlaying =
    document.createElement("div");

  nowPlaying.className =
    "workspace-now-playing";

  nowPlaying.innerHTML = `
    <div class="now-playing-top">

      <span>
        NOW PLAYING
      </span>

      <i></i>

    </div>


    <div class="now-playing-main">

      <strong
        class="now-playing-note"
        data-now-note
      >
        —
      </strong>


      <span
        class="now-playing-instrument"
        data-now-instrument
      >
        WAITING
      </span>


      <small
        class="now-playing-meta"
        data-now-meta
      >
        START A SESSION
      </small>

    </div>


    <div class="now-playing-bottom">

      <div>

        <span>
          HARMONY
        </span>

        <strong
          data-now-harmony
        >
          —
        </strong>

      </div>


      <div>

        <span>
          TEMPO
        </span>

        <strong
          data-now-tempo
        >
          —
        </strong>

      </div>

    </div>
  `;


  if (cameraContainer) {

    cameraContainer.appendChild(
      nowPlaying
    );
  }


  // ==========================================================
  // MAPPING DRAWER
  // ==========================================================

  const drawer =
    document.createElement("div");

  drawer.className =
    "workspace-drawer";

  drawer.setAttribute(
    "aria-hidden",
    "true"
  );


  drawer.innerHTML = `
    <div
      class="workspace-drawer-backdrop"
      data-close-mapping
    ></div>


    <aside class="workspace-drawer-panel">

      <div class="workspace-drawer-header">

        <div>

          <span>
            PERSONAL MAPPING
          </span>

          <strong>
            My Music Language
          </strong>

        </div>


        <button
          type="button"
          data-close-mapping
          aria-label="Close mapping"
        >
          ×
        </button>

      </div>


      <div
        class="workspace-drawer-content"
        data-mapping-slot
      ></div>

    </aside>
  `;


  document.body.appendChild(
    drawer
  );


  const mappingSlot =
    drawer.querySelector(
      "[data-mapping-slot]"
    );


  // Important:
  //
  // musicUI is already created before workspaceUI.
  // Therefore moving #mappingStudio here does NOT move
  // the dynamically created Music UI with it.
  if (
    mappingElement &&
    mappingSlot
  ) {

    mappingSlot.appendChild(
      mappingElement
    );
  }


  // ==========================================================
  // EVENTS
  // ==========================================================

  toolbar
    .querySelectorAll(
      "[data-workspace-view]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          setMode(
            button.dataset
              .workspaceView
          );
        }
      );
    });


  toolbar
    .querySelector(
      "[data-open-mapping]"
    )
    ?.addEventListener(
      "click",
      openMapping
    );


  drawer
    .querySelectorAll(
      "[data-close-mapping]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        closeMapping
      );
    });


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
          "Escape" &&
        drawerOpen
      ) {

        closeMapping();
      }
    }
  );


  // ==========================================================
  // MODE
  // ==========================================================

  function setMode(
    nextMode
  ) {

    mode =
      nextMode ===
      "debug"
        ? "debug"
        : "create";


    document.body.classList.toggle(
      "workspace-create",
      mode ===
        "create"
    );


    document.body.classList.toggle(
      "workspace-debug",
      mode ===
        "debug"
    );


    toolbar
      .querySelectorAll(
        "[data-workspace-view]"
      )
      .forEach((button) => {

        button.classList.toggle(
          "active",
          button.dataset
            .workspaceView ===
            mode
        );
      });


    technicalPanel
      ?.setAttribute(
        "aria-hidden",
        mode ===
          "create"
          ? "true"
          : "false"
      );
  }


  // ==========================================================
  // DRAWER
  // ==========================================================

  function openMapping() {

    drawerOpen =
      true;


    drawer.classList.add(
      "open"
    );


    drawer.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.classList.add(
      "mapping-drawer-open"
    );
  }


  function closeMapping() {

    drawerOpen =
      false;


    drawer.classList.remove(
      "open"
    );


    drawer.setAttribute(
      "aria-hidden",
      "true"
    );


    document.body.classList.remove(
      "mapping-drawer-open"
    );
  }


  // ==========================================================
  // UPDATE
  // ==========================================================

  function update({
    audioState,
    hands = [],
  } = {}) {

    updateNowPlaying(
      audioState
    );


    updateGestureGuide(
      hands
    );


    updatePlayFeedback(
      hands,
      audioState
    );
  }


  // ==========================================================
  // NOW PLAYING UPDATE
  // ==========================================================

  function updateNowPlaying(
    audioState
  ) {

    const noteElement =
      nowPlaying.querySelector(
        "[data-now-note]"
      );


    const instrumentElement =
      nowPlaying.querySelector(
        "[data-now-instrument]"
      );


    const metaElement =
      nowPlaying.querySelector(
        "[data-now-meta]"
      );


    const harmonyElement =
      nowPlaying.querySelector(
        "[data-now-harmony]"
      );


    const tempoElement =
      nowPlaying.querySelector(
        "[data-now-tempo]"
      );


    const note =
      audioState?.note ??
      "—";


    const instrument =
      audioState
        ?.instrumentLabel ??
      "WAITING";


    const zone =
      audioState
        ?.zoneLabel ??
      "—";


    const role =
      audioState
        ?.noteRole ??
      "—";


    const harmony =
      audioState
        ?.harmony
        ?.name ??
      audioState
        ?.harmony
        ?.label ??
      "—";


    const tempo =
      audioState
        ?.composition
        ?.tempo ??
      audioState
        ?.tempo ??
      "—";


    noteElement.textContent =
      note;


    instrumentElement.textContent =
      instrument;


    metaElement.textContent =
      note ===
        "—"
        ? "MOVE LEFT HAND"
        : `${zone} · ${role}`;


    harmonyElement.textContent =
      harmony;


    tempoElement.textContent =
      tempo ===
        "—"
        ? "—"
        : `${tempo} BPM`;


    if (
      lastNote !==
      note
    ) {

      nowPlaying.classList.remove(
        "note-change"
      );


      void nowPlaying.offsetWidth;


      nowPlaying.classList.add(
        "note-change"
      );


      lastNote =
        note;
    }
  }


  // ==========================================================
  // GESTURE GUIDE
  // ==========================================================

  function updateGestureGuide(
    hands
  ) {

    const left =
      hands.find(
        (hand) =>
          hand.label ===
          "Left"
      );


    const right =
      hands.find(
        (hand) =>
          hand.label ===
          "Right"
      );


    const leftGuide =
      guidance.querySelector(
        ".left-guide"
      );


    const rightGuide =
      guidance.querySelector(
        ".right-guide"
      );


    leftGuide.classList.toggle(
      "detected",
      Boolean(left)
    );


    rightGuide.classList.toggle(
      "detected",
      Boolean(right)
    );


    const leftStrong =
      leftGuide.querySelector(
        "strong"
      );


    const rightStrong =
      rightGuide.querySelector(
        "strong"
      );


    leftStrong.textContent =
      left
        ? "PITCH ACTIVE"
        : "MOVE FOR PITCH";


    rightStrong.textContent =
      right
        ? (
            right.pinchActive
              ? "PINCH ACTIVE"
              : "PINCH TO PLAY"
          )
        : "PINCH TO PLAY";
  }


  // ==========================================================
  // PLAY FEEDBACK
  // ==========================================================

  function updatePlayFeedback(
    hands
  ) {

    const right =
      hands.find(
        (hand) =>
          hand.label ===
          "Right"
      );


    const pinchStarted =
      Boolean(
        right?.pinchStarted
      );


    if (
      pinchStarted &&
      !lastPinchActive
    ) {

      nowPlaying.classList.remove(
        "played"
      );


      void nowPlaying.offsetWidth;


      nowPlaying.classList.add(
        "played"
      );
    }


    lastPinchActive =
      Boolean(
        right?.pinchActive
      );
  }


  // ==========================================================
  // RESET
  // ==========================================================

  function reset() {

    update({

      audioState:
        null,

      hands:
        [],
    });
  }


  // ==========================================================
  // INITIAL MODE
  // ==========================================================

  setMode(
    "create"
  );


  return {

    update,

    reset,

    setMode,

    openMapping,

    closeMapping,

    getState() {

      return {

        mode,

        drawerOpen,
      };
    },
  };
}


// ============================================================
// FALLBACK
// ============================================================

function createFallbackAPI() {

  return {

    update() {},

    reset() {},

    setMode() {},

    openMapping() {},

    closeMapping() {},

    getState() {

      return {
        mode:
          "create",

        drawerOpen:
          false,
      };
    },
  };
}