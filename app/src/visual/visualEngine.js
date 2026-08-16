// ============================================================
// CROSS-MODAL VISUAL ENGINE
//
// Mapping semantic output
//        ↓
// Rising Line / Pulse / Particles /
// Color Shift / Wave / Expansion
// ============================================================

export function createVisualEngine(
  canvas
) {

  if (!canvas) {

    return {
      start() {},
      process() {},
      clear() {},
    };
  }


  const ctx =
    canvas.getContext("2d");


  let running =
    false;


  let animationFrame =
    null;


  let width =
    0;


  let height =
    0;


  // ==========================================================
  // VISUAL STATE
  // ==========================================================

  const state = {

    line:
      0.5,

    colorShift:
      0.5,

    particleEnergy:
      0,

    wave:
      0,

    expansion:
      0,

    pulse:
      0,

    lastPulseValue:
      0,
  };


  // ==========================================================
  // PARTICLES
  // ==========================================================

  const particles =
    [];


  for (
    let i = 0;
    i < 60;
    i++
  ) {

    particles.push(
      createParticle()
    );
  }


  // ==========================================================
  // START
  // ==========================================================

  function start() {

    if (running) {
      return;
    }


    running =
      true;


    resize();


    window.addEventListener(
      "resize",
      resize
    );


    draw();
  }


  // ==========================================================
  // PROCESS MAPPING OUTPUT
  // ==========================================================

  function process(
    mappingOutput
  ) {

    if (
      !Array.isArray(
        mappingOutput
      )
    ) {

      return;
    }


    for (
      const output
      of mappingOutput
    ) {

      const target =
        output.targets
          ?.visual;


      if (
        !target?.enabled
      ) {

        continue;
      }


      const value =
        clamp01(
          Number(
            output.value
          )
        );


      switch (
        target.parameter
      ) {

        case "rising-line":

          state.line =
            value;

          break;


        case "color-shift":

          state.colorShift =
            value;

          break;


        case "particle-energy":

          state.particleEnergy =
            value;

          break;


        case "pulse":

          processPulse(
            output.ruleId,
            value
          );

          break;


        case "wave":

          state.wave =
            value;

          break;


        case "expansion":

          state.expansion =
            value;

          break;
      }
    }


    window.crossModalVisual = {
      ...state,
    };
  }


  // ==========================================================
  // PULSE EVENT
  // ==========================================================

  const previousPulseValues =
    new Map();


  function processPulse(
    ruleId,
    value
  ) {

    const previous =
      previousPulseValues.get(
        ruleId
      ) ?? 0;


    if (
      value >= 0.5 &&
      previous < 0.5
    ) {

      state.pulse =
        1;
    }


    previousPulseValues.set(
      ruleId,
      value
    );
  }


  // ==========================================================
  // DRAW LOOP
  // ==========================================================

  function draw() {

    if (!running) {
      return;
    }


    resize();


    ctx.clearRect(
      0,
      0,
      width,
      height
    );


    drawBackground();

    drawSpatialLine();

    drawWave();

    drawParticles();

    drawExpansion();

    drawPulse();


    // Decay event effects

    state.pulse *=
      0.90;


    animationFrame =
      requestAnimationFrame(
        draw
      );
  }


  // ==========================================================
  // BACKGROUND
  // ==========================================================

  function drawBackground() {

    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        width,
        height
      );


    const blueAlpha =
      0.08 +
      (
        1 -
        state.colorShift
      ) *
      0.12;


    const orangeAlpha =
      0.08 +
      state.colorShift *
      0.12;


    gradient.addColorStop(
      0,
      `rgba(95, 159, 255, ${blueAlpha})`
    );


    gradient.addColorStop(
      1,
      `rgba(255, 119, 70, ${orangeAlpha})`
    );


    ctx.fillStyle =
      gradient;


    ctx.fillRect(
      0,
      0,
      width,
      height
    );
  }


  // ==========================================================
  // RISING LINE
  // ==========================================================

  function drawSpatialLine() {

    const y =
      height -
      state.line *
      height;


    ctx.beginPath();


    for (
      let x = 0;
      x <= width;
      x += 8
    ) {

      const offset =
        Math.sin(
          x * 0.016 +
          performance.now() *
          0.001
        ) *
        12;


      const lineY =
        y +
        offset;


      if (x === 0) {

        ctx.moveTo(
          x,
          lineY
        );

      }

      else {

        ctx.lineTo(
          x,
          lineY
        );
      }
    }


    ctx.strokeStyle =
      "rgba(95, 159, 255, 0.92)";


    ctx.lineWidth =
      2.5;


    ctx.stroke();
  }


  // ==========================================================
  // WAVE
  // ==========================================================

  function drawWave() {

    if (
      state.wave <= 0.02
    ) {

      return;
    }


    const amplitude =
      10 +
      state.wave *
      55;


    ctx.beginPath();


    for (
      let x = 0;
      x <= width;
      x += 6
    ) {

      const y =
        height *
        0.72 +
        Math.sin(
          x * 0.028 +
          performance.now() *
          0.003
        ) *
        amplitude;


      if (x === 0) {

        ctx.moveTo(
          x,
          y
        );

      }

      else {

        ctx.lineTo(
          x,
          y
        );
      }
    }


    ctx.strokeStyle =
      "rgba(255, 119, 70, 0.65)";


    ctx.lineWidth =
      1.5;


    ctx.stroke();
  }


  // ==========================================================
  // PARTICLES
  // ==========================================================

  function drawParticles() {

    const energy =
      state.particleEnergy;


    for (
      const particle
      of particles
    ) {

      particle.x +=
        particle.vx *
        (
          0.3 +
          energy *
          2.5
        );


      particle.y +=
        particle.vy *
        (
          0.3 +
          energy *
          2.5
        );


      if (
        particle.x < 0 ||
        particle.x > 1
      ) {

        particle.vx *=
          -1;
      }


      if (
        particle.y < 0 ||
        particle.y > 1
      ) {

        particle.vy *=
          -1;
      }


      const x =
        particle.x *
        width;


      const y =
        particle.y *
        height;


      const radius =
        1.5 +
        energy *
        5 *
        particle.scale;


      ctx.beginPath();


      ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        particle.side === "blue"

          ? `rgba(
              95,
              159,
              255,
              ${0.12 + energy * 0.55}
            )`

          : `rgba(
              255,
              119,
              70,
              ${0.12 + energy * 0.55}
            )`;


      ctx.fill();
    }
  }


  // ==========================================================
  // EXPANSION
  // ==========================================================

  function drawExpansion() {

    if (
      state.expansion <= 0.02
    ) {

      return;
    }


    const maxRadius =
      Math.min(
        width,
        height
      ) *
      0.42;


    const radius =
      40 +
      state.expansion *
      maxRadius;


    ctx.beginPath();


    ctx.arc(
      width / 2,
      height / 2,
      radius,
      0,
      Math.PI * 2
    );


    ctx.strokeStyle =
      `rgba(
        95,
        159,
        255,
        ${0.15 + state.expansion * 0.32}
      )`;


    ctx.lineWidth =
      2;


    ctx.stroke();
  }


  // ==========================================================
  // PULSE
  // ==========================================================

  function drawPulse() {

    if (
      state.pulse <
      0.01
    ) {

      return;
    }


    const radius =
      (
        1 -
        state.pulse
      ) *
      Math.min(
        width,
        height
      ) *
      0.35 +
      25;


    ctx.beginPath();


    ctx.arc(
      width / 2,
      height / 2,
      radius,
      0,
      Math.PI * 2
    );


    ctx.strokeStyle =
      `rgba(
        255,
        119,
        70,
        ${state.pulse * 0.9}
      )`;


    ctx.lineWidth =
      3;


    ctx.stroke();
  }


  // ==========================================================
  // RESIZE
  // ==========================================================

  function resize() {

    const rect =
      canvas
        .getBoundingClientRect();


    const pixelRatio =
      window.devicePixelRatio ||
      1;


    const nextWidth =
      Math.max(
        1,
        Math.floor(
          rect.width *
          pixelRatio
        )
      );


    const nextHeight =
      Math.max(
        1,
        Math.floor(
          rect.height *
          pixelRatio
        )
      );


    if (
      canvas.width !==
        nextWidth ||
      canvas.height !==
        nextHeight
    ) {

      canvas.width =
        nextWidth;


      canvas.height =
        nextHeight;


      width =
        nextWidth;


      height =
        nextHeight;
    }
  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  function clear() {

    state.line =
      0.5;

    state.colorShift =
      0.5;

    state.particleEnergy =
      0;

    state.wave =
      0;

    state.expansion =
      0;

    state.pulse =
      0;
  }


  start();


  return {

    start,

    process,

    clear,
  };
}


// ============================================================
// PARTICLE
// ============================================================

function createParticle() {

  return {

    x:
      Math.random(),

    y:
      Math.random(),

    vx:
      (
        Math.random() -
        0.5
      ) *
      0.004,

    vy:
      (
        Math.random() -
        0.5
      ) *
      0.004,

    scale:
      0.5 +
      Math.random(),

    side:
      Math.random() >
      0.5
        ? "blue"
        : "orange",
  };
}


// ============================================================
// HELPERS
// ============================================================

function clamp01(
  value
) {

  if (
    !Number.isFinite(
      value
    )
  ) {

    return 0;
  }


  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}