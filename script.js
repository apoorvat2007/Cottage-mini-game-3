
const workspace         = document.querySelector("#workspace");
const finishButton      = document.querySelector("#finishButton");
const mirrorBtn         = document.querySelector("#mirrorBtn");
const rotateBtn         = document.querySelector("#rotateBtn");
const deleteBtn         = document.querySelector("#deleteBtn");
const shareLink         = document.querySelector("#shareLink");
const copyLinkBtn       = document.querySelector("#copyLinkBtn");
const copyStatus        = document.querySelector("#copyStatus");
const finalBouquetImage = document.querySelector("#finalBouquetImage");
const bouquetDownload   = document.querySelector("#bouquetDownload");
const startOverBtn      = document.querySelector("#startOverBtn");
const myDrawnFlowers    = document.querySelector("#myDrawnFlowers");

let selectedItem = null;
let draggedItem  = null;
let offsetX = 0, offsetY = 0;
let topLayer = 1;
const buttonSound = new Audio('mixkit-pen-click-and-release-1115.wav');
function playSound() {
    buttonSound.currentTime = 0;
    buttonSound.play().catch(() => {});
}


function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

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
    workspace.querySelectorAll(".placed-item").forEach(i => i.remove());
    document.querySelector(".workspace-tools").style.display = "flex";
    showStep("step1");
    showScreen("screen-choice");
});


function showStep(stepId) {
    document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
    const target = document.getElementById(stepId);
    if (target) target.classList.add("active");
}

document.querySelectorAll("[data-next]").forEach(btn => {
    btn.addEventListener("click", () => {
        showStep(btn.dataset.next);
        playSound();
    });
});

document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => {
        showStep(btn.dataset.back);
    });
});


document.querySelectorAll("[data-flower], [data-bow]").forEach(btn => {
    btn.addEventListener("click", () => {
        const src  = btn.dataset.flower || btn.dataset.bow;
        const type = btn.dataset.flower ? "flower" : "bow";
        addItemToWorkspace(src, type);
        playSound();
    });
});


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


document.addEventListener("click", e => {
    if (!e.target.closest(".placed-item")) {
        document.querySelectorAll(".placed-item").forEach(i => i.classList.remove("selected"));
        selectedItem = null;
    }
});


if (finishButton) finishButton.addEventListener("click", createFinalBouquet);


if (copyLinkBtn) copyLinkBtn.addEventListener("click", () => {
    if (!shareLink) return;
    shareLink.select();
    navigator.clipboard.writeText(shareLink.value)
        .then(() => { if (copyStatus) copyStatus.textContent = "Link copied! "; })
        .catch(() => { document.execCommand("copy"); if (copyStatus) copyStatus.textContent = "Link copied!"; });
});


const flowerAnimations = ["flower-float", "flower-sway", "flower-wobble", "flower-pulse"];

function addItemToWorkspace(src, type) {
    if (!src || !workspace) return;
    const item  = document.createElement("img");
    const count = workspace.querySelectorAll(".placed-item").length;

    item.src = src;
    item.className = "placed-item";
    item.draggable = false;
    item.dataset.mirrored = "false";
    item.dataset.rotation = "0";
    item.dataset.type = type;
    item.style.left   = `${80 + count * 18}px`;
    item.style.top    = `${80 + count * 14}px`;
    item.style.zIndex = String(topLayer++);
    if (type === "bow") item.style.width = "130px";

    // Random animation personality
    const animName = flowerAnimations[Math.floor(Math.random() * flowerAnimations.length)];
    const duration  = (2.5 + Math.random() * 2).toFixed(1);
    const delay     = (Math.random() * 1.5).toFixed(1);

    item.dataset.animName     = animName;
    item.dataset.animDuration = duration;
    item.dataset.animDelay    = delay;

    // Pop in first, then switch to personality
    item.style.animation = "flower-popin 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards";
    setTimeout(() => {
        if (!item.classList.contains("dragging")) {
            item.style.animation = `${animName} ${duration}s ${delay}s ease-in-out infinite`;
        }
    }, 420);

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
    draggedItem.classList.add("dragging");
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
    draggedItem.classList.remove("dragging");
    const n  = draggedItem.dataset.animName;
    const d  = draggedItem.dataset.animDuration;
    const dl = draggedItem.dataset.animDelay;
    if (n) draggedItem.style.animation = `${n} ${d}s ${dl}s ease-in-out infinite`;
    draggedItem = null;
}


async function createFinalBouquet() {
    const bouquetDataUrl = await renderBouquetCanvas();

    const items = Array.from(workspace.querySelectorAll(".placed-item")).map(item => ({
        type:     item.dataset.type,
        src:      item.getAttribute("src"),
        mirrored: item.dataset.mirrored,
        rotation: item.dataset.rotation,
        left:     item.style.left,
        top:      item.style.top,
    }));

    const pageUrl = window.location.href.split("?")[0];
    if (shareLink) shareLink.value = `${pageUrl}?bouquet=${encodeURIComponent(JSON.stringify(items))}`;

    if (finalBouquetImage) {
        finalBouquetImage.src = bouquetDataUrl;
        bouquetDownload.href  = bouquetDataUrl;
    }

   
    workspace.querySelectorAll(".placed-item").forEach(item => {
        item.style.pointerEvents = "none";
        item.classList.remove("selected");
    });
    document.querySelector(".workspace-tools").style.display = "none";

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
            const x   = parseFloat(item.style.left) || 0;
            const y   = parseFloat(item.style.top)  || 0;
            const w   = item.offsetWidth;
            const h   = item.offsetHeight;
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


const drawingCanvas  = document.getElementById("drawingCanvas");
const drawCtx        = drawingCanvas ? drawingCanvas.getContext("2d") : null;
const brushColor     = document.getElementById("brushColor");
const brushSize      = document.getElementById("brushSize");
const eraserBtn      = document.getElementById("eraserBtn");
const clearBtn       = document.getElementById("clearBtn");
const useDrawingBtn  = document.getElementById("useDrawingBtn");
const saveDrawingBtn = document.getElementById("saveDrawingBtn");
const savedGrid      = document.getElementById("savedGrid");
const emptyHint      = document.getElementById("emptyHint");

let isDrawing = false;
let isEraser  = false;
let lastX = 0, lastY = 0;

if (drawCtx) {
    drawCtx.fillStyle = "#ffffff";
    drawCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

function getCanvasPos(e) {
    const rect   = drawingCanvas.getBoundingClientRect();
    const scaleX = drawingCanvas.width  / rect.width;
    const scaleY = drawingCanvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top)  * scaleY
    };
}

if (drawingCanvas) {
    drawingCanvas.addEventListener("pointerdown", e => {
        isDrawing = true;
        const pos = getCanvasPos(e);
        lastX = pos.x;
        lastY = pos.y;
        drawingCanvas.setPointerCapture(e.pointerId);
    });

    drawingCanvas.addEventListener("pointermove", e => {
        if (!isDrawing) return;
        const pos = getCanvasPos(e);
        drawCtx.beginPath();
        drawCtx.moveTo(lastX, lastY);
        drawCtx.lineTo(pos.x, pos.y);
        drawCtx.strokeStyle = isEraser ? "#ffffff" : brushColor.value;
        drawCtx.lineWidth   = isEraser ? 30 : Number(brushSize.value);
        drawCtx.lineCap  = "round";
        drawCtx.lineJoin = "round";
        drawCtx.stroke();
        lastX = pos.x;
        lastY = pos.y;
    });

    drawingCanvas.addEventListener("pointerup",     () => { isDrawing = false; });
    drawingCanvas.addEventListener("pointercancel", () => { isDrawing = false; });
}

if (eraserBtn) {
    eraserBtn.addEventListener("click", () => {
        isEraser = !isEraser;
        eraserBtn.textContent = isEraser ? "Draw" : "Eraser";
        eraserBtn.classList.toggle("active-tool", isEraser);
    });
}

if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        drawCtx.fillStyle = "#ffffff";
        drawCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    });
}

if (useDrawingBtn) {
    useDrawingBtn.addEventListener("click", () => {
        const dataUrl = drawingCanvas.toDataURL("image/png");
        addItemToWorkspace(dataUrl, "flower");
        showScreen("screen-builder");
        showStep("step1");
    });
}


const STORAGE_PREFIX = "flora-drawn-flower:";

function loadSavedFlowers() {
    const flowers = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            flowers.push({ key, src: localStorage.getItem(key) });
        }
    }
    return flowers;
}

function renderSavedFlower(key, src) {
   
    const card = document.createElement("div");
    card.className = "saved-flower";
    card.dataset.key = key;

    const img = document.createElement("img");
    img.src = src;
    img.alt = "Saved flower";
    card.appendChild(img);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-saved";
    removeBtn.type = "button";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", e => {
        e.stopPropagation();
        localStorage.removeItem(key);
        card.remove();
        const optBtn = myDrawnFlowers && myDrawnFlowers.querySelector(`[data-key="${key}"]`);
        if (optBtn) optBtn.remove();
        if (emptyHint) emptyHint.style.display = savedGrid.querySelectorAll(".saved-flower").length === 0 ? "block" : "none";
    });
    card.appendChild(removeBtn);

  
    card.addEventListener("click", () => {
        const img2 = new Image();
        img2.onload = () => {
            drawCtx.fillStyle = "#ffffff";
            drawCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            drawCtx.drawImage(img2, 0, 0, drawingCanvas.width, drawingCanvas.height);
        };
        img2.src = src;
    });

    savedGrid.appendChild(card);

   
    if (myDrawnFlowers) {
        const optBtn = document.createElement("button");
        optBtn.type = "button";
        optBtn.className = "option";
        optBtn.dataset.flower = src;
        optBtn.dataset.key = key;

        const optImg = document.createElement("img");
        optImg.src = src;
        optImg.alt = "My flower";
        optBtn.appendChild(optImg);
        optBtn.appendChild(document.createTextNode("My Flower"));

        optBtn.addEventListener("click", () => {
            addItemToWorkspace(src, "flower");
            playSound();
        });

        myDrawnFlowers.appendChild(optBtn);
    }
}

function refreshSavedGallery() {
    if (!savedGrid) return;
    savedGrid.querySelectorAll(".saved-flower").forEach(el => el.remove());
    if (myDrawnFlowers) myDrawnFlowers.innerHTML = "";

    const flowers = loadSavedFlowers();
    if (flowers.length === 0) {
        if (emptyHint) emptyHint.style.display = "block";
        return;
    }
    if (emptyHint) emptyHint.style.display = "none";
    flowers.forEach(f => renderSavedFlower(f.key, f.src));
}

if (saveDrawingBtn) {
    saveDrawingBtn.addEventListener("click", () => {
        const dataUrl = drawingCanvas.toDataURL("image/png");
        const key = `${STORAGE_PREFIX}${Date.now()}`;
        try {
            localStorage.setItem(key, dataUrl);
        } catch {
            alert("Sorry, storage is full — try deleting some saved flowers.");
            return;
        }
        if (emptyHint) emptyHint.style.display = "none";
        renderSavedFlower(key, dataUrl);
        saveDrawingBtn.textContent = "Saved! ";
        setTimeout(() => { saveDrawingBtn.textContent = " Save to my flowers"; }, 1200);
    });
}

refreshSavedGallery();
