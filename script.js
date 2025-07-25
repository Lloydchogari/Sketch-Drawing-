const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const brushBtn = document.getElementById("brushBtn");
const rainbowBtn = document.getElementById("rainbowBtn");
const sprayBtn = document.getElementById("sprayBtn");
const eraserBtn = document.getElementById("eraserBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const symmetryBtn = document.getElementById("symmetryBtn");
const imgUpload = document.getElementById("imgUpload");
const replayBtn = document.getElementById("replayBtn");
const darkModeToggle = document.getElementById("darkModeToggle");

let painting = false;
let currentColor = "#000000";
let currentSize = 5;
let currentTool = "brush"; // brush, eraser, rainbow, spray
let symmetry = false;

let history = [];
let historyStep = -1;

let replaying = false;

// Setup canvas size and scale for crispness
function resizeCanvas() {
  canvas.width = window.innerWidth - 260;
  canvas.height = window.innerHeight;
  redrawHistory();
}

function redrawHistory() {
  if (historyStep >= 0) {
    const img = new Image();
    img.src = history[historyStep];
    img.onload = () => ctx.drawImage(img, 0, 0);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Utilities for color generation (rainbow brush)
function HSVtoRGB(h, s, v) {
  let c = v * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = v - c;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {r = c; g = x; b = 0;}
  else if (h >= 60 && h < 120) {r = x; g = c; b = 0;}
  else if (h >= 120 && h < 180) {r = 0; g = c; b = x;}
  else if (h >= 180 && h < 240) {r = 0; g = x; b = c;}
  else if (h >= 240 && h < 300) {r = x; g = 0; b = c;}
  else if (h >= 300 && h < 360) {r = c; g = 0; b = x;}

  r = Math.floor((r + m) * 255);
  g = Math.floor((g + m) * 255);
  b = Math.floor((b + m) * 255);

  return `rgb(${r},${g},${b})`;
}

// Track hue for rainbow brush
let hue = 0;

function startDrawing(e) {
  if (replaying) return;
  painting = true;
  ctx.beginPath();
  draw(e);
}

function stopDrawing() {
  if (replaying) return;
  painting = false;
  ctx.closePath();
  saveHistory();
}

function draw(e) {
  if (!painting) return;

  let x = e.offsetX;
  let y = e.offsetY;

  if (currentTool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    if (symmetry) {
      ctx.beginPath();
      ctx.lineTo(canvas.width - x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  } else if (currentTool === "brush") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    if (symmetry) {
      ctx.beginPath();
      ctx.moveTo(canvas.width - x, y);
      ctx.lineTo(canvas.width - x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  } else if (currentTool === "rainbow") {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = HSVtoRGB(hue, 1, 1);
    hue += 5;
    if (hue >= 360) hue = 0;
    ctx.lineTo(x, y);
    ctx.stroke();
    if (symmetry) {
      ctx.beginPath();
      ctx.moveTo(canvas.width - x, y);
      ctx.lineTo(canvas.width - x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  } else if (currentTool === "spray") {
    ctx.globalCompositeOperation = "source-over";
    let density = 30;
    for (let i = 0; i < density; i++) {
      let offsetX = x + (Math.random() - 0.5) * currentSize * 2;
      let offsetY = y + (Math.random() - 0.5) * currentSize * 2;
      ctx.fillStyle = currentColor;
      ctx.fillRect(offsetX, offsetY, 1, 1);
      if (symmetry) {
        let symX = canvas.width - offsetX;
        ctx.fillRect(symX, offsetY, 1, 1);
      }
    }
  }
}

function saveHistory() {
  if (replaying) return;
  if (historyStep < history.length - 1) {
    history = history.slice(0, historyStep + 1);
  }
  history.push(canvas.toDataURL());
  historyStep++;
}

function undo() {
  if (replaying) return;
  if (historyStep > 0) {
    historyStep--;
    const img = new Image();
    img.src = history[historyStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  }
}

function redo() {
  if (replaying) return;
  if (historyStep < history.length - 1) {
    historyStep++;
    const img = new Image();
    img.src = history[historyStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  }
}

function clearCanvas() {
  if (replaying) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  saveHistory();
}

function toggleSymmetry() {
  symmetry = !symmetry;
  symmetryBtn.textContent = symmetry ? "Symmetry ON" : "Toggle Symmetry";
}

// Upload image and draw on it
function uploadImage(e) {
  if (!e.target.files || e.target.files.length === 0) return;
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw image centered
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      saveHistory();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// Replay drawing history with a delay
function replayDrawing() {
  if (replaying || history.length === 0) return;
  replaying = true;
  let step = 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const interval = setInterval(() => {
    const img = new Image();
    img.src = history[step];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    step++;
    if (step >= history.length) {
      clearInterval(interval);
      replaying = false;
    }
  }, 500);
}

// Setup listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);
canvas.addEventListener("mousemove", draw);

window.addEventListener("resize", resizeCanvas);

colorPicker.addEventListener("input", (e) => {
  currentColor = e.target.value;
  if (currentTool === "brush") ctx.strokeStyle = currentColor;
});

brushSize.addEventListener("input", (e) => {
  currentSize = e.target.value;
});

brushBtn.addEventListener("click", () => {
  currentTool = "brush";
  setActiveTool(brushBtn);
});

rainbowBtn.addEventListener("click", () => {
  currentTool = "rainbow";
  setActiveTool(rainbowBtn);
});

sprayBtn.addEventListener("click", () => {
  currentTool = "spray";
  setActiveTool(sprayBtn);
});

eraserBtn.addEventListener("click", () => {
  currentTool = "eraser";
  setActiveTool(eraserBtn);
});

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);
clearBtn.addEventListener("click", clearCanvas);
symmetryBtn.addEventListener("click", toggleSymmetry);
imgUpload.addEventListener("change", uploadImage);
replayBtn.addEventListener("click", replayDrawing);

darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", darkModeToggle.checked);
  document.body.classList.toggle("light", !darkModeToggle.checked);
  // Update canvas bg on mode switch
  if (darkModeToggle.checked) {
    canvas.style.background = "#222";
  } else {
    canvas.style.background = "white";
  }
});

function setActiveTool(button) {
  [brushBtn, rainbowBtn, sprayBtn, eraserBtn].forEach(btn =>
    btn.classList.remove("active")
  );
  button.classList.add("active");
}

// Initialize
window.onload = () => {
  resizeCanvas();
  currentColor = colorPicker.value;
  document.body.classList.add("light");
  saveHistory();
  setActiveTool(brushBtn);
  canvas.style.background = "white";
};
