import "./style.css";

import {
  createHandTracker,
  extractHandFeatures,
} from "./cv/handTracking.js";


// ============================================================
// DOM
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


// Current single feature panel.
// We will replace this with independent Left / Right panels
// in the next development step.

const xValue =
  document.querySelector("#xValue");

const yValue =
  document.querySelector("#yValue");

const pinchValue =
  document.querySelector("#pinchValue");

const openValue =
  document.querySelector("#openValue");

const speedValue =
  document.querySelector("#speedValue");

const xBar =
  document.querySelector("#xBar");

const yBar =
  document.querySelector("#yBar");

const pinchBar =
  document.querySelector("#pinchBar");

const openBar =
  document.querySelector("#openBar");

const speedBar =
  document.querySelector("#speedBar");


// ============================================================
// STATE
// ============================================================

let handTracker = null;

let previousVideoTime = -1;


// Each hand needs its own previous state.
//
// This is essential for movement-energy calculation.
// Otherwise one hand's movement would contaminate
// the speed value of the other hand.

const previousFeatureStates = {
  Left: null,
  Right: null,
};


// ============================================================
// START
// ============================================================

startButton.addEventListener(
  "click",
  startSession
);


async function startSession() {

  startButton.disabled = true;

  startButton.textContent =
    "INITIALIZING...";

  statusElement.textContent =
    "LOADING";


  try {

    // --------------------------------------------------------
    // Initialize MediaPipe
    // --------------------------------------------------------

    handTracker =
      await createHandTracker();


    // --------------------------------------------------------
    // Request webcam
    // --------------------------------------------------------

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

          audio: false,
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


    // --------------------------------------------------------
    // Start CV loop
    // --------------------------------------------------------

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
// PROCESS RESULT
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


  // ----------------------------------------------------------
  // No hand
  // ----------------------------------------------------------

  if (hands.length === 0) {

    landmarkCount.textContent =
      "0";

    handStatus.textContent =
      "NOT DETECTED";


    previousFeatureStates.Left =
      null;

    previousFeatureStates.Right =
      null;


    clearFeatureUI();

    return;
  }


  // ----------------------------------------------------------
  // Basic tracking information
  // ----------------------------------------------------------

  landmarkCount.textContent =
    String(
      hands.length * 21
    );


  if (hands.length === 2) {

    handStatus.textContent =
      "LEFT + RIGHT";

  }

  else {

    handStatus.textContent =
      hands[0].label.toUpperCase();
  }


  // ----------------------------------------------------------
  // Determine which hands currently exist
  // ----------------------------------------------------------

  const visibleLabels =
    new Set(
      hands.map(
        (hand) =>
          hand.label
      )
    );


  if (
    !visibleLabels.has("Left")
  ) {

    previousFeatureStates.Left =
      null;
  }


  if (
    !visibleLabels.has("Right")
  ) {

    previousFeatureStates.Right =
      null;
  }


  // ----------------------------------------------------------
  // Process every detected hand independently
  // ----------------------------------------------------------

  const handData = [];


  for (const hand of hands) {

    const {
      label,
      landmarks,
      confidence,
    } = hand;


    const previousState =
      previousFeatureStates[label]
      ?? null;


    const features =
      extractHandFeatures(
        landmarks,
        previousState
      );


    if (!features) {
      continue;
    }


    previousFeatureStates[label] =
      features.state;


    drawHandSkeleton(
      landmarks,
      label
    );


    handData.push({
      label,
      confidence,
      features,
      landmarks,
    });
  }


  // ----------------------------------------------------------
  // TEMPORARY UI
  //
  // Current HTML still contains only one feature panel.
  // Until we build the dual-hand interface, show one hand here.
  //
  // Priority:
  // Left -> Right -> first detected hand
  // ----------------------------------------------------------

  const primaryHand =
    handData.find(
      (hand) =>
        hand.label === "Left"
    )
    ??
    handData.find(
      (hand) =>
        hand.label === "Right"
    )
    ??
    handData[0];


  if (primaryHand) {

    updateFeatureUI(
      primaryHand.features
    );
  }


  // ----------------------------------------------------------
  // Development access
  //
  // Makes current hand data available in DevTools:
  //
  // window.crossModalHands
  //
  // This will later be replaced by the Mapping Engine.
  // ----------------------------------------------------------

  window.crossModalHands =
    handData.map(
      ({
        label,
        confidence,
        features,
      }) => ({
        label,
        confidence,

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
      })
    );
}


// ============================================================
// HAND RESULT PARSER
// ============================================================

function getDetectedHands(
  result
) {

  const hands = [];


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
      result.landmarks[i];


    const handedness =
      result.handedness?.[i]?.[0];


    const detectedLabel =
      handedness?.categoryName;


    let label;


    if (
      detectedLabel === "Left" ||
      detectedLabel === "Right"
    ) {

      label =
        detectedLabel;

    }

    else {

      label =
        `Hand-${i + 1}`;
    }


    const confidence =
      handedness?.score ?? 0;


    hands.push({
      label,
      confidence,
      landmarks,
    });
  }


  return hands;
}


// ============================================================
// DRAW HAND
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


  const handColor =
    label === "Left"
      ? "#5F9FFF"
      : "#FF7746";


  // ----------------------------------------------------------
  // Connections
  // ----------------------------------------------------------

  ctx.lineWidth =
    3;

  ctx.strokeStyle =
    handColor;


  for (
    const [start, end]
    of connections
  ) {

    const a =
      landmarks[start];

    const b =
      landmarks[end];


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


  // ----------------------------------------------------------
  // Landmarks
  // ----------------------------------------------------------

  landmarks.forEach(
    (point, index) => {

      ctx.beginPath();


      const isInteractionPoint =
        index === 4 ||
        index === 8;


      ctx.arc(
        point.x *
          canvas.width,

        point.y *
          canvas.height,

        isInteractionPoint
          ? 8
          : 5,

        0,

        Math.PI * 2
      );


      // Thumb tip + index tip are highlighted
      // because they form the pinch gesture.

      ctx.fillStyle =
        isInteractionPoint
          ? "#FFFFFF"
          : handColor;


      ctx.fill();


      // Small border around interaction points

      if (isInteractionPoint) {

        ctx.strokeStyle =
          handColor;

        ctx.lineWidth =
          2;

        ctx.stroke();
      }
    }
  );
}


// ============================================================
// CURRENT FEATURE UI
// ============================================================

function updateFeatureUI(
  features
) {

  updateFeature(
    xValue,
    xBar,
    features.x
  );


  updateFeature(
    yValue,
    yBar,
    features.y
  );


  updateFeature(
    pinchValue,
    pinchBar,
    features.pinch
  );


  updateFeature(
    openValue,
    openBar,
    features.openness
  );


  updateFeature(
    speedValue,
    speedBar,
    features.speed
  );
}


function updateFeature(
  valueElement,
  barElement,
  value
) {

  if (
    !valueElement ||
    !barElement
  ) {

    return;
  }


  const safeValue =
    Math.max(
      0,
      Math.min(
        1,
        value
      )
    );


  valueElement.textContent =
    safeValue.toFixed(2);


  barElement.style.width =
    `${safeValue * 100}%`;
}


function clearFeatureUI() {

  const items = [

    [
      xValue,
      xBar,
    ],

    [
      yValue,
      yBar,
    ],

    [
      pinchValue,
      pinchBar,
    ],

    [
      openValue,
      openBar,
    ],

    [
      speedValue,
      speedBar,
    ],
  ];


  for (
    const [
      valueElement,
      barElement,
    ]
    of items
  ) {

    if (valueElement) {

      valueElement.textContent =
        "—";
    }


    if (barElement) {

      barElement.style.width =
        "0%";
    }
  }
}


// ============================================================
// CANVAS
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