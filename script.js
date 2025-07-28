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
const modeIcon = document.getElementById("modeIcon");

let painting = false;
let currentColor = "#000000";
let currentSize = 5;
let currentTool = "brush";
let symmetry = false;
let history = [];
let historyStep = -1;
let replaying = false;
let isDark = false;

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

function HSVtoRGB(h, s, v) {
  let c = v * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = v - c;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  r = Math.floor((r + m) * 255);
  g = Math.floor((g + m) * 255);
  b = Math.floor((b + m) * 255);

  return `rgb(${r},${g},${b})`;
}

let hue = 0;

function startDrawing(e) {
  if (replaying) return;
  painting = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
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
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (symmetry) {
      ctx.lineTo(canvas.width - x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(canvas.width - x, y);
    }
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = currentTool === "rainbow" ? HSVtoRGB(hue, 1, 1) : currentColor;
    if (currentTool === "rainbow") hue = (hue + 5) % 360;

    if (currentTool === "spray") {
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
      return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (symmetry) {
      ctx.beginPath();
      ctx.moveTo(canvas.width - x, y);
      ctx.lineTo(canvas.width - x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
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

function uploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveHistory();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function setDarkMode(dark) {
  isDark = dark;
  document.body.classList.toggle("light", dark);
  document.body.classList.toggle("dark", !dark);
  modeIcon.src = dark ? "icons/dark.png" : "icons/light.png";
}

function setActiveTool(button) {
  [brushBtn, rainbowBtn, sprayBtn, eraserBtn].forEach(btn =>
    btn.classList.remove("active")
  );
  button.classList.add("active");
}

// Event listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);
canvas.addEventListener("mousemove", draw);
window.addEventListener("resize", resizeCanvas);
darkModeToggle.addEventListener("click", () => setDarkMode(!isDark));
colorPicker.addEventListener("input", (e) => {
  currentColor = e.target.value;
  colorPicker.style.backgroundColor = currentColor;
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

// Initialize
window.onload = () => {
  resizeCanvas();
  currentColor = colorPicker.value;
  colorPicker.style.backgroundColor = currentColor;
  setDarkMode(false);
  saveHistory();
  setActiveTool(brushBtn);
};
