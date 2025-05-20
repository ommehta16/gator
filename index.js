const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.querySelector("#canvas-container").appendChild(canvas);

const snapDist = 40;
let clicked = false;
let mode = "edit";
let mouseX = 0, mouseY = 0;
document.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
})

document.addEventListener("mousedown", () => { clicked = true; })
document.addEventListener("mouseup", () => { clicked = false; })

let ratio = window.devicePixelRatio;

class Drawable { render() { } }

class Renderer {

    /** @type {Drawable[]} */
    #toDraw = [];

    constructor() {
    }

    /** @param {Drawable} drawable */
    draw(drawable) {
        this.#toDraw.push(drawable);
        this.render();
    }

    /** @param {Drawable} drawable */
    remove(drawable) {
        this.#toDraw = this.#toDraw.filter(itm => itm != drawable);
        this.render();
    }

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.#toDraw.forEach(item => item.render());
    }
}

const renderer = new Renderer();

class Point extends Drawable {
    x = 0;
    y = 0;
    radius;
    color;
    node = null;
    /** @type {Line | null} */
    line = null;

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} radius 
     */
    constructor(x, y, radius = 0, color = "#fff", line = null) {
        super();

        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.line = line;
    }

    render() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius, this.radius, 0, 2 * Math.PI, 0);
        ctx.closePath();
        ctx.fill();
    }

    copy() {
        return new Point(this.x, this.y, this.radius, this.color);
    }
}

class Line extends Drawable {
    pt1;
    pt2;
    // ^ Point
    color;
    thickness = 1;

    /**
     * @param {Point} pt1 
     * @param {Point} pt2 
     */
    constructor(pt1, pt2, color = "#fff") {
        super();

        this.pt1 = pt1;
        this.pt2 = pt2;
        pt1.line = this;
        pt2.line = this;
        this.color = color;
    }

    render() {
        const oldThickness = ctx.lineWidth;
        ctx.lineWidth = this.thickness;
        this.pt1.render();
        this.pt2.render();

        ctx.beginPath();
        ctx.moveTo(this.pt1.x, this.pt1.y);
        ctx.lineTo(this.pt2.x, this.pt2.y);
        ctx.closePath();

        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.lineWidth = oldThickness;
    }

    copy() {
        let copied1 = this.pt1.copy();
        let copied2 = this.pt2.copy();

        let copied = new Line(copied1, copied2, this.color);
        return copied;
    }
}

/** @param {number} a, @param {number} lo, @param {number} hi */
const clamp = (a, lo, hi) => Math.max(Math.min(a, hi), lo);

class LogicNode extends Drawable {
    /** @type {Point[]} */
    inputs = [];
    /** @type {Point[]} */
    outputs = [];
    #func;
    element;

    /**
     * @param {number} inputs 
     * @param {number} outputs 
     * @param {string} name 
     * @param {Function} func 
     */
    constructor(inputs, outputs, name, func) {
        super();

        for (let i = 0; i < inputs; i++) this.inputs.push(new Point(0, 0, 10));
        for (let i = 0; i < outputs; i++) this.outputs.push(new Point(0, 0, 10));
        this.inputs.forEach(pt => {
            inpFree.add(pt);
            pt.node = this;
        });
        this.outputs.forEach(pt => {
            outFree.add(pt);
            pt.node = this;
        });
        this.#func = func;
        this.name = name;

        this.element = document.createElement("div");
        document.querySelector("#draggables").appendChild(this.element);
        this.element.innerText = name;
        this.element.addEventListener("mousemove", e => {
            if (!clicked) return;
            if (mode == "erase") {
                this.delete();
                erase();
                return;
            }
            this.element.style.setProperty("--xctr", clamp(e.clientX, 0, window.innerWidth) + "px");
            this.element.style.setProperty("--yctr", clamp(e.clientY, 0, window.innerHeight) + "px");

            for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                    if (!clicked) return;
                    this.element.style.setProperty("--xctr", clamp(mouseX, 0, window.innerWidth) + "px");
                    this.element.style.setProperty("--yctr", clamp(mouseY, 0, window.innerHeight) + "px");
                    renderer.render();
                }, 35 * i)
            }
            renderer.render();
        });
        this.element.addEventListener("click", e => {
            if (mode == "edit") return;
            this.delete();
            erase();
        })
        renderer.draw(this);
    }

    delete() {
        renderer.remove(this);
        this.inputs.forEach(pt => {
            // inpConnected.delete(pt);
            // inpFree.delete(pt);
            pt.node = null;
            renderer.remove(pt.line);
            pt.line = null;
        });
        this.outputs.forEach(pt => {
            // outConnected.delete(pt);
            // outFree.delete(pt);
            pt.node = null;
            renderer.remove(pt.line);
            pt.line = null;
        });
        this.element.remove();
    }

    updatePoints() {
        const rect = this.element.getBoundingClientRect();

        let lIncr = rect.height / (this.inputs.length + 1);
        this.inputs.forEach((point, i) => {
            point.x = (rect.left - 8) * ratio;
            point.y = (rect.top + (i + 1) * lIncr) * ratio;
        });

        let rIncr = rect.height / (this.outputs.length + 1);
        this.outputs.forEach((point, i) => {
            point.x = (rect.right + 8) * ratio;
            point.y = (rect.top + (i + 1) * rIncr) * ratio;
        });
    }

    render() {
        this.updatePoints();
        this.inputs.forEach(itm => itm.render());
        this.outputs.forEach(itm => itm.render());
    }
}

function resizeCanvas() {
    ratio = window.devicePixelRatio;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    renderer.render();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let start = new Point(100, 100, 3);
let end = start;

const curr = new Line(start, end, "red");
renderer.draw(curr);

/** @type {Set<Point>} */
let inpConnected = new Set();
/** @type {Set<Point>} */
let outConnected = new Set();

/** @type {Set<Point>} */
let inpFree = new Set();
/** @type {Set<Point>} */
let outFree = new Set();


/**
 * @param {number} x1, @param {number} y1, @param {number} x2, @param {number} y2 
 * @returns {number}
 */
const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

/**
 * @param {MouseEvent} e 
 * @returns {Point}
 */
const getSnap = (e) => {
    let lowest = snapDist;
    let closePt = null;

    /** @param {Point} point */
    const checkNearest = point => {
        const dist = distance(point.x, point.y, e.clientX * ratio, e.clientY * ratio);
        if (dist >= lowest) return;
        if (point.node == curr.pt1.node) return;
        lowest = dist;
        closePt = point;
    }

    if (curr.pt1 == curr.pt2) { // we still need to place first node
        outFree.forEach(checkNearest);
        outConnected.forEach(checkNearest);
    } else {
        inpFree.forEach(checkNearest);
        inpConnected.forEach(checkNearest);
    }

    return closePt;
}
canvas.addEventListener("click", e => {
    if (mode != "edit") return;

    let snapPoint = getSnap(e);

    if (snapPoint == null) return; //snapPoint = new Point(e.clientX * ratio, e.clientY * ratio, 10);

    if (curr.pt1 == curr.pt2) {
        curr.pt1 = snapPoint;
        if (!outFree.has(snapPoint)) return;
        outFree.delete(snapPoint);
        outConnected.add(snapPoint);
        return;
    }

    // we have to close out the line and finalize it
    let finalized = curr.copy();
    finalized.pt1 = curr.pt1;
    finalized.pt2 = snapPoint;

    curr.pt1 = curr.pt2;

    curr.pt2.x = snapPoint.x;
    curr.pt2.y = snapPoint.y;

    if (inpFree.has(snapPoint)) {
        inpFree.delete(snapPoint);
        inpConnected.add(snapPoint);
    }
    else {
        renderer.remove(snapPoint.line);
    }

    finalized.pt1.line = finalized;
    finalized.pt2.line = finalized;
    finalized.color = "#fff";
    finalized.thickness = 3;
    renderer.draw(finalized);
});

window.addEventListener("mousemove", e => {
    /** @type {Point|null}} */
    let snapPoint = null;
    if (mode == "edit") snapPoint = getSnap(e);
    if (snapPoint == null) snapPoint = new Point(e.clientX * ratio, e.clientY * ratio, 10);

    curr.pt2.x = snapPoint.x;
    curr.pt2.y = snapPoint.y;

    renderer.render();
})

let nodes = [];

/**
 * @param {string} type 
 */
function addNode(type) {
    if (type == "and") nodes.push(new LogicNode(2, 1, "AND", a => (a[0] && a[1])));
    if (type == "or") nodes.push(new LogicNode(2, 1, "OR", a => (a[0] || a[1])));
    if (type == "not") nodes.push(new LogicNode(1, 1, "NOT", a => !a[0]));
}

function erase() {
    curr.pt1 = curr.pt2;
}

document.querySelector("#add-and").addEventListener("click", addNode.bind(this, "and"));
document.querySelector("#add-or").addEventListener("click", addNode.bind(this, "or"));
document.querySelector("#add-not").addEventListener("click", addNode.bind(this, "not"));

document.querySelector("#erase-mode").addEventListener("click", () => {
    document.querySelector("#edit-mode").removeAttribute("selected");
    document.querySelector("#erase-mode").setAttribute("selected", "");
    mode = "erase";
});

document.querySelector("#edit-mode").addEventListener("click", () => {
    document.querySelector("#erase-mode").removeAttribute("selected");
    document.querySelector("#edit-mode").setAttribute("selected", "");
    mode = "edit";
});