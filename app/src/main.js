import "./style.css";

import {
  createHandTracker,
  extractHandFeatures,
} from "./cv/handTracking.js";

import {
  createHandSignalProcessor,
} from "./cv/signalProcessing.js";

import {
  createMappingEngine,
} from "./mapping/mappingEngine.js";

import {
  createMappingStudioUI,
} from "./mapping/mappingUI.js";

import {
  createMusicEngine,
} from "./audio/musicEngine.js";

import {
  createVisualEngine,
} from "./visual/visualEngine.js";


// ============================================================
// CORE DOM
// ============================================================

const video =
  document.querySelector("#webcam");

const canvas =
  document.querySelector("#overlay");

const ctx =
  canvas.getContext("2d");

const startButton =
  document.querySelector("#startButton");

const statusElement =
  document.querySelector("#status");

const cameraMessage =
  document.querySelector("#cameraMessage");

const landmarkCount =
  document.querySelector("#landmarkCount");

const handStatus =
  document.querySelector("#handStatus");

const mappingStudioContainer =
  document.querySelector("#mappingStudio");

const visualCanvas =
  document.querySelector("#visualCanvas");


// ============================================================
// LEFT / RIGHT HAND UI
// ============================================================

const handUI = {

  Left: {

    panel:
      document.querySelector("#leftPanel"),

    presence:
      document.querySelector("#leftPresence"),

    confidence:
      document.querySelector("#leftConfidence"),

    xValue:
      document.querySelector("#leftXValue"),

    xBar:
      document.querySelector("#leftXBar"),

    yValue:
      document.querySelector("#leftYValue"),

    yBar:
      document.querySelector("#leftYBar"),

    pinchValue:
      document.querySelector("#leftPinchValue"),

    pinchBar:
      document.querySelector("#leftPinchBar"),

    openValue:
      document.querySelector("#leftOpenValue"),

    openBar:
      document.querySelector("#leftOpenBar"),

    speedValue:
      document.querySelector("#leftSpeedValue"),

    speedBar:
      document.querySelector("#leftSpeedBar"),
  },


  Right: {

    panel:
      document.querySelector("#rightPanel"),

    presence:
      document.querySelector("#rightPresence"),

    confidence:
      document.querySelector("#rightConfidence"),

    xValue:
      document.querySelector("#rightXValue"),

    xBar:
      document.querySelector("#rightXBar"),

    yValue:
      document.querySelector("#rightYValue"),

    yBar:
      document.querySelector("#rightYBar"),

    pinchValue:
      document.querySelector("#rightPinchValue"),

    pinchBar:
      document.querySelector("#rightPinchBar"),

    openValue:
      document.querySelector("#rightOpenValue"),

    openBar:
      document.querySelector("#rightOpenBar"),

    speedValue:
      document.querySelector("#rightSpeedValue"),

    speedBar:
      document.querySelector("#rightSpeedBar"),
  },
};


// ============================================================
// RUNTIME STATE
// ============================================================

let handTracker =
  null;

let previousVideoTime =
  -1;


// ============================================================
// RAW FEATURE HISTORY
// ============================================================

const previousFeatureStates = {

  Left:
    null,

  Right:
    null,
};


// ============================================================
// SIGNAL PROCESSORS
// ============================================================

const signalProcessors = {

  Left:
    createHandSignalProcessor(),

  Right:
    createHandSignalProcessor(),
};


// ============================================================
// PERSONAL MAPPING ENGINE
// ============================================================

const mappingEngine =
  createMappingEngine();


// ============================================================
// MUSIC ENGINE
// ============================================================

const musicEngine =
  createMusicEngine();


// ============================================================
// VISUAL ENGINE
// ============================================================

const visualEngine =
  createVisualEngine(
    visualCanvas
  );


// ============================================================
// PERSONAL MAPPING UI
// ============================================================

const mappingUI =
  createMappingStudioUI({

    container:
      mappingStudioContainer,

    engine:
      mappingEngine,
  });


// ============================================================
// DEVELOPMENT / DEBUG API
// ============================================================

window.mappingStudio =
  mappingEngine;

window.crossModalHands =
  [];

window.crossModalMapping = {

  profile:
    mappingEngine.getProfile(),

  output:
    [],
};

window.crossModalAudio =
  musicEngine.getState();


// ============================================================
// START SESSION
// ============================================================

startButton.addEventListener(
  "click",
  startSession
);


async function startSession() {

  startButton.disabled =
    true;


  startButton.textContent =
    "INITIALIZING...";


  statusElement.textContent =
    "LOADING";


  // ==========================================================
  // START AUDIO
  //
  // Tone.js must be started as a result of user interaction.
  // ==========================================================

  try {

    await musicEngine.start();


    window.crossModalAudio =
      musicEngine.getState();

  }

  catch (error) {

    console.error(
      "Unable to initialize audio:",
      error
    );
  }


  // ==========================================================
  // START CAMERA + MEDIAPIPE
  // ==========================================================

  try {

    handTracker =
      await createHandTracker();


    const stream =
      await navigator.mediaDevices
        .getUserMedia({

          video: {

            width: {
              ideal: 1280,
            },

            height: {
              ideal: 720,
            },
          },

          audio:
            false,
        });


    video.srcObject =
      stream;


    await video.play();


    resizeCanvas();


    cameraMessage.style.display =
      "none";


    statusElement.textContent =
      "LIVE";


    statusElement.classList.add(
      "live"
    );


    startButton.textContent =
      "SESSION ACTIVE";


    requestAnimationFrame(
      detectionLoop
    );

  }

  catch (error) {

    console.error(
      "Unable to initialize session:",
      error
    );


    statusElement.textContent =
      "ERROR";


    statusElement.classList.remove(
      "live"
    );


    cameraMessage.style.display =
      "block";


    cameraMessage.textContent =
      "Unable to initialize camera";


    startButton.disabled =
      false;


    startButton.textContent =
      "TRY AGAIN";
  }
}


// ============================================================
// DETECTION LOOP
// ============================================================

function detectionLoop() {

  if (
    handTracker &&
    video.readyState >= 2 &&
    video.currentTime !== previousVideoTime
  ) {

    previousVideoTime =
      video.currentTime;


    const result =
      handTracker.detectForVideo(

        video,

        performance.now()
      );


    processDetectionResult(
      result
    );
  }


  requestAnimationFrame(
    detectionLoop
  );
}


// ============================================================
// PROCESS MEDIAPIPE RESULT
// ============================================================

function processDetectionResult(
  result
) {

  resizeCanvas();


  ctx.clearRect(

    0,

    0,

    canvas.width,

    canvas.height
  );


  const hands =
    getDetectedHands(
      result
    );


  // ==========================================================
  // NO HANDS
  // ==========================================================

  if (
    hands.length === 0
  ) {

    landmarkCount.textContent =
      "0";


    handStatus.textContent =
      "NOT DETECTED";


    clearHandPanel(
      "Left"
    );


    clearHandPanel(
      "Right"
    );


    previousFeatureStates.Left =
      null;


    previousFeatureStates.Right =
      null;


    signalProcessors.Left.reset();


    signalProcessors.Right.reset();


    window.crossModalHands =
      [];


    const emptyMappingOutput =
      [];


    window.crossModalMapping = {

      profile:
        mappingEngine.getProfile(),

      output:
        emptyMappingOutput,
    };


    // Mapping UI returns to inactive state.

    mappingUI.updateLiveValues(
      emptyMappingOutput
    );


    // Reset visual expression.

    visualEngine.clear();


    window.crossModalAudio =
      musicEngine.getState();


    return;
  }


  // ==========================================================
  // GLOBAL TRACKING INFO
  // ==========================================================

  landmarkCount.textContent =
    String(

      hands.reduce(

        (
          total,
          hand
        ) =>

          total +
          hand.landmarks.length,

        0
      )
    );


  const visibleHands =
    new Set(

      hands.map(
        (hand) =>
          hand.label
      )
    );


  if (
    visibleHands.has("Left") &&
    visibleHands.has("Right")
  ) {

    handStatus.textContent =
      "LEFT + RIGHT";

  }

  else if (
    visibleHands.has("Left")
  ) {

    handStatus.textContent =
      "LEFT";

  }

  else if (
    visibleHands.has("Right")
  ) {

    handStatus.textContent =
      "RIGHT";

  }

  else {

    handStatus.textContent =
      `${hands.length} HAND`;
  }


  // ==========================================================
  // RESET HANDS THAT DISAPPEARED
  // ==========================================================

  for (
    const side
    of [
      "Left",
      "Right",
    ]
  ) {

    if (
      !visibleHands.has(
        side
      )
    ) {

      clearHandPanel(
        side
      );


      previousFeatureStates[
        side
      ] =
        null;


      signalProcessors[
        side
      ].reset();
    }
  }


  // ==========================================================
  // CURRENT NORMALIZED INPUT DATA
  // ==========================================================

  const currentData =
    [];


  for (
    const hand
    of hands
  ) {

    const {

      label,

      confidence,

      landmarks,

    } = hand;


    // --------------------------------------------------------
    // 1. RAW FEATURE EXTRACTION
    // --------------------------------------------------------

    const rawFeatures =
      extractHandFeatures(

        landmarks,

        previousFeatureStates[
          label
        ] ?? null
      );


    if (
      !rawFeatures
    ) {

      continue;
    }


    previousFeatureStates[
      label
    ] =
      rawFeatures.state;


    // --------------------------------------------------------
    // 2. SIGNAL PROCESSING
    // --------------------------------------------------------

    const processor =
      signalProcessors[
        label
      ];


    if (
      !processor
    ) {

      continue;
    }


    const features =
      processor.process(
        rawFeatures
      );


    if (
      !features
    ) {

      continue;
    }


    // --------------------------------------------------------
    // 3. DRAW CV SKELETON
    // --------------------------------------------------------

    drawHandSkeleton(
      landmarks,
      label
    );


    // --------------------------------------------------------
    // 4. UPDATE TECHNICAL DATA UI
    // --------------------------------------------------------

    if (
      label === "Left" ||
      label === "Right"
    ) {

      updateHandPanel(

        label,

        features,

        confidence
      );
    }


    // --------------------------------------------------------
    // 5. NORMALIZED CROSS-MODAL INPUT
    // --------------------------------------------------------

    currentData.push({

      label,

      confidence,


      // Continuous features

      x:
        features.x,

      y:
        features.y,

      pinch:
        features.pinch,

      openness:
        features.openness,

      speed:
        features.speed,


      // Gesture event states

      pinchActive:
        features.pinchActive,

      pinchStarted:
        features.pinchStarted,

      pinchEnded:
        features.pinchEnded,
    });
  }


  // ==========================================================
  // CV OUTPUT
  // ==========================================================

  window.crossModalHands =
    currentData;


  // ==========================================================
  // PERSONAL MAPPING ENGINE
  //
  // Gesture signals are translated into user-defined
  // music / visual / haptic semantics here.
  // ==========================================================

  const mappingOutput =
    mappingEngine.resolve(
      currentData
    );


  window.crossModalMapping = {

    profile:
      mappingEngine.getProfile(),

    output:
      mappingOutput,
  };


  // ==========================================================
  // MAPPING STUDIO
  // ==========================================================

  mappingUI.updateLiveValues(
    mappingOutput
  );


  // ==========================================================
  // MUSIC OUTPUT
  // ==========================================================

  musicEngine.process(
    mappingOutput
  );


  // ==========================================================
  // VISUAL OUTPUT
  // ==========================================================

  visualEngine.process(
    mappingOutput
  );


  // ==========================================================
  // DEBUG AUDIO STATE
  // ==========================================================

  window.crossModalAudio =
    musicEngine.getState();
}


// ============================================================
// PARSE MEDIAPIPE RESULT
// ============================================================

function getDetectedHands(
  result
) {

  const hands =
    [];


  if (
    !result.landmarks ||
    result.landmarks.length === 0
  ) {

    return hands;
  }


  for (
    let i = 0;
    i < result.landmarks.length;
    i++
  ) {

    const landmarks =
      result.landmarks[
        i
      ];


    const handedness =
      result.handedness
        ?.[i]
        ?.[0];


    const detectedLabel =
      handedness
        ?.categoryName;


    const label =

      detectedLabel === "Left" ||
      detectedLabel === "Right"

        ? detectedLabel

        : `Hand-${i + 1}`;


    const confidence =
      handedness
        ?.score ?? 0;


    hands.push({

      label,

      confidence,

      landmarks,
    });
  }


  return hands;
}


// ============================================================
// UPDATE ONE HAND PANEL
// ============================================================

function updateHandPanel(
  side,
  features,
  confidence
) {

  const ui =
    handUI[
      side
    ];


  if (
    !ui
  ) {

    return;
  }


  ui.panel
    .classList
    .add(
      "detected"
    );


  ui.presence.textContent =
    "LIVE";


  ui.confidence.textContent =
    `${Math.round(
      confidence * 100
    )}%`;


  setMetric(

    ui.xValue,

    ui.xBar,

    features.x
  );


  setMetric(

    ui.yValue,

    ui.yBar,

    features.y
  );


  setMetric(

    ui.pinchValue,

    ui.pinchBar,

    features.pinch
  );


  setMetric(

    ui.openValue,

    ui.openBar,

    features.openness
  );


  setMetric(

    ui.speedValue,

    ui.speedBar,

    features.speed
  );


  // ==========================================================
  // PINCH STATE
  // ==========================================================

  if (
    features.pinchActive
  ) {

    ui.panel
      .classList
      .add(
        "pinching"
      );

  }

  else {

    ui.panel
      .classList
      .remove(
        "pinching"
      );
  }
}


// ============================================================
// CLEAR ONE HAND PANEL
// ============================================================

function clearHandPanel(
  side
) {

  const ui =
    handUI[
      side
    ];


  if (
    !ui
  ) {

    return;
  }


  ui.panel
    .classList
    .remove(
      "detected"
    );


  ui.panel
    .classList
    .remove(
      "pinching"
    );


  ui.presence.textContent =
    "WAITING";


  ui.confidence.textContent =
    "—";


  const metrics = [

    [
      ui.xValue,
      ui.xBar,
    ],

    [
      ui.yValue,
      ui.yBar,
    ],

    [
      ui.pinchValue,
      ui.pinchBar,
    ],

    [
      ui.openValue,
      ui.openBar,
    ],

    [
      ui.speedValue,
      ui.speedBar,
    ],
  ];


  for (
    const [
      valueElement,
      barElement,
    ]
    of metrics
  ) {

    valueElement.textContent =
      "—";


    barElement.style.width =
      "0%";
  }
}


// ============================================================
// FEATURE BAR
// ============================================================

function setMetric(
  valueElement,
  barElement,
  value
) {

  const normalized =
    Math.max(

      0,

      Math.min(
        1,
        value
      )
    );


  valueElement.textContent =
    normalized.toFixed(
      2
    );


  barElement.style.width =
    `${normalized * 100}%`;
}


// ============================================================
// DRAW HAND SKELETON
// ============================================================

function drawHandSkeleton(
  landmarks,
  label
) {

  const connections = [

    // Thumb
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],

    // Index
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],

    // Middle
    [5, 9],
    [9, 10],
    [10, 11],
    [11, 12],

    // Ring
    [9, 13],
    [13, 14],
    [14, 15],
    [15, 16],

    // Pinky
    [13, 17],
    [17, 18],
    [18, 19],
    [19, 20],

    // Palm
    [0, 17],
  ];


  const color =

    label === "Left"

      ? "#5F9FFF"

      : "#FF7746";


  // ==========================================================
  // LINES
  // ==========================================================

  ctx.strokeStyle =
    color;


  ctx.lineWidth =
    3;


  for (
    const [
      start,
      end,
    ]
    of connections
  ) {

    const a =
      landmarks[
        start
      ];


    const b =
      landmarks[
        end
      ];


    ctx.beginPath();


    ctx.moveTo(

      a.x *
        canvas.width,

      a.y *
        canvas.height
    );


    ctx.lineTo(

      b.x *
        canvas.width,

      b.y *
        canvas.height
    );


    ctx.stroke();
  }


  // ==========================================================
  // LANDMARK POINTS
  // ==========================================================

  landmarks.forEach(

    (
      point,
      index
    ) => {

      const interactionPoint =

        index === 4 ||
        index === 8;


      ctx.beginPath();


      ctx.arc(

        point.x *
          canvas.width,

        point.y *
          canvas.height,

        interactionPoint
          ? 8
          : 5,

        0,

        Math.PI * 2
      );


      ctx.fillStyle =

        interactionPoint

          ? "#FFFFFF"

          : color;


      ctx.fill();


      if (
        interactionPoint
      ) {

        ctx.strokeStyle =
          color;


        ctx.lineWidth =
          2;


        ctx.stroke();
      }
    }
  );
}


// ============================================================
// CAMERA CANVAS RESIZE
// ============================================================

function resizeCanvas() {

  if (
    !video.videoWidth ||
    !video.videoHeight
  ) {

    return;
  }


  if (
    canvas.width !==
      video.videoWidth ||

    canvas.height !==
      video.videoHeight
  ) {

    canvas.width =
      video.videoWidth;


    canvas.height =
      video.videoHeight;
  }
}