
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#gator");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");
let ratio = window.devicePixelRatio;
function resizeCanvas() {
    ratio = window.devicePixelRatio;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    render();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#000";
    // ctx.fillRect(0, 0, 100, 100);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let mode = "edit";
document.querySelectorAll("#mode button").forEach(el => el.addEventListener("click", () => {
    document.querySelector(`#${mode}`).removeAttribute("selected");
    mode = el.id;
    el.setAttribute("selected", "");
}));

render();

/** @type {Gate | null} */
let selected = null;

let selectedAt = { x: 0, y: 0 };

/** 
 * @typedef {Object} GateType our representation of a logic gate
 * @property {string} name the name of the gate
 * @property {Function} func the function to use to get outputs from inputs for a gate
 * 
*/

/** @type {Map<string, GateType>} */
const gateTypes = new Map([
    ["default", {
        name: "",
        func: (inps) => false
    }],
    ["and", {
        name: "AND",
        func: (inps) => inps[0] && inps[1]
    }],
    ["or", {
        name: "OR",
        func: (inps) => inps[0] || inps[1]
    }],
    ["not", {
        name: "NOT",
        func: (inps) => !inps[0]
    }]
]);


class Gate {
    /** @type {Gate[]} */
    static all = [];

    /** @type {Gate[]} */
    input = [];
    /** @type {Gate[]} */
    output = [];
    /** @type {number} */
    x;
    /** @type {number} */
    y;
    /** @type {HTMLDivElement} */
    element;
    /** @type {string} */
    nodeType

    /** @param {string} nodeType the type of node to add ("and", "or" or "not")*/
    constructor(nodeType) {
        this.x = canvas.width / 2;
        this.y = canvas.width / 2;

        this.element = document.createElement("div");
        this.element.className = "node";

        this.nodeType = nodeType;
        /** @type {GateType} */
        this.gate = gateTypes.get(nodeType) || gateTypes.get("default");
        this.element.innerHTML = `${this.gate.name}`;

        document.querySelector("#nodes").append(this.element);

        this.moveTo(canvas.width / 2, canvas.height / 2);

        this.element.addEventListener("mousedown", e => {
            if (mode == "erase") {
                Gate.all.splice(Gate.all.indexOf(this));
                this.element.remove();
            }
            if (this.element.querySelector(".out:hover")) return;

            selected = this;
            selectedAt.x = this.x - e.clientX * ratio;
            selectedAt.y = this.y - e.clientY * ratio;
        });

        // this.element.querySelector(".out").addEventListener("mousedown", e => {

        // });
    }

    /**
     * move the node to specific coordinates
     * @param {number} x 
     * @param {number} y 
     */
    moveTo(x, y) {
        this.x = x;
        this.y = y;

        this.element.style.setProperty("--x-pos", x / ratio + "px");
        this.element.style.setProperty("--y-pos", y / ratio + "px");
    }

    /**
     * Gate factory
     * @param {string} type the type of node ("and", "or" or "not") to add
     * @returns {Gate}
     */
    static node(type) {
        const created = new Gate(type);
        this.all.push(created);
        render();
        return created;
    }
}

document.querySelector("#add #and").addEventListener("click", () => Gate.node("and"));
document.querySelector("#add #or").addEventListener("click", () => Gate.node("or"));
document.querySelector("#add #not").addEventListener("click", () => Gate.node("not"));

window.addEventListener("mousemove", e => {
    if (selected == null) return;
    selected.moveTo(e.clientX * ratio + selectedAt.x, e.clientY * ratio + selectedAt.y);
})

window.addEventListener("mouseup", () => selected = null);

const start = Gate.node("");
start.element.id = "start";

const end = Gate.node("");
end.element.id = "end";