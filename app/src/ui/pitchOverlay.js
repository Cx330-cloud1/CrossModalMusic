// ============================================================
// CAMERA PITCH OVERLAY
//
// Makes the camera itself part of the musical instrument.
//
// It answers:
//
// "Where is my hand now?"
// "Which note will this position produce?"
//
// The overlay does NOT change pitch mapping.
// It only visualizes the pitch space already used by
// Music Engine / Composition Assist.
// ============================================================


export function createPitchOverlay({
  videoElement,
}) {

  if (
    !videoElement
  ) {

    return {
      update() {},
      clear() {},
      destroy() {},
    };
  }


  const host =
    videoElement.parentElement;


  if (
    !host
  ) {

    return {
      update() {},
      clear() {},
      destroy() {},
    };
  }


  host.classList.add(
    "pitch-overlay-host"
  );


  const overlay =
    document.createElement(
      "div"
    );


  overlay.className =
    "camera-pitch-overlay";


  overlay.innerHTML = `
    <div class="pitch-overlay-empty">
      <span>PITCH SPACE</span>
      <strong>WAITING FOR HAND</strong>
    </div>
  `;


  host.appendChild(
    overlay
  );


  let lastSignature =
    "";


  // ==========================================================
  // UPDATE
  // ==========================================================

  function update(
    audioState
  ) {

    const notes =
      audioState
        ?.scaleNotes;


    const currentNote =
      audioState
        ?.note;


    if (
      !Array.isArray(
        notes
      ) ||
      notes.length ===
        0 ||
      !currentNote
    ) {

      clear();

      return;
    }


    const currentIndex =
      notes.indexOf(
        currentNote
      );


    if (
      currentIndex ===
      -1
    ) {

      clear();

      return;
    }


    const signature =
      [
        currentNote,
        audioState.scale,
        audioState.instrumentLabel,
        audioState.zoneLabel,
        notes.join(","),
      ].join("|");


    if (
      signature ===
      lastSignature
    ) {

      return;
    }


    lastSignature =
      signature;


    const previousNote =
      notes[
        currentIndex -
        1
      ] ??
      null;


    const nextNote =
      notes[
        currentIndex +
        1
      ] ??
      null;


    const currentPosition =
      getNotePosition(

        currentIndex,

        notes.length
      );


    const previousPosition =

      previousNote

        ? getNotePosition(

            currentIndex -
              1,

            notes.length
          )

        : null;


    const nextPosition =

      nextNote

        ? getNotePosition(

            currentIndex +
              1,

            notes.length
          )

        : null;


    const boundaries =
      buildRegisterBoundaries(
        notes
      );


    overlay.innerHTML = `

      <!-- ===============================================
           REGISTER BOUNDARIES
      ================================================ -->

      <div class="pitch-register-layer">

        ${boundaries
          .map(
            (boundary) => `
              <div
                class="
                  camera-register-boundary
                  ${boundary.zone}
                "
                style="
                  top:
                  ${boundary.position}%;
                "
              >

                <span>
                  ${boundary.label}
                </span>

                <small>
                  ${boundary.note}
                </small>

              </div>
            `
          )
          .join("")}

      </div>


      <!-- ===============================================
           NEIGHBOUR NOTES
      ================================================ -->

      ${
        nextNote
          ? `
            <div
              class="
                camera-pitch-note
                neighbour
              "
              style="
                top:
                ${nextPosition}%;
              "
            >

              <span class="pitch-line"></span>

              <strong>
                ${nextNote}
              </strong>

            </div>
          `
          : ""
      }


      ${
        previousNote
          ? `
            <div
              class="
                camera-pitch-note
                neighbour
              "
              style="
                top:
                ${previousPosition}%;
              "
            >

              <span class="pitch-line"></span>

              <strong>
                ${previousNote}
              </strong>

            </div>
          `
          : ""
      }


      <!-- ===============================================
           CURRENT NOTE
      ================================================ -->

      <div
        class="
          camera-pitch-note
          current
        "
        style="
          top:
          ${currentPosition}%;
        "
      >

        <span class="pitch-line"></span>


        <div class="current-pitch-marker">

          <span class="current-pitch-dot"></span>


          <div>

            <strong>
              ${currentNote}
            </strong>

            <small>
              ${
                audioState
                  .instrumentLabel ??
                ""
              }
              ·
              ${
                audioState
                  .zoneLabel ??
                ""
              }
            </small>

          </div>

        </div>

      </div>


      <!-- ===============================================
           SMALL STATUS
      ================================================ -->

      <div class="camera-pitch-status">

        <span>
          PITCH SPACE
        </span>

        <strong>
          ${
            audioState.scale
              ?.toUpperCase() ??
            ""
          }
        </strong>

        <small>
          ${
            notes.length
          }
          NOTES
        </small>

      </div>
    `;
  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  function clear() {

    lastSignature =
      "";


    overlay.innerHTML = `
      <div class="pitch-overlay-empty">
        <span>PITCH SPACE</span>
        <strong>WAITING FOR HAND</strong>
      </div>
    `;
  }


  // ==========================================================
  // DESTROY
  // ==========================================================

  function destroy() {

    overlay.remove();


    host.classList.remove(
      "pitch-overlay-host"
    );
  }


  // ==========================================================
  // PUBLIC API
  // ==========================================================

  return {

    update,

    clear,

    destroy,
  };
}


// ============================================================
// NOTE POSITION
//
// Higher note → higher on camera.
//
// 0% = top
// 100% = bottom
// ============================================================

function getNotePosition(
  index,
  noteCount
) {

  if (
    noteCount <=
    1
  ) {

    return 50;
  }


  const normalized =
    index /
    (
      noteCount -
      1
    );


  return (
    92 -
    normalized *
    84
  );
}


// ============================================================
// REGISTER BOUNDARIES
//
// LOW
// C3–B3
//
// MID
// C4–B4
//
// HIGH
// C5–C6
// ============================================================

function buildRegisterBoundaries(
  notes
) {

  const candidates = [

    {
      note:
        "C4",

      label:
        "MID",

      zone:
        "mid",
    },

    {
      note:
        "C5",

      label:
        "HIGH",

      zone:
        "high",
    },
  ];


  const boundaries =
    [];


  for (
    const candidate
    of candidates
  ) {

    const index =
      notes.indexOf(
        candidate.note
      );


    if (
      index ===
      -1
    ) {

      continue;
    }


    boundaries.push({

      ...candidate,

      position:
        getNotePosition(
          index,
          notes.length
        ),
    });
  }


  return boundaries;
}