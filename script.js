let ctx;

function getFrequency(n) {
    // Source: https://en.wikipedia.org/wiki/Piano_key_frequencies
    return (2 ** ((n - 49) / 12)) * 440;
}

// 109 notes, 11 durations
// 109 * 11 = 1199 possibilities for a single note
// 1199^n possibilities for n notes

const MAX = 1199; // 1199 not included.

const Durations = [
    4,
    6,
    2,
    3,
    1,
    1.5,
    0.5,
    0.75,
    0.25,
    0.125,
    0.0625
];

// Source: https://en.wikipedia.org/wiki/Piano_key_frequencies
const NoteNames = [
    "A0",
    "A♯0",
    "B0",
    "C1",
    "C♯1",
    "D1",
    "D♯1",
    "E1",
    "F1",
    "F♯1",
    "G1",
    "G♯1",
    "A1",
    "A♯1",
    "B1",
    "C2",
    "C♯2",
    "D2",
    "D♯2",
    "E2",
    "F2",
    "F♯2",
    "G2",
    "G♯2",
    "A2",
    "A♯2",
    "B2",
    "C3",
    "C♯3",
    "D3",
    "D♯3",
    "E3",
    "F3",
    "F♯3",
    "G3",
    "G♯3",
    "A3",
    "A♯3",
    "B3",
    "C4",
    "C♯4",
    "D4",
    "D♯4",
    "E4",
    "F4",
    "F♯4",
    "G4",
    "G♯4",
    "A4",
    "A♯4",
    "B4",
    "C5",
    "C♯5",
    "D5",
    "D♯5",
    "E5",
    "F5",
    "F♯5",
    "G5",
    "G♯5",
    "A5",
    "A♯5",
    "B5",
    "C6",
    "C♯6",
    "D6",
    "D♯6",
    "E6",
    "F6",
    "F♯6",
    "G6",
    "G♯6",
    "A6",
    "A♯6",
    "B6",
    "C7",
    "C♯7",
    "D7",
    "D♯7",
    "E7",
    "F7",
    "F♯7",
    "G7",
    "G♯7",
    "A7",
    "A♯7",
    "B7",
    "C8",
    "C0",
    "C♯0",
    "D0",
    "D♯0",
    "E0",
    "F0",
    "F♯0",
    "G0",
    "G♯0",
    "C♯8",
    "D8",
    "D♯8",
    "E8",
    "F8",
    "F♯8",
    "G8",
    "G♯8",
    "A8",
    "A♯8",
    "B8",
    "Silence"
];

function playNote(frequency, duration) {
    ctx.resume().then(r => r);
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(1, ctx.currentTime);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
}

function encodeNote(noteNumber, duration) {
    return noteNumber * 11 + duration;
}

function decodeNote(id) {
    const noteNumber = Math.floor(id / 11);
    const duration = id % 11;
    return {noteNumber, duration};
}

function encodeNoteIds(notes) {
    let encoded = BigNumber(0);
    for (let i = 0; i < notes.length; i++) {
        encoded = encoded.multipliedBy(MAX).plus(notes[i]);
    }
    return encoded;
}

function decodeNotes(encoded) {
    const notes = [];
    while (!encoded.isZero()) {
        notes.unshift(encoded.mod(MAX));
        encoded = encoded.div(MAX).integerValue();
    }
    return notes;
}

function wait(seconds) {
    return new Promise(resolve => stopper = setTimeout(resolve, seconds * 1000));
}

const id = document.querySelector(".id");
const bpm = document.querySelector(".bpm");
const lengthDiv = document.querySelector(".length");
const notesDiv = document.querySelector(".notes");
let notes = [];
let stopper;
let paused = false;

function onChange() {
    const noteIds = decodeNotes(BigNumber(id.value));
    notes = noteIds.map(i => decodeNote(i));
    const beats = notes.map(note => Durations[note.duration]).reduce((a, b) => a + b, 0);
    lengthDiv.textContent = "Note count: " + notes.length + ", beats: " + beats + ", duration: " + (beats * 60 / bpm.value) + " seconds";
    notesDiv.innerHTML = notes.map((note, i) => `<div class="note" id="note-${i}">${NoteNames[note.noteNumber]} (${Durations[note.duration]} beats)</div>`).join("");
    id.style.width = id.value.length * 8 + "px";
    bpm.style.width = bpm.value.length * 8 + "px";
    clearTimeout(stopper);
}

id.addEventListener("input", onChange);
bpm.addEventListener("input", onChange);

id.value = BigNumber.random(100).toFixed().replace(".", "").replace(/^0+/, "");

onChange();

document.querySelector(".run").addEventListener("click", async () => {
    ctx ||= new AudioContext();
    clearTimeout(stopper);
    paused = false;
    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const frequency = getFrequency(note.noteNumber);
        const duration = Durations[note.duration] * 60 / bpm.value;
        document.querySelectorAll(".note").forEach(i => i.style.color = "gray");
        document.querySelector(`#note-${i}`).style.color = "green";
        if (NoteNames[note.noteNumber] !== "Silence") playNote(frequency, duration);
        await wait(duration);
        if (paused) await new Promise(r => {
            stopper = setInterval(() => {
                if (!paused) r();
            });
        });
    }
});

document.querySelector(".pause").addEventListener("click", () => {
    ctx ||= new AudioContext();
    paused = true;
    ctx.suspend().then(r => r);
});

document.querySelector(".resume").addEventListener("click", () => {
    ctx ||= new AudioContext();
    paused = false;
    ctx.resume().then(r => r);
});

document.querySelector(".randomize").addEventListener("click", () => {
    ctx ||= new AudioContext();
    paused = false;
    ctx.suspend().then(r => r);
    id.value = BigNumber.random(100).toFixed().replace(".", "").replace(/^0+/, "");
    onChange();
});

const fromNotes = document.querySelector(".from-notes");
const toId = document.querySelector(".to-id");

const DurationNames = [
    "4",
    "6",
    "2",
    "3",
    "1",
    "3/2",
    "1/2",
    "3/4",
    "1/4",
    "1/8",
    "1/16",
    "1/32"
];

function makeNoteDiv() {
    const div = document.createElement("div");
    div.classList.add("note");
    div.innerHTML = `<select>` +
        NoteNames.map(i => `<option ${i === "C4" ? " selected" : ""}>${i}</option>`).join("")
        + `</select> <select>` +
        DurationNames.map(i => `<option ${i === "1" ? " selected" : ""}>${i}</option>`).join("")
        + `</select>`;
    const add = document.createElement("span");
    const remove = document.createElement("span");
    add.addEventListener("click", () => {
        addNote([...fromNotes.children].indexOf(div));
    });
    remove.addEventListener("click", () => {
        div.remove();
    });
    add.innerText = "+";
    remove.innerText = "-";
    div.append(add, remove);
    return div;
}

function addNote(index) {
    const el = fromNotes.children[index];
    el.insertAdjacentElement("afterend", makeNoteDiv());
}

fromNotes.appendChild(makeNoteDiv());


setInterval(() => {
    const notes = [...fromNotes.children].map(i => [
        NoteNames.indexOf(i.querySelector("select").value),
        DurationNames.indexOf(i.querySelector("select + select").value)
    ]);
    const noteIds = notes.map(i => encodeNote(i[0], i[1]));
    toId.value = encodeNoteIds(noteIds).toFixed();
}, 100);