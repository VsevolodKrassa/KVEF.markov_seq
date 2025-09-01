autowatch = 1;
outlets = 2;

// --- Instance-safe JSUI for Max (ES5-compatible) ---

// read initial size from jsarguments (Max 5–compatible style)
function init_size_from_args() {
    var w = 400;
    var h = 400;
    if (jsarguments.length > 1) w = jsarguments[1];
    if (jsarguments.length > 2) h = jsarguments[2];
    this.box.size([w, h]);
}

// mgraphics setup
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

// --- constants ---
var STATE_OFF   = 0;
var STATE_25    = 1;
var STATE_50    = 2;
var STATE_75    = 3;
var STATE_100   = 4;

// --- helpers ---
function createButtonStates(size) {
    var states = [];
    for (var i = 0; i < size; i++) {
        var row = [];
        for (var j = 0; j < size; j++) {
            row.push(i === j ? STATE_25 : STATE_OFF);
        }
        states.push(row);
    }
    return states;
}

// --- instance init ---
function _ensure_init() {
    if (this.__initialized) return;

    init_size_from_args();

    // instance fields
    this.matrixSize = 16;
    this.buttonStates = createButtonStates(this.matrixSize);
    this.currentColumn = 1;
    this.highlightedColumn = 0;
    this.highlightIsAnimating = true;
    this.animationStep = 0;
    this.animationSteps = 10;
    this.animationInterval = 30;
    this.highlightColor   = [0.561, 0.937, 0.102, 1]; 
    this.highlightThickness = 0.15;
    this.textColor        = [0.843, 1.000, 0.400, 1];

    var self = this;
    this.animationTask = new Task(function () { animateHighlight.call(self); }, this);

    this.__initialized = true;
}

// --- layout ---
function calculateLayout() {
    var width = mgraphics.size[0];
    var height = mgraphics.size[1];
    var topPadding = Math.min(height * 0.15, width * 0.2);
    var sidePadding = topPadding / 2;

    var availableWidth = width - 2 * sidePadding;
    var availableHeight = height - topPadding - sidePadding;
    var buttonSize = Math.min(availableWidth / this.matrixSize, availableHeight / this.matrixSize);
    var padding = buttonSize * 0.05;

    buttonSize = (Math.min(availableWidth, availableHeight) - (padding * (this.matrixSize - 1))) / this.matrixSize;
    var matrixWidth = this.matrixSize * buttonSize + (this.matrixSize - 1) * padding;
    var matrixHeight = this.matrixSize * buttonSize + (this.matrixSize - 1) * padding;
    var startX = (width - matrixWidth) / 2;
    var startY = (height - matrixHeight) / 2 + topPadding / 2;

    return {
        buttonSize: buttonSize,
        padding: padding,
        startX: startX,
        startY: startY,
        topPadding: topPadding
    };
}

// --- drawing ---
function paint() {
    _ensure_init();

    var layout = calculateLayout.call(this);
    var buttonSize = layout.buttonSize;
    var startX = layout.startX;
    var startY = layout.startY;
    var fontSize = Math.min(layout.topPadding * 0.3, mgraphics.size[0] * 0.08);
    var textYPosition = startY - fontSize * 1.5;

    with (mgraphics) {
        set_source_rgba(0.345, 0.110, 0.845, 1);
        paint();

        drawTitleMixed(
            mgraphics.size[0] / 2,
            textYPosition,
            fontSize,
            this.textColor
        );

        for (var row = 0; row < this.matrixSize; row++) {
            for (var col = 0; col < this.matrixSize; col++) {
                var x = startX + col * (buttonSize + layout.padding);
                var y = startY + row * (buttonSize + layout.padding);
                setButtonColor(this.buttonStates[row][col]);
                rectangle(x, y, buttonSize, buttonSize);
                fill();
            }
        }

        highlightCurrentColumn.call(this, layout);
    }
}


function setButtonColor(state) {
    with (mgraphics) {
        switch (state) {
            // STATE_25: #D6FF66
            case STATE_25: set_source_rgba(0.843, 1.000, 0.400, 1); break;
            // STATE_50: #8FEF1A
            case STATE_50: set_source_rgba(0.561, 0.937, 0.102, 1); break;
            // STATE_75: #6DAF2F
            case STATE_75: set_source_rgba(0.427, 0.686, 0.184, 1); break;
            // STATE_100: #365F00
            case STATE_100: set_source_rgba(0.212, 0.373, 0.000, 1); break;
            // OFF (тёмный фон)
            default: set_source_rgba(0.1, 0.1, 0.1, 1);
        }
    }
}

function drawTitleMixed(centerX, posY, fontSize, color) {
    with (mgraphics) {
        set_source_rgba(color[0], color[1], color[2], color[3]);
        set_font_size(fontSize);

        var left = "markov_seq v0.1 by ";
        var right = "KVEF";

        select_font_face("Arial", "normal");
        var left_w = text_measure(left)[0];

        select_font_face("Arial", "italic");
        var right_w = text_measure(right)[0];

        var total_w = left_w + right_w;
        var posX = centerX - total_w / 2;

        select_font_face("Arial", "normal");
        move_to(posX, posY);
        show_text(left);

        select_font_face("Arial", "italic");
        move_to(posX + left_w, posY);
        show_text(right);
    }
}

// --- подсветка ---
function highlightCurrentColumn(layout) {
    if (!this.highlightedColumn) return;

    var startX = layout.startX;
    var startY = layout.startY;
    var buttonSize = layout.buttonSize;
    var padding = layout.padding;
    var colX = startX + (this.highlightedColumn - 1) * (buttonSize + padding);
    var colHeight = this.matrixSize * buttonSize + (this.matrixSize - 1) * padding;

    var colorStep = 1 - (this.animationStep / 5);
    var r = colorStep + (this.highlightColor[0] * (1 - colorStep));
    var g = colorStep + (this.highlightColor[1] * (1 - colorStep));
    var b = colorStep + (this.highlightColor[2] * (1 - colorStep));

    with (mgraphics) {
        set_source_rgba(r, g, b, 1);
        set_line_width(buttonSize * this.highlightThickness);
        rectangle(colX, startY, buttonSize, colHeight);
        stroke();
    }
}

// --- interaction ---
function onclick(x, y) {
    _ensure_init();

    var layout = calculateLayout.call(this);
    var buttonSize = layout.buttonSize;
    var startX = layout.startX;
    var startY = layout.startY;
    var padding = layout.padding;

    var col = Math.floor((x - startX) / (buttonSize + padding));
    var row = Math.floor((y - startY) / (buttonSize + padding));

    if (col >= 0 && col < this.matrixSize && row >= 0 && row < this.matrixSize) {
        if (row === col) {
            this.buttonStates[row][col] = (this.buttonStates[row][col] % 4) + 1;
        } else {
            this.buttonStates[row][col] = (this.buttonStates[row][col] + 1) % 5;
        }
        mgraphics.redraw();
    }
}

// --- timing / selection ---
function bang() {
    _ensure_init();

    checkColumn.call(this, this.currentColumn);
    this.currentColumn = (this.currentColumn % this.matrixSize) + 1;

    this.highlightIsAnimating = true;
    this.animationStep = 0;
    this.animationTask.schedule(this.animationInterval);
}

function animateHighlight() {
    if (this.animationStep < this.animationSteps) {
        this.animationStep++;
        mgraphics.redraw();
        this.animationTask.schedule(this.animationInterval);
    } else {
        endHighlightAnimation.call(this);
    }
}

function endHighlightAnimation() {
    this.highlightIsAnimating = false;
    this.animationStep = 0;
    mgraphics.redraw();
}

function checkColumn(column) {
    var weightedRows = getWeightedRows.call(this, column);
    if (weightedRows.length === 0) {
        resetHighlight.call(this);
        return;
    }
    var selectedRow = (weightedRows.length === 1)
        ? weightedRows[0].row
        : selectWeightedRow(weightedRows);

    updateHighlight.call(this, selectedRow);
}

function getWeightedRows(column) {
    var weightedRows = [];
    for (var row = 0; row < this.matrixSize; row++) {
        var clicks = this.buttonStates[row][column - 1];
        if (clicks > 0) {
            var weight = clicks * 25;
            weightedRows.push({ row: row + 1, weight: weight });
        }
    }
    return weightedRows;
}

function resetHighlight() {
    this.highlightedColumn = 0;
    mgraphics.redraw();
}

function selectWeightedRow(weightedRows) {
    var totalWeight = 0;
    for (var i = 0; i < weightedRows.length; i++) totalWeight += weightedRows[i].weight;

    var random = Math.random() * totalWeight;
    var cumulativeWeight = 0;

    for (var j = 0; j < weightedRows.length; j++) {
        cumulativeWeight += weightedRows[j].weight;
        if (random <= cumulativeWeight) return weightedRows[j].row;
    }

    return weightedRows[0].row; // fallback
}

function updateHighlight(selectedRow) {
    outlet(0, selectedRow);
    this.highlightedColumn = selectedRow;
    this.currentColumn = selectedRow;
    mgraphics.redraw();
}

// --- public API ---
function setMatrixSize(newSize) {
    _ensure_init();
    this.matrixSize = Math.max(1, newSize | 0);
    this.buttonStates = createButtonStates(this.matrixSize);
    this.currentColumn = 1;
    mgraphics.redraw();
}

function reset() {
    _ensure_init();
    this.currentColumn = 1;
    mgraphics.redraw();
}

function resize() {
    _ensure_init();
    mgraphics.redraw();
}

function saveState() {
    _ensure_init();
    var state = { size: this.matrixSize, states: this.buttonStates };
    outlet(1, JSON.stringify(state));
}

function loadState(json) {
    _ensure_init();
    try {
        var state = JSON.parse(json);
        if (state && state.size && state.states) {
            this.matrixSize = state.size;
            this.buttonStates = state.states;
            mgraphics.redraw();
        }
    } catch (e) {
        post("Error loading state: " + e.message + "\n");
    }
}

// --- external: clear ---
function clear() {
    _ensure_init();

    this.buttonStates = createButtonStates(this.matrixSize);

    this.highlightedColumn = 0;
    this.currentColumn = 1;
    this.highlightIsAnimating = false;
    this.animationStep = 0;
    if (this.animationTask && this.animationTask.cancel) {
        this.animationTask.cancel();
    }

    mgraphics.redraw();
}

// loadbang ensures per-instance init on create
function loadbang() {
    _ensure_init();
    mgraphics.redraw();
}
