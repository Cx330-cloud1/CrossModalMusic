import "./style.css";

import {
  createHandTracker,
} from "./cv/handTracking.js";


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


let handTracker = null;

let previousVideoTime = -1;


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


    requestAnimationFrame(
      detectionLoop
    );

  }

  catch (error) {

    console.error(error);

    statusElement.textContent =
      "ERROR";

    cameraMessage.textContent =
      "Unable to initialize camera";

    startButton.disabled =
      false;

    startButton.textContent =
      "TRY AGAIN";
  }
}


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


    drawHand(result);
  }


  requestAnimationFrame(
    detectionLoop
  );
}


function drawHand(result) {

  resizeCanvas();


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  if (
    !result.landmarks ||
    result.landmarks.length === 0
  ) {

    landmarkCount.textContent =
      "0";

    handStatus.textContent =
      "NOT DETECTED";

    return;
  }


  const landmarks =
    result.landmarks[0];


  landmarkCount.textContent =
    landmarks.length;

  handStatus.textContent =
    "DETECTED";


  const connections = [

    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],

    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],

    [5, 9],
    [9, 10],
    [10, 11],
    [11, 12],

    [9, 13],
    [13, 14],
    [14, 15],
    [15, 16],

    [13, 17],
    [17, 18],
    [18, 19],
    [19, 20],

    [0, 17],
  ];


  ctx.strokeStyle =
    "#5F9FFF";

  ctx.lineWidth =
    3;


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
      a.x * canvas.width,
      a.y * canvas.height
    );

    ctx.lineTo(
      b.x * canvas.width,
      b.y * canvas.height
    );

    ctx.stroke();
  }


  landmarks.forEach(
    (point, index) => {

      ctx.beginPath();

      ctx.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        index === 4 ||
        index === 8
          ? 8
          : 5,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        index === 4 ||
        index === 8
          ? "#FF7746"
          : "#FFFFFF";


      ctx.fill();
    }
  );
}


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