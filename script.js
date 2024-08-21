const gridContainer = document.getElementById('grid-container');
const playPauseButton = document.getElementById('play-pause-button');
const clearButton = document.getElementById('clear-button');
const randomizeButton = document.getElementById('randomize-button');
const tempoSlider = document.getElementById('tempo-slider');
const tempoValue = document.getElementById('tempo-value');
const tonicSelect = document.getElementById('tonic-select');
const scaleSelect = document.getElementById('scale-select');

let isPlaying = false;
let currentColumn = 0;
let audioContext;
let oscillators = [];

const grid = [];
const numCells = 64;
const rows = 8;
const cols = 8;

let bpm = 120;
let interval = (60 / bpm) * 500;

const scales = {
  'Major':      [0, 2, 4, 5, 7, 9, 11, 12],
  'Minor':      [0, 2, 3, 5, 7, 8, 10, 12],
  'Lydian':     [0, 2, 4, 6, 7, 9, 11, 12],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10, 12],
  'Dorian':     [0, 2, 3, 5, 7, 9, 10, 12],
  'Phrygian':   [0, 1, 3, 5, 7, 8, 10, 12],
  'Locrian':    [0, 1, 3, 5, 6, 8, 10, 12]
};

const tonics = {
  'C':  261.63,
  'C#': 277.18,
  'D':  293.66,
  'D#': 311.13,
  'E':  329.63,
  'F':  349.23,
  'F#': 369.99,
  'G':  392.00,
  'G#': 415.30,
  'A':  440.00,
  'A#': 466.16,
  'B':  493.88
};

let frequencies = calculateFrequencies('C', 'Major');

// Calculate frequencies based on tonic and scale
function calculateFrequencies(tonic, scale) {
  const tonicFrequency = tonics[tonic];
  const intervals = scales[scale];
  return intervals.map(interval => tonicFrequency * Math.pow(2, interval / 12)).reverse();
}

// Create the grid of cells
function createGrid() {
  for (let i = 0; i < numCells; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.addEventListener('click', () => cell.classList.toggle('highlighted'));
    gridContainer.appendChild(cell);
    grid.push(cell);
  }
}

// Start playing the grid
function playGrid() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  createOscillators();
  playNextColumn();
}

// Stop playing the grid
function stopGrid() {
  oscillators.forEach(osc => osc.stop());
  oscillators = [];
  grid.forEach(cell => cell.classList.remove('playing'));
  currentColumn = 0;
}

// Create oscillators for each frequency
function createOscillators() {
  oscillators = frequencies.map(freq => {
    const osc = audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(0, audioContext.currentTime);
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;
    osc.connect(gainNode).connect(audioContext.destination);
    osc.start();
    return osc;
  });
}

// Play the next column in the grid
function playNextColumn() {
  if (!isPlaying) return;

  grid.forEach(cell => cell.classList.remove('playing'));

  for (let row = 0; row < rows; row++) {
    const cellIndex = row * cols + currentColumn;
    const cell = grid[cellIndex];
    
    if (cell.classList.contains('highlighted')) {
      oscillators[row].frequency.setValueAtTime(frequencies[row], audioContext.currentTime);
      cell.classList.add('playing');
    } else {
      oscillators[row].frequency.setValueAtTime(0, audioContext.currentTime);
    }
  }

  currentColumn = (currentColumn + 1) % cols;
  setTimeout(playNextColumn, interval);
}

// Clear the grid and stop playback
function clearGrid() {
  isPlaying = false;
  playPauseButton.textContent = 'Play';
  stopGrid();
  grid.forEach(cell => cell.classList.remove('highlighted'));
  [tonicSelect, scaleSelect, tempoSlider].forEach(el => el.disabled = false);
}

// Update the tempo based on the slider value
function updateTempo() {
  bpm = tempoSlider.value;
  interval = (60 / bpm) * 500;
  tempoValue.textContent = bpm;
}

// Update frequencies based on selected tonic and scale
function updateKey() {
  if (!isPlaying) {
    frequencies = calculateFrequencies(tonicSelect.value, scaleSelect.value);
  }
}

// Randomize the highlighted notes on the grid
function randomizeGrid() {
  grid.forEach(cell => cell.classList.toggle('highlighted', Math.random() > 0.85));
}

// Event listener for play/pause button
playPauseButton.addEventListener('click', () => {
  isPlaying = !isPlaying;
  playPauseButton.textContent = isPlaying ? 'Pause' : 'Play';
  [tonicSelect, scaleSelect, tempoSlider].forEach(el => el.disabled = isPlaying);
  if (isPlaying) playGrid();
  else stopGrid();
});

// Event listener for clear button
clearButton.addEventListener('click', clearGrid);

// Event listener for randomize button
randomizeButton.addEventListener('click', randomizeGrid);

// Event listener for tempo slider
tempoSlider.addEventListener('input', () => {
  updateTempo();
  if (isPlaying) {
    stopGrid();
    playGrid();
  }
});

// Event listeners for tonic and scale changes
tonicSelect.addEventListener('change', updateKey);
scaleSelect.addEventListener('change', updateKey);

createGrid();
updateTempo();
