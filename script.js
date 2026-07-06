// ── Element refs ──
const workspace       = document.querySelector("#workspace");
const note            = document.querySelector("#note");
const notePreview     = document.querySelector("#notePreview");
const finishButton    = document.querySelector("#finishButton");
const mirrorBtn       = document.querySelector("#mirrorBtn");
const rotateBtn       = document.querySelector("#rotateBtn");
const deleteBtn       = document.querySelector("#deleteBtn");
const shareLink       = document.querySelector("#shareLink");
const copyLinkBtn     = document.querySelector("#copyLinkBtn");
const copyStatus      = document.querySelector("#copyStatus");
const finalBouquetImage = document.querySelector("#finalBouquetImage");
const finalNoteImage  = document.querySelector("#finalNoteImage");
const bouquetDownload = document.querySelector("#bouquetDownload");
const noteDownload    = document.querySelector("#noteDownload");
const startOverBtn    = document.querySelector("#startOverBtn");

let selectedItem = null;
let draggedItem  = null;
let offsetX = 0, offsetY = 0;
let topLayer = 1;

// ── Sound ──
const buttonSound = new Audio('mixkit-pen-click-and-release-1115.wav');
function playSound() {
    buttonSound.currentTime = 0;
    buttonSound.play().catch(() => {});
}

// ════════════════════════════════
//  SCREEN SWITCHING
// ════════════════════════════════
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// ── Choice screen buttons ──
document.getElementById("goToBuilder").addEventListener("click", () => {
    showScreen("screen-builder");
    showStep("step1");
    playSound();
});

document.getElementById("goToDraw").addEventListener("click", () => {
    showScreen("screen-draw");
    playSound();
});

document.getElementById("backFromDraw").addEventListener("click", () => {
    showScreen("screen-choice");
});

document.getElementById("startOverBtn").addEventListener("click", () => {
    showScreen("screen-choice");
    // reset workspace
    workspace.querySelectorAll(".placed-item").forEach(i => i.remove());
    document.querySelector(".workspace-tools").style.display = "flex";
    if (note) note.value = "";
    if (notePreview) notePreview.textContent = "Your note will appear here.";
    showStep("step1");
});

// ════════════════════════════════
//  STEP SWITCHING (inside builder)
// ════════════════════════════════
function showStep(stepId) {
    document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
    const target = document.getElementById(stepId);
    if (target) target.classList.add("active");
}

// next buttons
document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
        showStep(btn.dataset.next);
        playSound();
    });
});

// back buttons
document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => {
        showStep(btn.dataset.back);
    });
});

// ════════════════════════════════
//  FLOWER / BOW OPTIONS
// ════════════════════════════════
document.querySelectorAll("[data-flower], [data-bow]").forEach(btn => {
    btn.addEventListener("click", () => {
        const src  = btn.dataset.flower || btn.dataset.bow;
        const type = btn.dataset.flower ? "flower" : "bow";
        addItemToWorkspace(src, type);
        playSound();
    });
});

// ════════════════════════════════
//  WORKSPACE TOOLS
// ════════════════════════════════
if (mirrorBtn) mirrorBtn.addEventListener("click", () => {
    if (!selectedItem) return;
    selectedItem.dataset.mirrored = String(selectedItem.dataset.mirrored !== "true");
    updateTransform(selectedItem);
});

if (rotateBtn) rotateBtn.addEventListener("click", () => {
    if (!selectedItem) return;
    selectedItem.dataset.rotation = String((Number(selectedItem.dataset.rotation || 0) + 15) % 360);
    updateTransform(selectedItem);
});

if (deleteBtn) deleteBtn.addEventListener("click", () => {
    if (!selectedItem) return;
    selectedItem.remove();
    selectedItem = null;
});

// Deselect on empty click
document.addEventListener("click", e => {
    if (!e.target.closest(".placed-item")) {
        document.querySelectorAll(".placed-item").forEach(i => i.classList.remove("selected"));
        selectedItem = null;
    }
});

// ── Note preview ──
if (note) note.addEventListener("input", () => {
    if (notePreview) notePreview.textContent = note.value.trim() || "Your note will appear here.";
});

// ── Finish button ──
if (finishButton) finishButton.addEventListener("click", createFinalBouquet);

// ── Copy link ──
if (copyLinkBtn) copyLinkBtn.addEventListener("click", () => {
    if (!shareLink) return;
    shareLink.select();
    navigator.clipboard.writeText(shareLink.value)
        .then(() => { if (copyStatus) copyStatus.textContent = "Link copied! 🎉"; })
        .catch(() => { document.execCommand("copy"); if (copyStatus) copyStatus.textContent = "Link copied!"; });
});

// ════════════════════════════════
//  DRAG & DROP
// ════════════════════════════════
function addItemToWorkspace(src, type) {
    if (!src || !workspace) return;
    const item = document.createElement("img");
    const count = workspace.querySelectorAll(".placed-item").length;

    item.src = src;
    item.className = "placed-item";
    item.draggable = false;
    item.dataset.mirrored = "false";
    item.dataset.rotation = "0";
    item.dataset.type = type;
    item.style.left = `${80 + count * 18}px`;
    item.style.top  = `${80 + count * 14}px`;
    item.style.zIndex = String(topLayer++);
    if (type === "bow") item.style.width = "130px";

    item.addEventListener("pointerdown", startDrag);
    item.addEventListener("click", selectItem);
    workspace.appendChild(item);
    selectItem({ currentTarget: item });
}

function selectItem(e) {
    document.querySelectorAll(".placed-item").forEach(i => i.classList.remove("selected"));
    selectedItem = e.currentTarget;
    selectedItem.classList.add("selected");
    selectedItem.style.zIndex = String(topLayer++);
}

function updateTransform(item) {
    const m = item.dataset.mirrored === "true" ? -1 : 1;
    const r = Number(item.dataset.rotation || 0);
    item.style.transform = `scaleX(${m}) rotate(${r}deg)`;
}

function startDrag(e) {
    draggedItem = e.currentTarget;
    selectItem(e);
    const rect = draggedItem.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    draggedItem.setPointerCapture(e.pointerId);
    draggedItem.addEventListener("pointermove", onDrag);
    draggedItem.addEventListener("pointerup",   stopDrag);
    draggedItem.addEventListener("pointercancel", stopDrag);
}

function onDrag(e) {
    if (!draggedItem || !workspace) return;
    const wr = workspace.getBoundingClientRect();
    let x = e.clientX - wr.left - offsetX;
    let y = e.clientY - wr.top  - offsetY;
    x = Math.max(0, Math.min(x, workspace.clientWidth  - draggedItem.offsetWidth));
    y = Math.max(0, Math.min(y, workspace.clientHeight - draggedItem.offsetHeight));
    draggedItem.style.left = `${x}px`;
    draggedItem.style.top  = `${y}px`;
}

function stopDrag(e) {
    if (!draggedItem) return;
    draggedItem.releasePointerCapture(e.pointerId);
    draggedItem.removeEventListener("pointermove", onDrag);
    draggedItem.removeEventListener("pointerup",   stopDrag);
    draggedItem.removeEventListener("pointercancel", stopDrag);
    draggedItem = null;
}

// ════════════════════════════════
//  FINAL BOUQUET CREATION
// ════════════════════════════════
async function createFinalBouquet() {
    const noteText = note ? note.value.trim() || "A bouquet made just for you." : "";

    // 1. render bouquet canvas
    const bouquetDataUrl = await renderBouquetCanvas();

    // 2. render note canvas
    const noteDataUrl = await renderNoteCanvas(noteText);

    // 3. build share link
    const items = Array.from(workspace.querySelectorAll(".placed-item")).map(item => ({
        type: item.dataset.type,
        src: item.getAttribute("src"),
        mirrored: item.dataset.mirrored,
        rotation: item.dataset.rotation,
        left: item.style.left,
        top:  item.style.top,
    }));
    const data = { note: noteText, items };
    const pageUrl = window.location.href.split("?")[0];
    if (shareLink) shareLink.value = `${pageUrl}?bouquet=${encodeURIComponent(JSON.stringify(data))}`;

    // 4. show images as downloadable links
    if (finalBouquetImage) {
        finalBouquetImage.src = bouquetDataUrl;
        bouquetDownload.href  = bouquetDataUrl;
    }
    if (finalNoteImage) {
        finalNoteImage.src  = noteDataUrl;
        noteDownload.href   = noteDataUrl;
    }

    // 5. switch to final screen
    showScreen("screen-final");
}

async function renderBouquetCanvas() {
    const canvas  = document.createElement("canvas");
    const ctx     = canvas.getContext("2d");
    canvas.width  = workspace.clientWidth;
    canvas.height = workspace.clientHeight;

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const items = Array.from(workspace.querySelectorAll(".placed-item"))
        .sort((a, b) => Number(a.style.zIndex) - Number(b.style.zIndex));

    for (const item of items) {
        await drawItem(ctx, item);
    }
    return canvas.toDataURL("image/png");
}

function drawItem(ctx, item) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const x = parseFloat(item.style.left) || 0;
            const y = parseFloat(item.style.top)  || 0;
            const w = item.offsetWidth;
            const h = item.offsetHeight;
            const rot = Number(item.dataset.rotation || 0) * Math.PI / 180;
            const mir = item.dataset.mirrored === "true" ? -1 : 1;
            ctx.save();
            ctx.translate(x + w / 2, y + h / 2);
            ctx.scale(mir, 1);
            ctx.rotate(rot);
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
            ctx.restore();
            resolve();
        };
        img.onerror = () => resolve();
        img.src = item.src;
    });
}

async function renderNoteCanvas(text) {
    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d");
    canvas.width  = 440;
    canvas.height = 320;

    // background
    ctx.fillStyle = "#fff7f7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // border
    ctx.strokeStyle = "#ffd7e1";
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, 420, 300);

    // small hearts decoration
    ctx.font = "20px serif";
    ctx.fillText("🌸", 20, 40);
    ctx.fillText("🌸", 400, 40);

    // text
    ctx.fillStyle = "#8b4d63";
    ctx.font = "20px serif";
    ctx.textAlign = "center";

    // word wrap
    const words = text.split(" ");
    let line = "", y = 100;
    for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > 380 && line !== "") {
            ctx.fillText(line.trim(), 220, y);
            line = word + " ";
            y += 32;
        } else {
            line = test;
        }
    }
    if (line.trim()) ctx.fillText(line.trim(), 220, y);

    return canvas.toDataURL("image/png");
}