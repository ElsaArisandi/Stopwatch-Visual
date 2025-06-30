// script.js

// Ambil elemen dari DOM
const display = {
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    milliseconds: document.getElementById('milliseconds')
};
const startStopBtn = document.getElementById('startStopBtn');
const lapResetBtn = document.getElementById('lapResetBtn');
const lapsTimeline = document.getElementById('laps-timeline');

// Variabel untuk menyimpan state
let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;
let laps = [];

// BARU: Fungsi untuk menyimpan state ke localStorage
function saveState() {
    const state = {
        elapsedTime,
        laps,
        isRunning,
        startTime: isRunning ? startTime : 0
    };
    localStorage.setItem('stopwatchState', JSON.stringify(state));
}

// BARU: Fungsi untuk memuat state dari localStorage
function loadState() {
    const savedState = localStorage.getItem('stopwatchState');
    if (savedState) {
        const state = JSON.parse(savedState);
        elapsedTime = state.elapsedTime || 0;
        laps = state.laps || [];
        isRunning = state.isRunning || false;
        startTime = state.startTime || 0;

        if (isRunning) {
            // Jika stopwatch berjalan saat ditutup, lanjutkan
            start();
        } else {
            // Jika berhenti, hanya perbarui tampilan
            updateDisplay(elapsedTime);
            lapResetBtn.textContent = 'Reset';
        }

        renderLaps();
    }
}

// Modifikasi: Fungsi updateDisplay bisa menerima argumen waktu
function updateDisplay(time) {
    const currentTime = time !== undefined ? time : Date.now() - startTime + elapsedTime;
    const formattedTime = formatTime(currentTime);

    Object.keys(formattedTime).forEach(key => {
        display[key].textContent = formattedTime[key];
    });
}

function formatTime(time) {
    const ms = Math.floor((time % 1000) / 10);
    const secs = Math.floor((time / 1000) % 60);
    const mins = Math.floor((time / (1000 * 60)) % 60);
    const hrs = Math.floor((time / (1000 * 60 * 60)) % 24);

    return {
        hours: String(hrs).padStart(2, '0'),
        minutes: String(mins).padStart(2, '0'),
        seconds: String(secs).padStart(2, '0'),
        milliseconds: String(ms).padStart(2, '0')
    };
}

function start() {
    if (!isRunning) {
        startTime = Date.now();
        timerInterval = setInterval(updateDisplay, 10);
        isRunning = true;
        
        startStopBtn.textContent = 'Stop';
        startStopBtn.classList.add('stop');
        lapResetBtn.textContent = 'Lap';
        
        saveState(); // Simpan state saat dimulai
    }
}

function stop() {
    if (isRunning) {
        clearInterval(timerInterval);
        elapsedTime += Date.now() - startTime;
        isRunning = false;
        
        startStopBtn.textContent = 'Mulai';
        startStopBtn.classList.remove('stop');
        lapResetBtn.textContent = 'Reset';

        saveState(); // Simpan state saat berhenti
    }
}

function reset() {
    clearInterval(timerInterval);
    startTime = 0;
    elapsedTime = 0;
    isRunning = false;
    laps = [];

    updateDisplay(0); // Reset display ke 0

    startStopBtn.textContent = 'Mulai';
    startStopBtn.classList.remove('stop');
    lapResetBtn.textContent = 'Reset';

    lapsTimeline.innerHTML = '';

    localStorage.removeItem('stopwatchState'); // Hapus state saat di-reset
}

function lap() {
    if (isRunning) {
        const totalTime = Date.now() - startTime + elapsedTime;
        const previousLapsTime = laps.reduce((sum, lap) => sum + lap.lapTime, 0);
        const currentLapTime = totalTime - previousLapsTime;

        laps.push({
            lapNumber: laps.length + 1,
            lapTime: currentLapTime,
            totalTime: totalTime
        });
        
        renderLaps();
        saveState(); // Simpan state setelah menambah lap
    }
}

// DIPERBARUI: Fungsi renderLaps dengan highlight
function renderLaps() {
    lapsTimeline.innerHTML = ''; 

    if (laps.length === 0) return;

    const lapTimes = laps.map(l => l.lapTime);
    const maxLapTime = Math.max(...lapTimes);
    const minLapTime = Math.min(...lapTimes);

    laps.forEach(lap => {
        const lapBar = document.createElement('div');
        lapBar.className = 'lap-bar';

        // Tambahkan class jika lap ini tercepat atau terlambat (hanya jika ada >1 lap)
        if (laps.length > 1) {
            if (lap.lapTime === minLapTime) {
                lapBar.classList.add('fastest');
            }
            if (lap.lapTime === maxLapTime) {
                lapBar.classList.add('slowest');
            }
        }
        
        const barWidth = (lap.lapTime / maxLapTime) * 100;
        lapBar.style.width = `${barWidth}%`;
        lapBar.style.minWidth = '20%'; 

        const lapNumber = document.createElement('span');
        lapNumber.className = 'lap-number';
        lapNumber.textContent = `Lap ${lap.lapNumber}`;

        const lapTime = document.createElement('span');
        lapTime.className = 'lap-time';
        const formattedLapTime = formatTime(lap.lapTime);
        lapTime.textContent = `${formattedLapTime.minutes}:${formattedLapTime.seconds}.${formattedLapTime.milliseconds}`;
        
        lapBar.appendChild(lapNumber);
        lapBar.appendChild(lapTime);
        
        lapsTimeline.prepend(lapBar);
    });
}

// Event Listener untuk tombol
startStopBtn.addEventListener('click', () => {
    isRunning ? stop() : start();
});

lapResetBtn.addEventListener('click', () => {
    isRunning ? lap() : reset();
});

// BARU: Panggil loadState() saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', loadState);