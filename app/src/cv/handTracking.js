import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";


export async function createHandTracker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const handLandmarker =
    await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },

        runningMode: "VIDEO",
        numHands: 2,

        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }
    );

  return handLandmarker;
}



export function extractHandFeatures(
  landmarks,
  previousState = null
) {
  if (!landmarks) {
    return null;
  }

  // ----------------------------
  // 1. Palm center
  // ----------------------------

  const palmIndices = [0, 5, 9, 13, 17];

  const palm = palmIndices.reduce(
    (sum, index) => {
      return {
        x: sum.x + landmarks[index].x,
        y: sum.y + landmarks[index].y,
      };
    },
    { x: 0, y: 0 }
  );

  palm.x /= palmIndices.length;
  palm.y /= palmIndices.length;


  // ----------------------------
  // 2. X / Y position
  // ----------------------------

  const x = clamp(
    palm.x,
    0,
    1
  );

  // MediaPipe:
  // top = 0
  // bottom = 1
  //
  // We invert it so:
  // hand higher = larger value

  const y = clamp(
    1 - palm.y,
    0,
    1
  );


  // ----------------------------
  // 3. Pinch
  // thumb tip = 4
  // index tip = 8
  // ----------------------------

  const thumbTip =
    landmarks[4];

  const indexTip =
    landmarks[8];

  const pinchDistance =
    distance(
      thumbTip,
      indexTip
    );


  // Normalize using palm width
  const palmWidth =
    distance(
      landmarks[5],
      landmarks[17]
    ) || 0.1;


  const normalizedPinch =
    pinchDistance /
    palmWidth;


  // 1 = tightly pinched
  // 0 = open

  const pinch =
    clamp(
      1 - normalizedPinch,
      0,
      1
    );


  // ----------------------------
  // 4. Hand openness
  // ----------------------------

  const fingertips = [
    landmarks[8],
    landmarks[12],
    landmarks[16],
    landmarks[20],
  ];


  const averageTipDistance =
    fingertips.reduce(
      (sum, tip) =>
        sum +
        distance(
          tip,
          landmarks[0]
        ),
      0
    ) /
    fingertips.length;


  const palmLength =
    distance(
      landmarks[0],
      landmarks[9]
    ) || 0.1;


  const openness =
    clamp(
      (
        averageTipDistance /
        palmLength -
        1
      ) / 1.5,
      0,
      1
    );


  // ----------------------------
  // 5. Movement energy
  // ----------------------------

  const now =
    performance.now();

  let speed = 0;


  if (previousState) {

    const deltaTime =
      Math.max(
        now -
        previousState.time,
        1
      ) / 1000;


    const movement =
      distance(
        palm,
        previousState.palm
      );


    speed =
      clamp(
        movement /
        deltaTime /
        2,
        0,
        1
      );
  }


  return {
    x,
    y,
    pinch,
    openness,
    speed,

    state: {
      palm,
      time: now,
    },
  };
}



function distance(a, b) {

  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2
  );
}



function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}