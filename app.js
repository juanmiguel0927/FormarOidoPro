const DEGREES = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7', '8'];
const ROOT_INDICES = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11 };
const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

const INTERVAL_NAMES = { 
    0: "Unísono", 1: "2da Menor", 2: "2da Mayor", 3: "3ra Menor", 4: "3ra Mayor", 
    5: "4ta Justa", 6: "Tritono", 7: "5ta Justa", 8: "6ta Menor", 9: "6ta Mayor", 
    10: "7ma Menor", 11: "7ma Mayor", 12: "Octava" 
};

const PROG_BANK = {
    nivel1: { major: ["I - V - I", "I - IV - I", "I - IV - V - I"], minor: ["i - V - i", "i - iv - i", "i - iv - V - i"] },
    nivel2: { major: ["I - vi - I", "I - vi - IV - V"], minor: ["i - bVI - i", "i - bVI - iv - V"] },
    nivel3: { major: ["ii - V - I", "I - ii - V - I"], minor: ["ii° - V - i", "i - ii° - V - i"] },
    nivel4: { major: ["I - iii - IV - V", "iii - vi - ii - V"], minor: ["i - bVII - i", "i - bIII - iv - V"] },
    nivel5: { major: ["I - I/3 - IV - V", "ii - vi - IV - V"], minor: ["i - i/3 - iv - V", "iv - i - bVI - V"] },
    nivel6: { major: ["I - V/3 - vi - V", "I - IV - I/5 - V"], minor: ["i - bVII/3 - bVI - V", "i - iv - i/5 - V"] }
};

const LEVEL_IDS = ['nivel1', 'nivel2', 'nivel3', 'nivel4', 'nivel5', 'nivel6'];

function getProgsForLevel(level, tonality) {
    let progs = [];
    const maxIdx = LEVEL_IDS.indexOf(level);
    for(let i = 0; i <= maxIdx; i++) {
        if(PROG_BANK[LEVEL_IDS[i]] && PROG_BANK[LEVEL_IDS[i]][tonality]) progs = progs.concat(PROG_BANK[LEVEL_IDS[i]][tonality]);
    }
    return progs;
}

const PEDAGOGIA_INTERVALOS = {
    nivel1: [0, 5, 7, 12], 
    nivel2: [0, 2, 4, 5, 7, 12], 
    nivel3: [0, 2, 4, 5, 7, 9, 11, 12],
    nivel4: [0, 1, 2, 3, 4, 5], 
    nivel5: [7, 6, 8, 10, 11, 12], 
    nivel6: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};

const FASES_INTERVALOS = ["FASE 0: PRESENTACIÓN", "FASE 1: EL INTRUSO", "FASE 2: CACERÍA", "FASE 3: RECONOCIMIENTO", "FASE 4: VUELO LIBRE"];
const RANK_NAMES = ["No Evaluado", "Bronce III", "Bronce II", "Bronce I", "Plata II", "Plata I", "Oro", "Diamante"];

const TUTORIALS = {
    'intruder': { title: 'Fase 1: El Intruso', desc: 'Escucha atentamente 5 secuencias de intervalos. Encuentra el que suena diferente al resto.' },
    'hunt': { title: 'Fase 2: Cacería', desc: 'Selecciona todas las tarjetas que correspondan al intervalo objetivo. ¡Luego presiona Evaluar!' },
    'direct': { title: 'Fase 3: Reconocimiento', desc: 'El sistema reproducirá primero una cadencia (para que tu oído ubique la tónica) y luego el intervalo.\nSelecciona su nombre correcto en los botones de abajo.' },
    'presentation': { title: 'Fase 0: Presentación', desc: 'Nuevo intervalo detectado. Tómate el tiempo para escucharlo y memorizar su sonoridad antes de comenzar a practicar.' },
    'melody': { title: 'Modo Melodía', desc: 'Escucha la cadencia y luego la secuencia de notas.\n\n✅ Toca las teclas del piano para enviar tu respuesta.\n\n💡 Ayuda: Toca los botones numerados para escuchar la nota, ver la iluminación en el teclado, y su guía de resolución.' },
    'harmony': { title: 'Modo Armonía', desc: 'Escucha la cadencia y luego la progresión de acordes. Selecciona la opción correcta de la lista.' },
    'bass': { title: 'Entrenamiento de Bajo Pro', desc: '¡Bienvenido al entrenamiento avanzado de Bajo!\n\nIdentifica el movimiento del bajo. Ahora puedes usar el MÁSTIL DE BAJO (4, 5 o 6 cuerdas) y activar el MODO DROP para ocultar la banda a la mitad de la pista y escuchar mejor las frecuencias graves.' }
};

let audioCtx;
let masterGain;
let masterOut;
let welcomeDone = false;
let globalVolume = localStorage.getItem('fop_volume') !== null ? parseFloat(localStorage.getItem('fop_volume')) : 1.0;
let playbackSpeed = localStorage.getItem('fop_speed') !== null ? parseFloat(localStorage.getItem('fop_speed')) : 1.0;
let fixedKey = localStorage.getItem('fop_fixed_key') || 'auto';
let midiAccessObj = null;

function setAudioStatus(text, isPlaying = false) {
    const statusEl = document.getElementById('audio-status-text');
    const playBtn = document.getElementById('center-play-btn');
    if (statusEl && text) statusEl.innerText = text;
    if (playBtn) playBtn.classList.toggle('is-playing', Boolean(isPlaying));
}

function updateBufferPreviewChips() {
    const cont = document.getElementById('buffer-preview-chips');
    if (!cont) return;
    cont.innerHTML = '';
    if (!state.userBuffer || state.userBuffer.length === 0) return;
    state.userBuffer.forEach(val => {
        const chip = document.createElement('span');
        chip.className = 'buffer-chip';
        if (state.mode === 'bass') {
            const vis = getDegreeVisuals(val, true);
            chip.innerText = vis.label + vis.arrow;
        } else {
            chip.innerText = DEGREES[val] ?? String(val);
        }
        cont.appendChild(chip);
    });
}

function setPlaybackSpeed(spd) {
    playbackSpeed = parseFloat(spd) || 1.0;
    localStorage.setItem('fop_speed', playbackSpeed);
    ['spd-075', 'spd-1', 'spd-13'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active-choice');
    });
    const activeId = playbackSpeed <= 0.8 ? 'spd-075' : (playbackSpeed >= 1.2 ? 'spd-13' : 'spd-1');
    const activeEl = document.getElementById(activeId);
    if (activeEl) activeEl.classList.add('active-choice');
    triggerHaptic('tap');
}

function syncFixedKeyUI() {
    const isMin = state && state.tonalityMode === 'minor';
    const autoEl = document.getElementById('fkey-auto');
    if (autoEl) autoEl.classList.toggle('active-choice', fixedKey === 'auto');
    CIRCLE_OF_FIFTHS.forEach(k => {
        const el = document.getElementById(`fkey-${k}`);
        if (el) {
            el.classList.toggle('active-choice', fixedKey === k);
            el.innerText = isMin ? `${k}m` : k;
        }
    });
}

function setFixedKey(keyVal) {
    fixedKey = keyVal || 'auto';
    localStorage.setItem('fop_fixed_key', fixedKey);
    syncFixedKeyUI();
    triggerHaptic('tap');
    if (state.target && sessionState.type !== 'test') startGame();
}

function initMIDI() {
    const btn = document.getElementById('midi-status-btn');
    if (!navigator.requestMIDIAccess) {
        showNotice('MIDI no disponible', 'Tu navegador o dispositivo no soporta Web MIDI API. Puedes usar el piano táctil o el teclado de la PC (A-K).');
        return;
    }
    navigator.requestMIDIAccess().then((access) => {
        midiAccessObj = access;
        let connected = 0;
        const bindInputs = () => {
            connected = 0;
            access.inputs.forEach((input) => {
                connected++;
                input.onmidimessage = (msg) => {
                    const [cmd, midiNote, velocity] = msg.data;
                    if ((cmd & 0xf0) === 0x90 && velocity > 0) {
                        handleExternalMidiNote(midiNote);
                    }
                };
            });
            if (btn) {
                btn.classList.toggle('midi-connected', connected > 0);
                btn.innerText = connected > 0 ? `🎹 MIDI (${connected})` : '🎹 MIDI: 0';
            }
        };
        bindInputs();
        access.onstatechange = bindInputs;
        if (connected === 0) {
            showNotice('MIDI Activo', 'Conecta un teclado MIDI por USB o Bluetooth y toca cualquier tecla para responder.');
        }
    }).catch(() => {
        showNotice('Error MIDI', 'No se pudo acceder a los dispositivos MIDI.');
    });
}

function handleExternalMidiNote(midi) {
    if (isAnyBlockingModalOpen()) return;
    initAudio();
    const isBass = state.mode === 'bass';
    if (isBass) playBassTone(midiToFreq(midi), 0.6);
    else playTone(midiToFreq(midi), 0.55);

    const keyEl = document.getElementById(`piano-key-${midi}`);
    if (keyEl) {
        keyEl.classList.add('playing');
        setTimeout(() => keyEl.classList.remove('playing'), 220);
    }

    const functional = isBass ? midi - (state.keyIndex - 12) : midi - state.keyIndex;
    if (state.mode === 'melody' && state.target && functional >= 0 && functional <= 12) {
        checkMelodyAnswer(functional);
    } else if (isBass && state.target) {
        checkBassAnswer(functional);
    }
}

function triggerHaptic(type = 'tap') {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
        if (type === 'tap') navigator.vibrate(12);
        else if (type === 'success') navigator.vibrate([20, 30, 35]);
        else if (type === 'error') navigator.vibrate([65, 30, 65]);
    } catch (e) {}
}
let datosIntruso = { correctoIdx: -1, intervalos: [] };
let datosCaceria = { targetInv: -1, cartas: [], evaluado: false };

let users = [];
let activeUserId = null;

let state = getDefaultState();
let sessionState = { active: false, type: 'free', timeLeft: 0, totalDuration: 0, elapsedTime: 0, timerId: null, initialXP: 0 };
let testTimerId = null;

function showNotice(title, desc) {
    const modal = document.getElementById('info-modal');
    if (modal) {
        document.getElementById('info-title').innerText = title;
        document.getElementById('info-desc').innerText = desc;
        modal.style.display = 'flex';
    }
}

function showCustomConfirm(title, desc, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-desc').innerText = desc;
    document.getElementById('confirm-cancel-btn').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('confirm-ok-btn').onclick = () => { modal.style.display = 'none'; onConfirm(); };
    modal.style.display = 'flex';
}

function getDefaultState() {
    return {
        level: 'nivel1', mode: 'melody', tonalityMode: 'major', currentRoundTonality: 'major',
        intervalDirection: 'mixed', currentQuestionDirection: 'asc', currentNoteCount: 1, userBuffer: [],
        keyIndex: 48, keyLabel: 'C', xp: 0, streak: 0, dailyStreak: 0, lastDate: '',
        isPlaying: false, target: null, questionStartTime: 0, timeouts: [], activeOscillators: [],
        tutorialShown: {}, errorStats: {}, rankIdx: 0,
        hours: { intervals: 0, melody: 0, harmony: 0, bass: 0 },
        sessionHistory: [],
        bassSettings: { bandVol: 0.5, bassVol: 1.0, timbre: 'synth', dropMode: false, view: 'piano', stringCount: 4 },
        mastery: { intervals: { current_l: 0, target_idx: 0, phase: 0, evidence: 0, level_time: 0 } },
        test: { lives: 3, levelIdx: 0, qIdx: 0, active: false }
    };
}

function initUsers() {
    applySavedTheme();
    const savedUsers = localStorage.getItem('fop_users');
    if (savedUsers) {
        try { users = JSON.parse(savedUsers); } catch (e) { users = []; }
    }
    showUserModal();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode'); document.documentElement.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('fop_theme', isDark ? 'dark' : 'light'); updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById('theme-icon');
    if(icon) {
        if(isDark) icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>';
        else icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
    }
}

function updateVolume(val) {
    globalVolume = parseFloat(val);
    localStorage.setItem('fop_volume', globalVolume);
    if (masterGain && audioCtx && audioCtx.state !== 'closed') {
        masterGain.gain.setTargetAtTime(globalVolume, audioCtx.currentTime, 0.02);
    }
}

function showUserModal() {
    document.getElementById('user-modal').style.display = 'flex';
    const ul = document.getElementById('user-list'); ul.innerHTML = '';
    const guestBtn = document.createElement('button');
    guestBtn.className = "w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-black py-3 rounded-xl mb-2 hover:bg-slate-300 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600";
    guestBtn.innerText = "👤 Usuario Invitado"; guestBtn.onclick = () => selectUser('usr_guest'); ul.appendChild(guestBtn);
    users.forEach(u => {
        const row = document.createElement('div'); row.className = "flex items-center gap-2 mb-2 w-full";
        const btn = document.createElement('button'); btn.className = "flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black py-3 px-4 rounded-xl hover:bg-violet-100 hover:text-violet-600 transition-colors text-left truncate shadow-sm text-xs";
        btn.innerText = u.name; btn.onclick = () => selectUser(u.id);
        const delBtn = document.createElement('button'); delBtn.className = "bg-rose-100 dark:bg-rose-900/30 text-rose-500 hover:bg-rose-200 dark:hover:bg-rose-800 p-2.5 rounded-xl transition-colors shrink-0 shadow-sm";
        delBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        delBtn.title = "Eliminar Usuario"; delBtn.onclick = (e) => deleteUser(u.id, e);
        row.appendChild(btn); row.appendChild(delBtn); ul.appendChild(row);
    });
}

function createUser() {
    const nameInput = document.getElementById('new-user-name'); const name = nameInput.value.trim(); if (!name) return;
    const newUser = { id: 'usr_' + Date.now(), name: name };
    users.push(newUser); localStorage.setItem('fop_users', JSON.stringify(users)); nameInput.value = '';
    selectUser(newUser.id);
}

function deleteUser(id, event) {
    event.stopPropagation();
    showCustomConfirm("Eliminar Perfil", "¿Seguro que deseas eliminar este perfil? Se perderá permanentemente todo su progreso.", () => {
        users = users.filter(u => u.id !== id); localStorage.setItem('fop_users', JSON.stringify(users));
        localStorage.removeItem(`fop_data_${id}`); localStorage.removeItem(`fop_session_${id}`);
        if (activeUserId === id) { activeUserId = null; localStorage.removeItem('fop_active_user'); }
        showUserModal();
    });
}

function selectUser(id) {
    activeUserId = id; localStorage.setItem('fop_active_user', id);
    document.getElementById('user-modal').style.display = 'none'; document.getElementById('start-modal').style.display = 'flex';
    let displayName = "Invitado";
    if (id !== 'usr_guest') { const found = users.find(u=>u.id===id); if(found) displayName = found.name; }
    document.getElementById('current-user-display').innerText = displayName;
    loadPersistence(); syncModeUI(state.mode); resetUI();
}

function switchUser() {
    stopAllSounds(true);
    document.getElementById('start-modal').style.display = 'none'; showUserModal();
}

function logout() {
    stopAllSounds(true);
    if(sessionState.timerId) clearInterval(sessionState.timerId); sessionState.timerId = null;
    if(testTimerId) { clearInterval(testTimerId); testTimerId = null; }
    if (activeUserId) savePersistence();
    
    document.getElementById('session-bar-container').classList.add('hidden');
    document.getElementById('session-time-remaining').classList.add('hidden');
    document.body.classList.remove('test-mode');
    document.getElementById('test-hud').classList.add('hidden');
    document.getElementById('test-hud').classList.remove('flex');
    
    activeUserId = null; localStorage.removeItem('fop_active_user');
    state = getDefaultState();
    sessionState = { active: false, type: 'free', timeLeft: 0, totalDuration: 0, elapsedTime: 0, timerId: null, initialXP: 0 };
    document.getElementById('start-modal').style.display = 'none'; showUserModal();
}

function confirmExit() { 
    stopAllSounds(true);
    if(sessionState.timerId) clearInterval(sessionState.timerId); sessionState.timerId = null;
    if(testTimerId) { clearInterval(testTimerId); testTimerId = null; }
    if (state.test && state.test.active) {
        state.test.active = false; document.body.classList.remove('test-mode');
        document.getElementById('test-hud').classList.add('hidden'); document.getElementById('test-hud').classList.remove('flex');
    }
    savePersistence(); 
    
    document.getElementById('start-modal').style.display = 'flex'; 
    document.getElementById('session-bar-container').classList.add('hidden');
    document.getElementById('session-time-remaining').classList.add('hidden');
    loadPersistence(); 
}

function loadPersistence() {
    if(!activeUserId) return;
    try {
        const saved = localStorage.getItem(`fop_data_${activeUserId}`); 
        if(saved) {
            const parsed = JSON.parse(saved); state = { ...getDefaultState(), ...parsed };
            if (!state.hours) state.hours = { intervals: 0, melody: 0, harmony: 0, bass: 0 };
            if (!state.sessionHistory) state.sessionHistory = [];
            if (!state.bassSettings) state.bassSettings = { bandVol: 0.5, bassVol: 1.0, timbre: 'synth', dropMode: false, view: 'piano', stringCount: 4 };
        } else state = getDefaultState();
        
        checkDailyStreak();
        document.getElementById('rank-display').innerText = RANK_NAMES[state.rankIdx || 0];

        const bBand = document.getElementById('band-vol'); if(bBand) bBand.value = state.bassSettings.bandVol;
        const bBass = document.getElementById('bass-vol'); if(bBass) bBass.value = state.bassSettings.bassVol;
        ['timbre-synth', 'timbre-electric', 'timbre-slap', 'timbre-sub'].forEach(id => {
            const el = document.getElementById(id); if (el) el.classList.remove('active-choice');
        });
        const tEl = document.getElementById(`timbre-${state.bassSettings.timbre}`); if(tEl) tEl.classList.add('active-choice');
        
        const sc = state.bassSettings.stringCount || 4;
        [4, 5, 6].forEach(num => {
            const el = document.getElementById(`str-${num}`);
            if(el) { if(num === sc) el.classList.add('active-choice'); else el.classList.remove('active-choice'); }
        });

        document.getElementById('btn-drop-mode').classList.toggle('active-choice', state.bassSettings.dropMode);
        document.getElementById('drop-indicator').classList.toggle('bg-white', state.bassSettings.dropMode);
        document.getElementById('drop-indicator').classList.toggle('bg-slate-300', !state.bassSettings.dropMode);
        
        document.getElementById('btn-bass-view').innerText = state.bassSettings.view === 'piano' ? 'VISTA: PIANO' : 'VISTA: MÁSTIL';
        document.getElementById('btn-bass-view').classList.toggle('active-choice', state.bassSettings.view === 'fretboard');
        updateBassSummaryPill();

        const savedSession = localStorage.getItem(`fop_session_${activeUserId}`);
        const btnCont = document.getElementById('btn-continue');
        
        if (savedSession) {
            const parsedSession = JSON.parse(savedSession);
            if (parsedSession.active && (parsedSession.timeLeft > 0 || parsedSession.type === 'free')) {
                sessionState = { ...sessionState, ...parsedSession, timerId: null };
                btnCont.classList.remove('hidden');
                if (sessionState.type !== 'free') {
                    const m = Math.floor(sessionState.timeLeft / 60); const s = sessionState.timeLeft % 60;
                    btnCont.innerText = `Reanudar Sesión (${m}:${s.toString().padStart(2,'0')})`;
                } else btnCont.innerText = `Reanudar Práctica Libre`;
            } else btnCont.classList.add('hidden');
        } else btnCont.classList.add('hidden');
    } catch(e) { console.warn("Error guardado", e); state = getDefaultState(); }
}

function savePersistence() {
    if(!activeUserId) return;
    const toSave = { ...state, isPlaying: false, activeOscillators: [], timeouts: [] };
    localStorage.setItem(`fop_data_${activeUserId}`, JSON.stringify(toSave));
    const sessionData = { active: sessionState.active, type: sessionState.type, timeLeft: sessionState.timeLeft, totalDuration: sessionState.totalDuration, elapsedTime: sessionState.elapsedTime, initialXP: sessionState.initialXP };
    localStorage.setItem(`fop_session_${activeUserId}`, JSON.stringify(sessionData));
}

function checkDailyStreak() {
    const todayStr = new Date().toDateString();
    if (!state.lastDate) state.dailyStreak = 0;
    else {
        const last = new Date(state.lastDate); const current = new Date(todayStr);
        const diffDays = Math.floor((current - last) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) state.dailyStreak = 0;
    }
    if(document.getElementById('daily-streak-val-modal')) document.getElementById('daily-streak-val-modal').innerText = state.dailyStreak;
}

function updateStreakRecord() {
    const todayStr = new Date().toDateString();
    if (state.lastDate !== todayStr) { state.dailyStreak++; state.lastDate = todayStr; savePersistence(); }
}

function resetProgress() {
    showCustomConfirm("Reiniciar Progreso", "¿Estás seguro de reiniciar todo tu avance? Se perderá tu nivel, estadísticas e historial. (Tus días de racha se mantendrán intactos).", () => {
        const keepDaily = state.dailyStreak; const keepLastDate = state.lastDate; const keepStreak = state.streak; const keepBass = state.bassSettings; 
        state = getDefaultState(); state.dailyStreak = keepDaily; state.lastDate = keepLastDate; state.streak = keepStreak; state.bassSettings = keepBass;
        savePersistence(); closeStats(); location.reload();
    });
}

function exportData() {
    const data = {};
    for(let i=0; i<localStorage.length; i++) { const key = localStorage.key(i); if(key.startsWith('fop_')) data[key] = localStorage.getItem(key); }
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'formar_oido_backup.json'; a.click();
}

function importData(e) {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            Object.keys(data).forEach(k => { if(k.startsWith('fop_')) localStorage.setItem(k, data[k]); });
            showNotice("Importación Exitosa", "Datos importados con éxito. Recargando...");
            setTimeout(() => location.reload(), 1500);
        } catch(err) { showNotice("Error", "Error al importar el archivo."); }
    };
    reader.readAsText(file);
}

function exploreApp() {
    sessionState.active = false; sessionState.type = 'explore';
    const sModal = document.getElementById('start-modal'); if(sModal) sModal.style.display = 'none'; 
    const sBar = document.getElementById('session-bar-container'); if(sBar) sBar.classList.add('hidden');
    const sTime = document.getElementById('session-time-remaining'); if(sTime) sTime.classList.add('hidden');
     stopAllSounds();
    syncModeUI(state.mode); resetUI(); startGame();
}

function showDailyOptions() { document.getElementById('start-main-view').classList.add('hidden'); document.getElementById('start-daily-view').classList.remove('hidden'); }
function backToMainStart() { document.getElementById('start-main-view').classList.remove('hidden'); document.getElementById('start-daily-view').classList.add('hidden'); }

function selectGameMode(type, duration) { 
    sessionState.active = true; sessionState.type = type; 
    const sModal = document.getElementById('start-modal'); if(sModal) sModal.style.display = 'none'; 
    const sBar = document.getElementById('session-bar-container'); if(sBar) sBar.classList.remove('hidden');
    const sTime = document.getElementById('session-time-remaining'); if(sTime) sTime.classList.remove('hidden');
    
    let modeToStart = state.mode;
    if (type === 'daily') {
        const hasStats = Object.keys(state.errorStats || {}).length > 0;
        modeToStart = !hasStats ? 'melody' : getWeakestMode();
    }
    
    startSessionTimer(false, type === 'daily' ? duration : 0); 
     stopAllSounds();
    state.mode = modeToStart; syncModeUI(modeToStart); resetUI(); startGame();
}

function startCustomSession() {
    const mins = parseInt(document.getElementById('custom-minutes').value);
    if (!mins || mins <= 0) { showNotice("Tiempo Inválido", "Ingresa un tiempo válido en minutos."); return; }
    selectGameMode('daily', mins * 60);
}

function continueSession() { 
    const sModal = document.getElementById('start-modal'); if(sModal) sModal.style.display = 'none'; 
    const sBar = document.getElementById('session-bar-container'); if(sBar) sBar.classList.remove('hidden');
    const sTime = document.getElementById('session-time-remaining'); if(sTime) sTime.classList.remove('hidden');
    startSessionTimer(true); syncModeUI(state.mode); startGame(); 
}

function startSessionTimer(isResume = false, duration = 0) {
    if (sessionState.timerId) clearInterval(sessionState.timerId);
    if (!isResume) {
        sessionState.totalDuration = duration || 0; sessionState.timeLeft = duration || 0;
        sessionState.elapsedTime = 0; sessionState.initialXP = state.xp;
    }
    updateTimerUI();

    sessionState.timerId = setInterval(() => {
        if (sessionState.type === 'free' || sessionState.type === 'explore') sessionState.elapsedTime++;
        else if (sessionState.type !== 'explore') {
            sessionState.timeLeft--;
            if (sessionState.timeLeft <= 0) {
                clearInterval(sessionState.timerId); sessionState.active = false; showSessionEndModal(); return;
            }
        }
        updateTimerUI();
        if (activeUserId && sessionState.type !== 'explore') {
            const sessionData = { active: sessionState.active, type: sessionState.type, timeLeft: sessionState.timeLeft, totalDuration: sessionState.totalDuration, elapsedTime: sessionState.elapsedTime, initialXP: sessionState.initialXP };
            localStorage.setItem(`fop_session_${activeUserId}`, JSON.stringify(sessionData));
        }
    }, 1000);
}

function updateTimerUI() {
    const timerEl = document.getElementById('session-timer-text'); const progressEl = document.getElementById('session-progress');
    if(!timerEl) return;
    if (sessionState.type === 'free' || sessionState.type === 'explore') {
        const m = Math.floor(sessionState.elapsedTime / 60).toString().padStart(2, '0'); const s = (sessionState.elapsedTime % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`; if(progressEl) progressEl.style.width = '100%';
    } else {
        const m = Math.floor(sessionState.timeLeft / 60).toString().padStart(2, '0'); const s = (sessionState.timeLeft % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
        if(progressEl && sessionState.totalDuration > 0) {
            const pct = ((sessionState.totalDuration - sessionState.timeLeft) / sessionState.totalDuration) * 100;
            progressEl.style.width = `${pct}%`;
        }
    }
}

function showSessionEndModal() {
     stopAllSounds();
    const sessionLog = { date: Date.now(), duration: sessionState.totalDuration, type: sessionState.type, xpGained: state.xp - sessionState.initialXP, strengths: getTopStrengths(), weaknesses: getTopWeaknesses() };
    if(!state.sessionHistory) state.sessionHistory = []; state.sessionHistory.unshift(sessionLog);
    if(state.sessionHistory.length > 50) state.sessionHistory = state.sessionHistory.slice(0, 50); savePersistence();

    document.getElementById('end-time-val').innerText = `${Math.floor(sessionState.totalDuration / 60)} min`;
    document.getElementById('end-xp-val').innerText = `+${sessionLog.xpGained}`;
    document.getElementById('session-end-modal').style.display = 'flex'; triggerConfetti();
}

function cerrarFinSesion() { document.getElementById('session-end-modal').style.display = 'none'; location.reload(); }

function toggleBassConfigDrawer() {
    const drawer = document.getElementById('bass-config-drawer');
    const chevron = document.getElementById('bass-drawer-chevron');
    if (!drawer) return;
    const isHidden = drawer.classList.contains('hidden');
    if (isHidden) {
        drawer.classList.remove('hidden');
        drawer.classList.add('flex');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        drawer.classList.add('hidden');
        drawer.classList.remove('flex');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
}

function updateBassSummaryPill() {
    const pill = document.getElementById('bass-summary-pill');
    if (!pill || !state.bassSettings) return;
    const sc = state.bassSettings.stringCount || 4;
    const t = (state.bassSettings.timbre || 'synth').toUpperCase();
    const drop = state.bassSettings.dropMode ? ' • DROP' : '';
    pill.innerText = `${sc}C • ${t}${drop}`;
}

function updateBassMix() {
    if(!state.bassSettings) state.bassSettings = { bandVol: 0.5, bassVol: 1.0, timbre: 'synth', dropMode: false, view: 'piano', stringCount: 4 };
    state.bassSettings.bandVol = parseFloat(document.getElementById('band-vol').value);
    state.bassSettings.bassVol = parseFloat(document.getElementById('bass-vol').value);
    savePersistence();
}

function setBassTimbre(t) {
    if(!state.bassSettings) state.bassSettings = { bandVol: 0.5, bassVol: 1.0, timbre: 'synth', dropMode: false, view: 'piano', stringCount: 4 };
    state.bassSettings.timbre = t;
    ['timbre-synth', 'timbre-electric', 'timbre-slap', 'timbre-sub'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('active-choice'); });
    document.getElementById(`timbre-${t}`).classList.add('active-choice');
    updateBassSummaryPill();
    savePersistence();
    initAudio(); playBassTone(midiToFreq(36), 0.5); 
}

function setBassStrings(n) {
    if(!state.bassSettings) state.bassSettings = { bandVol: 0.5, bassVol: 1.0, timbre: 'synth', dropMode: false, view: 'piano', stringCount: 4 };
    state.bassSettings.stringCount = n;
    [4, 5, 6].forEach(num => {
        const el = document.getElementById(`str-${num}`);
        if(el) { if(num === n) el.classList.add('active-choice'); else el.classList.remove('active-choice'); }
    });
    updateBassSummaryPill();
    savePersistence(); resetUI();
}

function toggleDropMode() {
    if(!state.bassSettings) state.bassSettings = { bandVol: 0.5, bassVol: 1.0, timbre: 'synth', dropMode: false, view: 'piano', stringCount: 4 };
    state.bassSettings.dropMode = !state.bassSettings.dropMode;
    document.getElementById('btn-drop-mode').classList.toggle('active-choice', state.bassSettings.dropMode);
    document.getElementById('drop-indicator').classList.toggle('bg-white', state.bassSettings.dropMode);
    document.getElementById('drop-indicator').classList.toggle('bg-slate-300', !state.bassSettings.dropMode);
    updateBassSummaryPill();
    savePersistence();
}

function toggleBassView() {
    if(!state.bassSettings) state.bassSettings = { bandVol: 0.5, bassVol: 1.0, timbre: 'synth', dropMode: false, view: 'piano', stringCount: 4 };
    state.bassSettings.view = state.bassSettings.view === 'piano' ? 'fretboard' : 'piano';
    document.getElementById('btn-bass-view').innerText = state.bassSettings.view === 'piano' ? 'VISTA: PIANO' : 'VISTA: MÁSTIL';
    document.getElementById('btn-bass-view').classList.toggle('active-choice', state.bassSettings.view === 'fretboard');
    savePersistence(); resetUI();
}

function initAudio() {
    if (!audioCtx || audioCtx.state === 'closed') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(globalVolume, audioCtx.currentTime);
        masterOut = audioCtx.createDynamicsCompressor();
        masterGain.connect(masterOut);
        masterOut.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
}

function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function playTone(freq, dur, type='triangle', start=0, vol=0.3, isBand=false, volOverride=null) {
    if (!audioCtx || !masterGain) return;
    const spd = playbackSpeed || 1.0;
    const scaledStart = start / spd;
    const scaledDur = Math.max(0.18, dur / spd);
    const t = scaledStart + audioCtx.currentTime;
    const bandMult = volOverride !== null ? volOverride : (isBand ? ((state.bassSettings?.bandVol ?? 0.5) * 2) : 1);
    const peak = Math.max(0.001, vol * bandMult);

    if (type === 'triangle') {
        // Warm 2-harmonic piano synthesis with hammer filter envelope (100% offline)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        const env = audioCtx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq * 2, t);
        g2.gain.setValueAtTime(0.24, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(Math.min(6000, freq * 5.2), t);
        filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 1.9), t + Math.min(0.45, scaledDur * 0.7));

        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(peak * 1.05, t + 0.014);
        env.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * 0.55), t + Math.min(0.22, scaledDur * 0.35));
        env.gain.exponentialRampToValueAtTime(0.0008, t + scaledDur);

        osc1.connect(filter);
        osc2.connect(g2);
        g2.connect(filter);
        filter.connect(env);
        env.connect(masterGain);

        osc1.start(t); osc1.stop(t + scaledDur);
        osc2.start(t); osc2.stop(t + scaledDur);
        state.activeOscillators.push(osc1, osc2);
        return;
    }

    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, t + scaledDur);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + scaledDur);
    state.activeOscillators.push(osc);
}

function playInterval(root, note, forceDir) { 
    initAudio(); 
    let dir = forceDir || state.currentQuestionDirection || 'asc';
    if (dir === 'mixed') dir = ['asc', 'desc', 'harmonic'][Math.floor(Math.random() * 3)];
    
    if (dir === 'harmonic') {
        playTone(midiToFreq(root), 1.2, 'triangle', 0, 0.3); playTone(midiToFreq(note), 1.2, 'triangle', 0, 0.3);
    } else if (dir === 'desc') {
        playTone(midiToFreq(note), 0.8, 'triangle', 0, 0.3); playTone(midiToFreq(root), 0.8, 'triangle', 0.8, 0.3);
    } else {
        playTone(midiToFreq(root), 0.8, 'triangle', 0, 0.3); playTone(midiToFreq(note), 0.8, 'triangle', 0.8, 0.3);
    }
}

function playGhostNote(start, vol=0.4) {
    if (!audioCtx || !masterGain) return;
    const t = start + audioCtx.currentTime; const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(60, t); osc.frequency.exponentialRampToValueAtTime(20, t + 0.05);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.001, vol), t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(g); g.connect(masterGain); osc.start(t); osc.stop(t + 0.05); state.activeOscillators.push(osc);
}

function playBassTone(freq, dur, start=0, vol=0.6, volOverride=null) {
    if (!audioCtx || !masterGain) return;
    const t = start + audioCtx.currentTime;
    const timbre = state.bassSettings?.timbre || 'synth';
    const bassMult = volOverride !== null ? volOverride : (state.bassSettings?.bassVol ?? 1.0);
    const actualVol = Math.max(0.001, vol * bassMult);

    if (timbre === 'sub') {
        const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(actualVol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g); g.connect(masterGain); osc.start(t); osc.stop(t + dur); state.activeOscillators.push(osc);
    } else if (timbre === 'electric') {
        const osc1 = audioCtx.createOscillator(); const osc2 = audioCtx.createOscillator(); const g = audioCtx.createGain();
        osc1.type = 'triangle'; osc2.type = 'square'; osc1.frequency.setValueAtTime(freq, t); osc2.frequency.setValueAtTime(freq, t);
        const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(freq * 3, t); filter.frequency.exponentialRampToValueAtTime(freq, t + 0.1);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(actualVol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.8);
        osc1.connect(g); osc2.connect(filter); filter.connect(g); g.connect(masterGain);
        osc1.start(t); osc1.stop(t + dur); osc2.start(t); osc2.stop(t + dur); state.activeOscillators.push(osc1, osc2);
    } else if (timbre === 'slap') {
        const osc = audioCtx.createOscillator(); const filter = audioCtx.createBiquadFilter(); const g = audioCtx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, t);
        filter.type = 'lowpass'; filter.frequency.setValueAtTime(freq * 8, t); filter.frequency.exponentialRampToValueAtTime(freq, t + 0.1); filter.Q.value = 2;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(actualVol * 1.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6); 
        osc.connect(filter); filter.connect(g); g.connect(masterGain); osc.start(t); osc.stop(t + dur);
        const pop = audioCtx.createOscillator(); const popG = audioCtx.createGain();
        pop.type = 'sine'; pop.frequency.setValueAtTime(freq * 2, t); pop.frequency.exponentialRampToValueAtTime(10, t + 0.05);
        popG.gain.setValueAtTime(actualVol * 0.8, t); popG.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        pop.connect(popG); popG.connect(masterGain); pop.start(t); pop.stop(t + 0.05); state.activeOscillators.push(osc, pop);
    } else {
        const osc = audioCtx.createOscillator(); const filter = audioCtx.createBiquadFilter(); const g = audioCtx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, t);
        filter.type = 'lowpass'; filter.Q.value = 1; filter.frequency.setValueAtTime(freq * 4, t); filter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.3);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(actualVol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(filter); filter.connect(g); g.connect(masterGain); osc.start(t); osc.stop(t + dur); state.activeOscillators.push(osc);
    }
}

function stopAllSounds(suspendAudio = false) {
    (state.activeOscillators || []).forEach(osc => { try { osc.stop(); } catch(e) {} try { osc.disconnect(); } catch(e) {} });
    state.activeOscillators = []; clearAllTimeouts(); state.isPlaying = false;
    if (suspendAudio && audioCtx && audioCtx.state === 'running') {
        try { audioCtx.suspend(); } catch(e) {}
    }
    document.querySelectorAll('.playing').forEach(el => el.classList.remove('playing'));
    document.querySelectorAll('.cadence-chord-active').forEach(el => { el.classList.remove('cadence-chord-active'); el.classList.add('opacity-50'); });
    const cDisp = document.getElementById('cadence-display');
    if(cDisp) { cDisp.classList.remove('opacity-100', 'scale-100'); cDisp.classList.add('opacity-0', 'scale-95', 'pointer-events-none'); }
    setAudioStatus('Toca ▶ para escuchar o responde', false);
}

function registerTimeout(fn, delay) { const id = setTimeout(fn, delay); state.timeouts.push(id); return id; }
function clearAllTimeouts() { state.timeouts.forEach(id => clearTimeout(id)); state.timeouts = []; }

function getChordNotes(root, type) {
    if (type === 'Maj') return [root, root + 4, root + 7];
    if (type === 'Min') return [root, root + 3, root + 7];
    if (type === 'Dim') return [root, root + 3, root + 6];
    return [root, root + 4, root + 7];
}

function getSmoothVoicing(prevVoicing, targetPitches, bassDiff) {
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    let bestVoicing = null; let minCost = Infinity;
    for (let perm of perms) {
        let currentVoicing = []; let totalDist = 0; let commonTones = 0; let directions = [];
        for (let i = 0; i < 3; i++) {
            const targetPC = targetPitches[perm[i]]; const prevNote = prevVoicing[i];
            let closestNote = prevNote; let minDiff = Infinity;
            for (let oct = -2; oct <= 2; oct++) {
                let testNote = (Math.floor(prevNote / 12) + oct) * 12 + targetPC;
                let diff = Math.abs(testNote - prevNote);
                if (diff < minDiff) { minDiff = diff; closestNote = testNote; }
            }
            currentVoicing.push(closestNote); totalDist += minDiff; directions.push(closestNote - prevNote);
            if (minDiff === 0) commonTones++;
        }
        let cost = totalDist;
        if (commonTones === 0 && bassDiff !== 0) {
            let contrary = true;
            for (let dir of directions) { if (bassDiff > 0 && dir > 0) contrary = false; if (bassDiff < 0 && dir < 0) contrary = false; }
            if (!contrary) cost += 1000; 
        }
        directions.forEach(dir => { if(Math.abs(dir) > 4) cost += Math.abs(dir); }); 
        if (cost < minCost) { minCost = cost; bestVoicing = currentVoicing; }
    }
    return bestVoicing;
}

function getBassSequence(progStr) {
    return progStr.split(' - ').map((r, idx) => {
        const cleanRoman = r.split('/')[0].trim();
        const map = {'I':0,'IV':5,'V':7,'vi':9,'ii':2,'iii':4,'i':0,'iv':5,'bVI':8,'bVII':10, 'ii°':2, 'bIII': 3}; 
        let deg = map[cleanRoman.replace(/7|maj|m|°/g,'')] || 0;
        let bassOffset = deg;
        
        if (r.includes('/')) {
            const inv = r.split('/')[1].trim();
            let type = 'Maj'; if (cleanRoman.includes('°')) type = 'Dim'; else if (cleanRoman === cleanRoman.toLowerCase() || cleanRoman.includes('m')) type = 'Min';
            if (inv === '3') bassOffset = (deg + (type === 'Min' || type === 'Dim' ? 3 : 4)) % 12;
            if (inv === '5') bassOffset = (deg + (type === 'Dim' ? 6 : 7)) % 12;
        }
        if (idx > 0 && bassOffset > 6) bassOffset -= 12; else if (idx === 0 && bassOffset > 6) bassOffset -= 12;
        return bassOffset;
    });
}

function playUpperVoicesHelper(progStr, dropMode=false) {
    const chordsStr = progStr.split(' - ');
    const dropThreshold = Math.floor(chordsStr.length / 2);
    let t = 0; let currentUpperVoices = null;
    
    chordsStr.forEach((roman, idx) => {
        const isDrop = dropMode && idx >= dropThreshold;
        const bandVolOverride = dropMode ? (isDrop ? 0.05 : 1.0) : null;
        const map = {'I':0,'IV':5,'V':7,'vi':9,'ii':2,'iii':4,'i':0,'iv':5,'bVI':8,'bVII':10, 'ii°':2, 'bIII': 3}; 
        const cleanRoman = roman.split('/')[0].trim();
        const deg = map[cleanRoman.replace(/7|maj|m|°/g,'')] || 0;
        const rootPC = (state.keyIndex + deg) % 12;
        let type = 'Maj'; if (cleanRoman.includes('°')) type = 'Dim'; else if (cleanRoman === cleanRoman.toLowerCase() || cleanRoman.includes('m')) type = 'Min';
        const targetPitches = getChordNotes(rootPC, type).map(n => n % 12);
        const bassNoteForVoicing = state.keyIndex - 12 + deg; 

        if (idx === 0) {
            let rootNote = 60 + ((rootPC - (60 % 12) + 12) % 12); if (rootNote > 65) rootNote -= 12; 
            const thirdNote = rootNote + (type === 'Min' || type === 'Dim' ? 3 : 4);
            const fifthNote = rootNote + (type === 'Dim' ? 6 : 7);
            currentUpperVoices = [rootNote, thirdNote, fifthNote];
        } else {
            const prevDeg = map[chordsStr[idx-1].split('/')[0].trim().replace(/7|maj|m|°/g,'')] || 0;
            const prevBassForVoicing = state.keyIndex - 12 + prevDeg;
            const bassDiff = bassNoteForVoicing - prevBassForVoicing;
            currentUpperVoices = getSmoothVoicing(currentUpperVoices, targetPitches, bassDiff);
        }
        const dur = 1.2;
        currentUpperVoices.forEach(n => playTone(midiToFreq(n), dur, 'triangle', t, 0.05, true, bandVolOverride)); 
        t += dur + 0.2;
    });
}

function playProgressionFocusBass(progStr, bassOffsets) {
    state.isPlaying = true; let t = 0;
    const dropMode = state.bassSettings?.dropMode;
    const dropThreshold = Math.floor(progStr.split(' - ').length / 2);
    playUpperVoicesHelper(progStr, dropMode);

    progStr.split(' - ').forEach((roman, idx) => {
        const isDrop = dropMode && idx >= dropThreshold;
        const bassVolOverride = dropMode ? (isDrop ? 1.5 : 0.2) : null;
        const bassNote = state.keyIndex - 12 + bassOffsets[idx];
        playBassTone(midiToFreq(bassNote), 1.2, t, 0.6, bassVolOverride); 
        t += 1.4;
    });
    registerTimeout(() => { state.isPlaying = false; }, t * 1000);
}

function playBaladaBassLine(progStr, bassOffsets) {
    state.isPlaying = true; let t = 0; const beatDur = 1.2 / 8;
    const dropMode = state.bassSettings?.dropMode;
    const dropThreshold = Math.floor(progStr.split(' - ').length / 2);
    playUpperVoicesHelper(progStr, dropMode);

    progStr.split(' - ').forEach((roman, idx) => {
        const isDrop = dropMode && idx >= dropThreshold;
        const bassVolOverride = dropMode ? (isDrop ? 1.5 : 0.2) : null;
        const bassNote = state.keyIndex - 12 + bassOffsets[idx];
        for(let i=0; i<8; i++) playBassTone(midiToFreq(bassNote), beatDur * 0.8, t + (i * beatDur), 0.6, bassVolOverride);
        t += 1.4;
    });
    registerTimeout(() => { state.isPlaying = false; }, t * 1000);
}

function playDiscoBassLine(progStr, bassOffsets) {
    state.isPlaying = true; let t = 0; const beatDur = 1.2 / 4; 
    const dropMode = state.bassSettings?.dropMode;
    const dropThreshold = Math.floor(progStr.split(' - ').length / 2);
    playUpperVoicesHelper(progStr, dropMode);

    progStr.split(' - ').forEach((roman, idx) => {
        const isDrop = dropMode && idx >= dropThreshold;
        const bassVolOverride = dropMode ? (isDrop ? 1.5 : 0.2) : null;
        const bassNote = state.keyIndex - 12 + bassOffsets[idx];
        for(let i=0; i<4; i++) {
            playBassTone(midiToFreq(bassNote), beatDur * 0.4, t + (i * beatDur), 0.6, bassVolOverride);
            playGhostNote(t + (i * beatDur) + (beatDur * 0.45), isDrop ? 0.8 : 0.4); 
            playBassTone(midiToFreq(bassNote + 12), beatDur * 0.4, t + (i * beatDur) + (beatDur/2), 0.4, bassVolOverride); 
        }
        t += 1.4;
    });
    registerTimeout(() => { state.isPlaying = false; }, t * 1000);
}

function playWalkingBassLine(progStr, bassOffsets) {
    state.isPlaying = true; let t = 0; const beatDur = 1.2 / 4; 
    const dropMode = state.bassSettings?.dropMode;
    const chordsStr = progStr.split(' - ');
    const dropThreshold = Math.floor(chordsStr.length / 2);
    playUpperVoicesHelper(progStr, dropMode);
    
    chordsStr.forEach((roman, idx) => {
        const isDrop = dropMode && idx >= dropThreshold;
        const bassVolOverride = dropMode ? (isDrop ? 1.5 : 0.2) : null;
        const bassNote = state.keyIndex - 12 + bassOffsets[idx];
        const nextBassNote = idx < chordsStr.length - 1 ? (state.keyIndex - 12 + bassOffsets[idx+1]) : bassNote;
        
        playBassTone(midiToFreq(bassNote), beatDur * 0.9, t, 0.6, bassVolOverride); 
        playBassTone(midiToFreq(bassNote + 7), beatDur * 0.9, t + beatDur, 0.5, bassVolOverride); 
        playBassTone(midiToFreq(bassNote + 12), beatDur * 0.9, t + beatDur * 2, 0.5, bassVolOverride); 
        const approach = nextBassNote - 1;
        playBassTone(midiToFreq(approach), beatDur * 0.9, t + beatDur * 3, 0.5, bassVolOverride);
        t += 1.4;
    });
    registerTimeout(() => { state.isPlaying = false; }, t * 1000);
}

function playTumbaoBassLine(progStr, bassOffsets) {
    state.isPlaying = true; let t = 0; const beatDur = 1.4 / 4; 
    const chordsStr = progStr.split(' - ');
    const dropMode = state.bassSettings?.dropMode;
    const dropThreshold = Math.floor(chordsStr.length / 2);
    let currentUpperVoices = null;

    chordsStr.forEach((roman, idx) => {
        const isDrop = dropMode && idx >= dropThreshold;
        const bandVolOverride = dropMode ? (isDrop ? 0.05 : 1.0) : null;
        const bassVolOverride = dropMode ? (isDrop ? 1.5 : 0.2) : null;

        const map = {'I':0,'IV':5,'V':7,'vi':9,'ii':2,'iii':4,'i':0,'iv':5,'bVI':8,'bVII':10, 'ii°':2, 'bIII': 3}; 
        const cleanRoman = roman.split('/')[0].trim();
        const deg = map[cleanRoman.replace(/7|maj|m|°/g,'')] || 0;
        const rootPC = (state.keyIndex + deg) % 12;
        let type = 'Maj'; if (cleanRoman.includes('°')) type = 'Dim'; else if (cleanRoman === cleanRoman.toLowerCase() || cleanRoman.includes('m')) type = 'Min';
        const targetPitches = getChordNotes(rootPC, type).map(n => n % 12);
        const bassNoteForVoicing = state.keyIndex - 12 + deg; 

        if (idx === 0) {
            let rootNote = 60 + ((rootPC - (60 % 12) + 12) % 12); if (rootNote > 65) rootNote -= 12; 
            const thirdNote = rootNote + (type === 'Min' || type === 'Dim' ? 3 : 4);
            const fifthNote = rootNote + (type === 'Dim' ? 6 : 7);
            currentUpperVoices = [rootNote, thirdNote, fifthNote];
        } else {
            const prevDeg = map[chordsStr[idx-1].split('/')[0].trim().replace(/7|maj|m|°/g,'')] || 0;
            const prevBassForVoicing = state.keyIndex - 12 + prevDeg;
            const bassDiff = bassNoteForVoicing - prevBassForVoicing;
            currentUpperVoices = getSmoothVoicing(currentUpperVoices, targetPitches, bassDiff);
        }

        for (let b = 0; b < 4; b++) {
            currentUpperVoices.forEach(n => playTone(midiToFreq(n), beatDur * 0.6, 'triangle', t + (b * beatDur), 0.05, true, bandVolOverride)); 
        }

        const deepBassNote = state.keyIndex - 12 + bassOffsets[idx];
        const nextBassNote = idx < chordsStr.length - 1 ? (state.keyIndex - 12 + bassOffsets[idx+1]) : deepBassNote;
        
        playBassTone(midiToFreq(deepBassNote), beatDur * 1.2, t + (beatDur * 1.5), 0.6, bassVolOverride);
        playBassTone(midiToFreq(nextBassNote), beatDur * 0.9, t + (beatDur * 3.0), 0.6, bassVolOverride);
        t += 1.4;
    });
    registerTimeout(() => { state.isPlaying = false; }, t * 1000);
}

function playRiffBassLine(progStr, riffSequence) {
    state.isPlaying = true; let t = 0; const beatDur = 1.6 / 4; 
    const rootPC = state.keyIndex % 12;
    const type = state.currentRoundTonality === 'minor' ? 'Min' : 'Maj';
    const upperVoices = getChordNotes(rootPC, type).map(n => n % 12).map(n => 60 + n);
    const dropMode = state.bassSettings?.dropMode;
    
    for(let c=0; c<2; c++) { 
        const bandVolOverride = dropMode ? (c===1 ? 0.05 : 1.0) : null;
        upperVoices.forEach(n => playTone(midiToFreq(n), 1.6, 'triangle', t + c*1.6, 0.05, true, bandVolOverride));
    }

    riffSequence.forEach((offset, idx) => {
        const isDrop = dropMode && idx >= 2;
        const bassVolOverride = dropMode ? (isDrop ? 1.5 : 0.2) : null;
        const bassNote = state.keyIndex - 12 + offset;
        playBassTone(midiToFreq(bassNote), beatDur * 0.8, t, 0.6, bassVolOverride);
        t += beatDur;
    });
    registerTimeout(() => { state.isPlaying = false; }, 3200);
}

function dispatchBassPattern(progStr, bassOffsets, patternName) {
    if (patternName === 'tumbao') playTumbaoBassLine(progStr, bassOffsets);
    else if (patternName === 'balada') playBaladaBassLine(progStr, bassOffsets);
    else if (patternName === 'disco') playDiscoBassLine(progStr, bassOffsets);
    else if (patternName === 'walking') playWalkingBassLine(progStr, bassOffsets);
    else if (patternName === 'riff') playRiffBassLine(progStr, bassOffsets);
    else playProgressionFocusBass(progStr, bassOffsets);
}

function showCadenceUI(chords, timings, totalDuration) {
    const container = document.getElementById('cadence-display');
    const chordsContainer = document.getElementById('cadence-chords');
    if(!container || !chordsContainer) return;
    
    chordsContainer.innerHTML = '';

    chords.forEach((chord, i) => {
        const el = document.createElement('div');
        el.id = `cadence-chord-${i}`;
        el.className = 'px-3 py-1 rounded-lg transition-all duration-200 opacity-50 border border-transparent';
        el.innerText = chord;
        chordsContainer.appendChild(el);
    });

    container.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    container.classList.add('opacity-100', 'scale-100');

    timings.forEach((t, i) => {
        registerTimeout(() => {
            for(let j=0; j<chords.length; j++) {
                const el = document.getElementById(`cadence-chord-${j}`);
                if(el) { el.classList.remove('cadence-chord-active'); el.classList.add('opacity-50'); }
            }
            const activeEl = document.getElementById(`cadence-chord-${i}`);
            if(activeEl) { activeEl.classList.remove('opacity-50'); activeEl.classList.add('cadence-chord-active'); }
        }, t * 1000);
    });

    registerTimeout(() => {
        container.classList.remove('opacity-100', 'scale-100');
        container.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    }, (totalDuration + 0.5) * 1000);
}

function playCadence() {
    
    stopAllSounds(); initAudio();
    
    const isMin = state.currentRoundTonality === 'minor';
    const cadences = isMin ? ["i - iv - V - i", "ii° - V - i"] : ["I - IV - V - I", "ii - V - I"];
    const selectedCadence = cadences[Math.floor(Math.random() * cadences.length)];
    
    const chordsStr = selectedCadence.split(' - ');
    const actualChords = getAmericanChords(selectedCadence).split(' - ');
    
    let t = 0; const timings = [];
    const bassOffsets = getBassSequence(selectedCadence);
    let currentUpperVoices = null;
    
    chordsStr.forEach((roman, idx) => {
        timings.push(t);
        const map = {'I':0,'IV':5,'V':7,'vi':9,'ii':2,'iii':4,'i':0,'iv':5,'bVI':8,'bVII':10, 'ii°':2}; 
        const deg = map[roman.trim().replace(/7|maj|m|°/g,'')] || 0;
        const rootPC = (state.keyIndex + deg) % 12;
        
        let type = 'Maj';
        if (roman.includes('°')) type = 'Dim';
        else if (roman === roman.toLowerCase() || roman.includes('m')) type = 'Min';

        const targetPitches = getChordNotes(rootPC, type).map(n => n % 12);
        const bassNote = state.keyIndex - 12 + bassOffsets[idx];
        
        if (idx === 0) {
            let rootNote = 60 + ((rootPC - (60 % 12) + 12) % 12);
            if (rootNote > 65) rootNote -= 12; 
            const thirdNote = rootNote + (type === 'Min' || type === 'Dim' ? 3 : 4);
            const fifthNote = rootNote + (type === 'Dim' ? 6 : 7);
            currentUpperVoices = [rootNote, thirdNote, fifthNote];
        } else {
            const prevBass = state.keyIndex - 12 + bassOffsets[idx-1];
            const bassDiff = bassNote - prevBass;
            currentUpperVoices = getSmoothVoicing(currentUpperVoices, targetPitches, bassDiff);
        }
        
        const dur = (idx === chordsStr.length - 1) ? 1.4 : 0.7;
        playTone(midiToFreq(bassNote), dur, 'sine', t, 0.4); 
        currentUpperVoices.forEach(n => playTone(midiToFreq(n), dur, 'triangle', t, 0.2));
        t += dur;
    });
    
    showCadenceUI(actualChords, timings, t);
    return t; 
}

function getResolutionPath(degreeIdx, isMinor) {
    const base = {
        0: [[0, -5, 0]], 1: [1,0], 2: [2,0], 3: [3,2,0], 4: [4,2,0],
        5: isMinor ? [5,3,2,0] : [5,4,2,0],
        6: isMinor ? [[6,7,3,0], [6,7,12]] : [[6,7,4,0], [6,7,12]],
        7: isMinor ? [7,3,0] : [7,4,0],
        8: [8,7,12], 9: [9,11,12], 10: [10,11,12], 11: [11,12], 12: [12,7,12]
    };
    return base[degreeIdx];
}

function executeVisualResolution(degreeIdx) {
    const isMinor = state.currentRoundTonality === 'minor';
    let path = getResolutionPath(degreeIdx, isMinor);
    if (!path) path = [degreeIdx];
    else if (Array.isArray(path[0])) path = path[Math.floor(Math.random() * path.length)];
    
    let t = 0;
    path.forEach((step, idx) => {
        const midi = state.keyIndex + step;
        const dur = (idx === path.length - 1) ? 1.0 : 0.4;
        playTone(midiToFreq(midi), dur, idx === 0 ? 'triangle' : 'sine', t, 0.2);
        registerTimeout(() => {
            const keyEl = document.getElementById(`piano-key-${midi}`);
            if (keyEl) {
                keyEl.classList.add('playing');
                setTimeout(() => keyEl.classList.remove('playing'), (dur * 1000) - 50);
            }
        }, t * 1000);
        t += dur;
    });
    return t; 
}

function playProgression(progStr) {
    
    stopAllSounds(); initAudio();
    state.isPlaying = true;
    const chordsStr = progStr.split(' - ');
    let t = 0;
    const bassOffsets = getBassSequence(progStr);
    let currentUpperVoices = null;
    
    chordsStr.forEach((roman, idx) => {
        const cleanRoman = roman.split('/')[0].trim();
        const map = {'I':0,'IV':5,'V':7,'vi':9,'ii':2,'iii':4,'i':0,'iv':5,'bVI':8,'bVII':10, 'ii°':2, 'bIII': 3}; 
        const deg = map[cleanRoman.replace(/7|maj|m|°/g,'')] || 0;
        const rootPC = (state.keyIndex + deg) % 12;
        
        let type = 'Maj';
        if (cleanRoman.includes('°')) type = 'Dim';
        else if (cleanRoman === cleanRoman.toLowerCase() || cleanRoman.includes('m')) type = 'Min';

        const targetPitches = getChordNotes(rootPC, type).map(n => n % 12);
        const bassNote = state.keyIndex - 12 + bassOffsets[idx];
        
        if (idx === 0) {
            let rootNote = 60 + ((rootPC - (60 % 12) + 12) % 12);
            if (rootNote > 65) rootNote -= 12; 
            const thirdNote = rootNote + (type === 'Min' || type === 'Dim' ? 3 : 4);
            const fifthNote = rootNote + (type === 'Dim' ? 6 : 7);
            currentUpperVoices = [rootNote, thirdNote, fifthNote];
        } else {
            const prevBass = state.keyIndex - 12 + bassOffsets[idx-1];
            const bassDiff = bassNote - prevBass;
            currentUpperVoices = getSmoothVoicing(currentUpperVoices, targetPitches, bassDiff);
        }
        
        const dur = 1.2;
        playTone(midiToFreq(bassNote), dur, 'sine', t, 0.4); 
        currentUpperVoices.forEach(n => playTone(midiToFreq(n), dur, 'triangle', t, 0.2));
        t += dur + 0.2;
    });
    
    registerTimeout(() => { state.isPlaying = false; }, t * 1000);
}

function repeatSound() {
    if(!state.target || state.isPlaying) return;
    
    stopAllSounds(); initAudio();
    
    if (state.mode === 'melody') {
        state.isPlaying = true;
        let t = 0;
        state.target.sequence.forEach(inv => {
            registerTimeout(() => { playTone(midiToFreq(state.keyIndex + inv), 0.8, 'triangle', 0); }, t * 1000);
            t += 0.8;
        });
        registerTimeout(() => state.isPlaying = false, t * 1000);
    } else if (state.mode === 'bass') {
        const bassOffsets = state.target.bassPattern === 'riff' ? state.target.sequence : getBassSequence(state.target.answer);
        dispatchBassPattern(state.target.answer, bassOffsets, state.target.bassPattern);
    } else if (state.mode === 'intervals') {
        const m = state.mastery.intervals;
        const isReviewing = LEVEL_IDS.indexOf(state.level) < m.current_l;
        let currentPhase = isReviewing ? 4 : m.phase;
        if (sessionState.type === 'test') currentPhase = 3;

        if (currentPhase === 0 || currentPhase === 3 || currentPhase === 4) {
            if (currentPhase === 3 || currentPhase === 4) {
                const cadDur = playCadence();
                registerTimeout(() => { playInterval(state.target.root, state.target.root + state.target.inv); }, (cadDur + 0.5) * 1000);
            } else {
                playInterval(state.target.root, state.target.root + state.target.inv, 'asc');
            }
        }
        else if (currentPhase === 1) playIntruderSequence();
        else if (currentPhase === 2) playHuntSequence();
    } else if (state.mode === 'harmony') {
        playProgression(state.target.answer);
    }
}

function getNoteNameDisplay(midiVal) {
    const rootName = state.keyLabel; 
    const rootLetter = rootName.charAt(0);
    const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const BASE_MIDI = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };

    const rootLetterIdx = LETTERS.indexOf(rootLetter);
    let interval = (midiVal - state.keyIndex) % 12; if (interval < 0) interval += 12;

    const degreeOffsetMap = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 5, 9: 5, 10: 6, 11: 6 };
    const step = degreeOffsetMap[interval];
    const targetLetterIdx = (rootLetterIdx + step) % 7;
    const targetLetter = LETTERS[targetLetterIdx];
    const baseMidiOfTarget = BASE_MIDI[targetLetter];
    
    let diff = (midiVal % 12) - baseMidiOfTarget; diff = ((diff + 6) % 12 + 12) % 12 - 6; 
    
    let accidentalStr = '';
    if (diff === -2) accidentalStr = 'bb'; else if (diff === -1) accidentalStr = 'b';
    else if (diff === 1) accidentalStr = '#'; else if (diff === 2) accidentalStr = 'x';
    return targetLetter + accidentalStr;
}

function getAmericanChords(romanProgression) {
    return romanProgression.split(' - ').map(r => { 
        const cleanRoman = r.split('/')[0].trim();
        const map = {'I':0,'IV':5,'V':7,'vi':9,'ii':2,'iii':4,'i':0,'iv':5,'bVI':8,'bVII':10, 'ii°':2, 'bIII': 3}; 
        const deg = map[cleanRoman.replace(/7|maj|m|°/g,'')] || 0;
        const rootNoteStr = getNoteNameDisplay(state.keyIndex + deg);
        let suffix = '';
        if (cleanRoman.includes('°')) suffix = 'dim';
        else if (cleanRoman === cleanRoman.toLowerCase() || cleanRoman.includes('m')) suffix = 'm';
        let invSuffix = '';
        if(r.includes('/')) {
            const inv = r.split('/')[1].trim();
            let bassOffset = deg;
            if(inv === '3') bassOffset = (deg + (suffix === 'm' || suffix === 'dim' ? 3 : 4)) % 12;
            if(inv === '5') bassOffset = (deg + (suffix === 'dim' ? 6 : 7)) % 12;
            invSuffix = '/' + getNoteNameDisplay(state.keyIndex + bassOffset);
        }
        return rootNoteStr + suffix + invSuffix; 
    }).join(' - ');
}

function getFunctionalClass(idx) {
    const absIdx = (idx % 12 + 12) % 12;
    if (absIdx === 0) return 'tonic';
    if ([7, 4, 3].includes(absIdx)) return 'stable';
    return 'unstable';
}

function getDegreeVisuals(functional, isBass) {
    const centerOffset = isBass ? functional : functional;
    const absDegree = (centerOffset % 12 + 12) % 12;
    const oct = Math.floor(centerOffset / 12);
    let arrow = '';
    
    if (oct < 0) arrow = '↓'.repeat(Math.abs(oct));
    else if (oct > 0) arrow = '↑'.repeat(oct);
    
    return { label: DEGREES[absDegree], arrow, isFundamental: absDegree === 0 };
}

function getPossibleMelodyNotes() {
    const isMin = state.currentRoundTonality === 'minor';
    switch (state.level) {
        case 'nivel1': return isMin ? [0, 2, 3, 5] : [0, 2, 4, 5];
        case 'nivel2': return isMin ? [7, 8, 10, 12] : [7, 9, 11, 12];
        case 'nivel3': return isMin ? [0, 2, 3, 5, 7, 8, 10, 12] : [0, 2, 4, 5, 7, 9, 11, 12];
        case 'nivel4': return [0, 1, 2, 3, 4, 5];
        case 'nivel5': return [6, 7, 8, 9, 10, 11, 12];
        case 'nivel6': return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        default: return [0, 5, 7, 12];
    }
}

function getPossibleBassNotes() {
    const isMin = state.currentRoundTonality === 'minor';
    const diatonicDegrees = isMin ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    let levelBase = [];
    switch (state.level) {
        case 'nivel1': levelBase = [0, 5, 7]; break; 
        case 'nivel2': levelBase = isMin ? [0, 3, 5, 7, 8] : [0, 4, 5, 7, 9]; break; 
        case 'nivel3': levelBase = isMin ? [0, 2, 3, 5, 7, 8] : [0, 2, 4, 5, 7, 9]; break; 
        case 'nivel4': levelBase = isMin ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]; break; 
        default: levelBase = diatonicDegrees; break;
    }
    let allowed = [];
    for(let i = -12; i <= 12; i++) {
        const degree = (i % 12 + 12) % 12;
        if (levelBase.includes(degree)) allowed.push(i);
    }
    return allowed;
}

function syncModeUI(m) {
    ['mode-mel-btn', 'mode-har-btn', 'mode-int-btn', 'mode-bass-btn'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.remove('active-choice');
    });
    const melBtn = document.getElementById('mode-mel-btn'); if(m === 'melody' && melBtn) melBtn.classList.add('active-choice');
    const intBtn = document.getElementById('mode-int-btn'); if(m === 'intervals' && intBtn) intBtn.classList.add('active-choice');
    const harBtn = document.getElementById('mode-har-btn'); if(m === 'harmony' && harBtn) harBtn.classList.add('active-choice');
    const bassBtn = document.getElementById('mode-bass-btn'); if(m === 'bass' && bassBtn) bassBtn.classList.add('active-choice');
    
    const tonSettings = document.getElementById('tonality-settings');
    if(tonSettings) tonSettings.style.display = (m === 'intervals') ? 'none' : 'flex';

    const bassSettings = document.getElementById('bass-settings');
    if(bassSettings) {
        if (m === 'bass') { bassSettings.classList.remove('hidden'); bassSettings.classList.add('flex'); }
        else { bassSettings.classList.add('hidden'); bassSettings.classList.remove('flex'); }
    }

    const intSettings = document.getElementById('interval-settings');
    const freePhaseSettings = document.getElementById('free-phase-settings');
    
    if (m === 'intervals') {
        if(intSettings) { intSettings.classList.remove('hidden'); intSettings.classList.add('flex'); }
        if(freePhaseSettings && (sessionState.type === 'free' || sessionState.type === 'explore')) { 
            freePhaseSettings.classList.remove('hidden'); freePhaseSettings.classList.add('flex');
            const curP = state.mastery.intervals.phase || 0;
            ['fp-0', 'fp-1', 'fp-2', 'fp-3'].forEach(id => {
                const el = document.getElementById(id); if(el) el.classList.remove('active-choice');
            });
            const curPEl = document.getElementById(`fp-${curP}`); if(curPEl) curPEl.classList.add('active-choice');
        }
    } else {
        if(intSettings) { intSettings.classList.add('hidden'); intSettings.classList.remove('flex'); }
        if(freePhaseSettings) { freePhaseSettings.classList.add('hidden'); freePhaseSettings.classList.remove('flex'); }
    }
}

function updateEvidenceStars() {
    const starsContainer = document.getElementById('evidence-stars');
    if (!starsContainer) return;
    if (sessionState.type === 'test') { starsContainer.classList.add('hidden'); return; }

    const m = state.mastery.intervals;
    const isReviewing = LEVEL_IDS.indexOf(state.level) < m.current_l;
    
    if (state.mode !== 'intervals' || isReviewing || m.phase === 0 || m.phase === 4) {
        starsContainer.classList.add('hidden');
        return;
    }
    
    starsContainer.classList.remove('hidden');
    const evidence = m.evidence;
    for(let i=1; i<=3; i++) {
        const star = document.getElementById(`star-${i}`);
        if (star) {
            if (i <= evidence) star.classList.add('active');
            else star.classList.remove('active');
        }
    }
}

function updateBufferDotsUI(count) {
    const bDots = document.getElementById('buffer-dots'); 
    if(bDots) { 
        bDots.innerHTML = '';
        if (count > 0) {
            const label = document.createElement('span');
            label.className = "text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-3 flex items-center";
            label.innerHTML = `<svg class="w-3.5 h-3.5 mr-1 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg> NOTAS A IDENTIFICAR (${count}):`;
            bDots.appendChild(label);
            
            const dotsWrapper = document.createElement('div');
            dotsWrapper.className = 'flex items-center gap-2';
            for(let i=0; i<count; i++) { 
                const dot = document.createElement('div'); 
                dot.className = 'buffer-dot shadow-sm'; 
                dotsWrapper.appendChild(dot); 
            }
            bDots.appendChild(dotsWrapper);
        }
    }
}

function resetUI() {
    const pMod = document.getElementById('practice-module'); if(pMod) pMod.classList.add('hidden');
    const bMod = document.getElementById('bass-module'); if(bMod) bMod.classList.add('hidden');
    const btnDel = document.getElementById('btn-delete'); if(btnDel) btnDel.classList.add('hidden');
    const btnDelBass = document.getElementById('btn-delete-bass'); if(btnDelBass) btnDelBass.classList.add('hidden');
    const hGrid = document.getElementById('harmony-grid'); if(hGrid) hGrid.classList.add('hidden');
    const iGrid = document.getElementById('interval-grid'); if(iGrid) iGrid.classList.add('hidden');
    const inGrid = document.getElementById('intruder-grid'); if(inGrid) inGrid.innerHTML = '';
    const htGrid = document.getElementById('hunt-grid'); if(htGrid) htGrid.innerHTML = '';
    const presMod = document.getElementById('presentation-module'); if(presMod) presMod.classList.add('hidden');
    const intMod = document.getElementById('intruder-module'); if(intMod) intMod.classList.add('hidden');
    const huntMod = document.getElementById('hunt-module'); if(huntMod) huntMod.classList.add('hidden');
    const eviStars = document.getElementById('evidence-stars'); if(eviStars) eviStars.classList.add('hidden');
    
    if(pMod) pMod.innerHTML = ''; if(hGrid) hGrid.innerHTML = ''; if(iGrid) iGrid.innerHTML = '';
    const bufDots = document.getElementById('buffer-dots'); if(bufDots) bufDots.innerHTML = '';
    updateBufferPreviewChips();
    renderUI();
}

function renderUI() {
    const isFree = sessionState.type === 'free' || sessionState.type === 'explore';
    const currentLevelIdx = state.mastery.intervals.current_l || 0;
    LEVEL_IDS.forEach((lvl, idx) => {
        const btn = document.getElementById(`lvl-${lvl}`);
        if(btn) {
            btn.classList.toggle('active-choice', state.level === lvl);
            btn.disabled = (idx > currentLevelIdx && !isFree && sessionState.type !== 'test');
        }
    });
    const scoreVal = document.getElementById('score-val'); if(scoreVal) scoreVal.innerText = state.xp || 0;
    const rootEl = document.getElementById('key-root'); if(rootEl) rootEl.innerText = state.keyLabel || 'C';
    const qualEl = document.getElementById('key-quality-label'); if(qualEl) qualEl.innerText = state.currentRoundTonality === 'major' ? 'MAYOR' : 'MENOR';
    const noteDisp = document.getElementById('note-count-display'); if (noteDisp) noteDisp.innerText = state.currentNoteCount;

    const noteCounterCont = document.getElementById('note-counter-container');
    if (noteCounterCont) {
        if (state.mode === 'melody') { noteCounterCont.classList.remove('hidden'); noteCounterCont.classList.add('flex'); } 
        else { noteCounterCont.classList.add('hidden'); noteCounterCont.classList.remove('flex'); }
    }

    const isBass = state.mode === 'bass';
    const activeMelodyNotes = isBass ? getPossibleBassNotes() : getPossibleMelodyNotes();
    const pStage = document.getElementById('piano-stage');
    const fStage = document.getElementById('fretboard-stage');
    
    if(pStage) {
        pStage.innerHTML = '';
        if (isBass && state.bassSettings?.view === 'fretboard') {
            pStage.classList.add('hidden'); fStage.classList.remove('hidden'); fStage.innerHTML = '';
            const stringCounts = state.bassSettings?.stringCount || 4;
            let strings = [];
            // Standard fretboard view: highest string at top, thickest/lowest string at bottom
            if (stringCounts === 4) strings = [43, 38, 33, 28]; // G2, D2, A1, E1
            else if (stringCounts === 5) strings = [43, 38, 33, 28, 23]; // G2, D2, A1, E1, B0
            else if (stringCounts === 6) strings = [48, 43, 38, 33, 28, 23]; // C3, G2, D2, A1, E1, B0

            const stringNames = { 48: 'C', 43: 'G', 38: 'D', 33: 'A', 28: 'E', 23: 'B' };
            const numFrets = 17;
            const fretboardInner = document.createElement('div');
            fretboardInner.className = "relative w-full h-full flex flex-col justify-between py-2.5 px-1";
            
            for (let f = 1; f <= numFrets; f++) {
                const fretLine = document.createElement('div'); fretLine.className = "absolute top-0 bottom-0 bg-gray-400 w-1 shadow-md pointer-events-none"; fretLine.style.left = `calc(${f} * (100% / ${numFrets}))`; fretboardInner.appendChild(fretLine);
            }
            [3, 5, 7, 9, 15].forEach(f => {
                const marker = document.createElement('div'); marker.className = "absolute w-3.5 h-3.5 bg-white/25 rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none"; marker.style.left = `calc((${f} - 0.5) * (100% / ${numFrets}))`; fretboardInner.appendChild(marker);
            });
            const m12a = document.createElement('div'); m12a.className = "absolute w-3 h-3 bg-white/25 rounded-full top-1/3 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none"; m12a.style.left = `calc((12 - 0.5) * (100% / ${numFrets}))`; fretboardInner.appendChild(m12a);
            const m12b = document.createElement('div'); m12b.className = "absolute w-3 h-3 bg-white/25 rounded-full top-2/3 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none"; m12b.style.left = `calc((12 - 0.5) * (100% / ${numFrets}))`; fretboardInner.appendChild(m12b);

            strings.forEach((openMidi, sIdx) => {
                const strDiv = document.createElement('div'); strDiv.className = "relative w-full flex-1 flex items-center z-10";
                // Top string (sIdx = 0) is thinnest, bottom string is thickest
                const lineThickness = 1.2 + (sIdx * 0.75);
                const strLine = document.createElement('div'); strLine.className = `absolute top-1/2 left-0 right-0 transform -translate-y-1/2 bg-gradient-to-b from-gray-200 to-gray-400 shadow-sm pointer-events-none`; strLine.style.height = `${lineThickness}px`; strDiv.appendChild(strLine);

                for (let f = 0; f < numFrets; f++) {
                    const midi = openMidi + f;
                    const btn = document.createElement('button');
                    btn.className = "fret-cell flex-1 h-full hover:bg-white/20 active:bg-violet-500/50 transition-colors z-20 flex items-center justify-center relative";
                    if (f === 0) btn.classList.add('border-r-4', 'border-amber-200/80', 'bg-black/30'); 
                    
                    const functional = midi - (state.keyIndex - 12);
                    const isTargetDegree = activeMelodyNotes.includes(functional); 

                    if (isTargetDegree) {
                        const vis = getDegreeVisuals(functional, true);
                        const bgColorClass = vis.isFundamental ? 'bg-red-500' : 'bg-bass';
                        const textColorClassOpen = vis.isFundamental ? 'text-red-400 border-red-500/50' : 'text-blue-300 border-blue-400/50';
                        
                        if (f > 0) btn.innerHTML = `<div class="fret-active-badge ${bgColorClass} text-white text-[9px] font-black w-5 h-5 rounded-full shadow-md flex items-center justify-center border border-white pointer-events-none leading-none tracking-tighter z-30">${vis.label}${vis.arrow}</div>`;
                        else btn.innerHTML = `<div class="fret-active-badge text-[8px] font-black ${textColorClassOpen} border leading-none tracking-tighter bg-black/70 px-1 py-0.5 rounded z-30">${stringNames[openMidi]}:${vis.label}${vis.arrow}</div>`;
                    } else if (f === 0) {
                        btn.innerHTML = `<span class="text-[7px] font-mono text-amber-200/60 font-bold">${stringNames[openMidi]}</span>`;
                    }
                    btn.onpointerdown = (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; triggerHaptic('tap'); initAudio(); playBassTone(midiToFreq(midi), 0.6); checkBassAnswer(functional); };
                    strDiv.appendChild(btn);
                }
                fretboardInner.appendChild(strDiv);
            });
            fStage.appendChild(fretboardInner);

        } else {
            if(fStage) fStage.classList.add('hidden');
            pStage.classList.remove('hidden');

            let startMidi = 48; let numKeys = 25; let totalWhiteKeys = 15; let blackRatio = 26;
            if (isBass) {
                startMidi = 24; numKeys = 37; totalWhiteKeys = 22; blackRatio = 36;
                pStage.style.minWidth = '620px'; pStage.style.maxWidth = '1120px';
            } else {
                pStage.style.minWidth = '460px'; pStage.style.maxWidth = '1040px';
            }

            const offsets = {0:0, 1:0.6, 2:1, 3:1.6, 4:2, 5:3, 6:3.6, 7:4, 8:4.6, 9:5, 10:5.6, 11:6};

            for(let i=0; i<numKeys; i++) {
                const midi = startMidi + i; const abs = midi % 12; 
                const isBlack = [1,3,6,8,10].includes(abs);
                const octaveOffset = Math.floor((midi - startMidi) / 12) * 7;
                let relPos = octaveOffset + offsets[abs];

                const btn = document.createElement('button');
                btn.id = `piano-key-${midi}`; btn.className = `piano-key ${isBlack ? 'key-black' : 'key-white'}`;
                btn.style.left = `calc(${relPos} * (100% / ${totalWhiteKeys}))`;
                btn.style.width = isBlack ? `calc(100% / ${blackRatio})` : `calc(100% / ${totalWhiteKeys})`;
                
                const functional = isBass ? midi - (state.keyIndex - 12) : midi - state.keyIndex;
                
                if (isBass) {
                    if(activeMelodyNotes.includes(functional)) { 
                        const name = getNoteNameDisplay(midi);
                        const vis = getDegreeVisuals(functional, true);
                        const bgColorClass = vis.isFundamental ? 'bg-red-500' : 'bg-bass';
                        btn.innerHTML = `<div class="${bgColorClass} text-[10px] sm:text-[12px] font-black px-1.5 py-0.5 rounded-full mb-0.5 text-white shadow-sm leading-none tracking-tighter">${vis.label}${vis.arrow}</div><div class="not-uppercase text-[9px] sm:text-[10px] font-black opacity-90">${name}</div>`;
                    }
                } else if (state.mode === 'melody') {
                    if (functional >= 0 && functional <= 12 && activeMelodyNotes.includes(functional)) {
                        const name = getNoteNameDisplay(midi);
                        btn.innerHTML = `<div class="bg-${getFunctionalClass(functional)} text-[10px] sm:text-[12px] font-black px-1.5 py-0.5 rounded-full mb-0.5 text-white shadow-sm leading-none tracking-tighter">${DEGREES[functional]}</div><div class="not-uppercase text-[9px] sm:text-[10px] font-black opacity-90">${name}</div>`;
                    }
                }
                
                btn.onpointerdown = (e) => {
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    triggerHaptic('tap');
                    initAudio();
                    if (isBass) playBassTone(midiToFreq(midi), 0.6); else playTone(midiToFreq(midi), 0.5);
                    btn.classList.add('playing'); setTimeout(() => btn.classList.remove('playing'), 200);
                    if(state.mode === 'melody' && state.target && functional >= 0 && functional <= 12) checkMelodyAnswer(functional);
                    else if (isBass && state.target) checkBassAnswer(functional);
                };
                pStage.appendChild(btn);
            }
        }
    }

    setTimeout(() => {
        const viewport = document.getElementById('piano-viewport');
        if(!viewport) return;
        if (isBass && state.bassSettings?.view === 'fretboard') {
            const fStageEl = document.getElementById('fretboard-stage');
            if (!fStageEl) return;
            const badges = fStageEl.querySelectorAll('.fret-active-badge');
            if (badges.length > 0) {
                let minLeft = Infinity, maxRight = 0;
                badges.forEach(b => {
                    const cell = b.closest('.fret-cell');
                    if (cell) {
                        minLeft = Math.min(minLeft, cell.offsetLeft);
                        maxRight = Math.max(maxRight, cell.offsetLeft + cell.offsetWidth);
                    }
                });
                if (minLeft < Infinity) {
                    const center = minLeft + (maxRight - minLeft) / 2;
                    viewport.scrollTo({ left: Math.max(0, center - (viewport.clientWidth / 2)), behavior: 'smooth' });
                }
            }
            return;
        }
        const stage = document.getElementById('piano-stage');
        if(!stage) return;
        const activeKeys = stage.querySelectorAll('.bg-tonic, .bg-stable, .bg-unstable, .bg-bass, .bg-red-500');
        if(activeKeys.length > 0) {
            const first = activeKeys[0].closest('.piano-key'); const last = activeKeys[activeKeys.length - 1].closest('.piano-key');
            if(first && last) {
                const firstLeft = first.offsetLeft; const lastRight = last.offsetLeft + last.offsetWidth;
                viewport.scrollTo({ left: (firstLeft + (lastRight - firstLeft) / 2) - (viewport.clientWidth / 2), behavior: 'smooth' });
            }
        }
    }, 100);

    updateEvidenceStars();

    const pcCont = document.getElementById('practice-module');
    if(pcCont && state.mode === 'melody') {
        pcCont.classList.remove('hidden'); const bd = document.getElementById('btn-delete'); if(bd) bd.classList.remove('hidden');
        getPossibleMelodyNotes().forEach(idx => {
            const card = document.createElement('div'); card.className = `practice-card bg-${getFunctionalClass(idx)} text-white shadow-sm`;
            card.innerHTML = DEGREES[idx]; card.onclick = () => { initAudio(); executeVisualResolution(idx); };
            pcCont.appendChild(card);
        });
    }

    const bCont = document.getElementById('bass-module');
    const bpCont = document.getElementById('bass-practice-module');
    if(bCont && state.mode === 'bass') {
        bCont.classList.remove('hidden'); bCont.classList.add('flex');
        const bInst = document.getElementById('bass-instruction');
        if (bInst) {
            const p = state.target?.bassPattern;
            bInst.innerText = p === 'tumbao' ? "♫ TUMBAO (SÍNCOPA)" : (p === 'balada' ? "♫ BALADA (CORCHEAS)" : (p === 'disco' ? "♫ DISCO/FUNK (OCTAVAS)" : (p === 'walking' ? "♫ WALKING BASS" : (p === 'riff' ? "🎸 DICTADO: RIFF MELÓDICO" : "♪ IDENTIFICA LAS FUNDAMENTALES"))));
        }
        const bd = document.getElementById('btn-delete-bass'); if(bd) bd.classList.remove('hidden');
        
        if(bpCont) {
            bpCont.innerHTML = '';
            const pool = state.target?.bassPattern === 'riff' ? state.target.sequence : getPossibleBassNotes();
            const uniquePool = [...new Set(pool)].sort((a,b)=>a-b);
            uniquePool.forEach(idx => {
                const vis = getDegreeVisuals(idx, true);
                const bgColorClass = vis.isFundamental ? 'bg-red-500' : 'bg-bass';
                const card = document.createElement('div'); card.className = `practice-card ${bgColorClass} text-white shadow-sm`;
                card.innerHTML = vis.label + vis.arrow; card.onclick = () => { initAudio(); playBassTone(midiToFreq((state.keyIndex - 12) + idx), 0.8); };
                bpCont.appendChild(card);
            });
        }
    }
}

function showTutorial(phaseKey, callback) {
    if (!TUTORIALS[phaseKey]) { callback(); return; }
    state.tutorialShown[phaseKey] = true; savePersistence();
    const modal = document.getElementById('tutorial-modal');
    const titleEl = document.getElementById('tutorial-title'); const descEl = document.getElementById('tutorial-desc'); const btnEl = document.getElementById('tutorial-btn');
    if(titleEl && descEl && btnEl && modal) {
        titleEl.innerText = TUTORIALS[phaseKey].title; descEl.innerText = TUTORIALS[phaseKey].desc;
        btnEl.onclick = () => { initAudio(); modal.style.display = 'none'; callback(); };
        modal.style.display = 'flex';
    } else callback(); 
}

function playPresentation(dirOverride) {
    if(state.target && !state.isPlaying) {
        
        stopAllSounds();
        playInterval(state.target.root, state.target.root + state.target.inv, dirOverride);
    }
}

function advanceFromPresentation() {
    if(sessionState.type === 'free' || sessionState.type === 'explore') {
        showNotice("Modo Manual Activo", "En el Modo Libre, tú tienes el control total. Utiliza el panel de \"Fase Manual\" para cambiar de fase a tu gusto.");
        return;
    }
    state.mastery.intervals.phase = 1; savePersistence(); generateQuestionLogic();
}

function startGame() {
    if(testTimerId) { clearInterval(testTimerId); testTimerId = null; }
    if (sessionState.type === 'test') {
        const tc = document.getElementById('test-timer-clock');
        if(tc) tc.innerText = 'Escucha...';
    }

     stopAllSounds(); initAudio();
    
    if (sessionState.active && sessionState.type === 'daily') {
        const weakest = getWeakestMode();
        const rand = Math.random();
        if (rand < 0.5) state.mode = weakest;
        else {
            const others = ['intervals', 'melody', 'harmony', 'bass'].filter(m => m !== weakest);
            state.mode = others[Math.floor(Math.random() * others.length)];
        }
        syncModeUI(state.mode);
    }

    state.keyLabel = (sessionState.type !== 'test' && fixedKey && fixedKey !== 'auto' && ROOT_INDICES[fixedKey] !== undefined)
        ? fixedKey
        : CIRCLE_OF_FIFTHS[Math.floor(Math.random() * CIRCLE_OF_FIFTHS.length)];
    state.keyIndex = 48 + ROOT_INDICES[state.keyLabel];
    setAudioStatus('Escuchando contexto tonal...', true);
    state.currentRoundTonality = state.mode !== 'intervals' && state.tonalityMode === 'combined' ? (Math.random() > 0.5 ? 'major' : 'minor') : state.tonalityMode;
    if(state.mode === 'intervals') state.currentRoundTonality = 'major';
    
    let phaseKey = state.mode;
    if (state.mode === 'intervals') {
        const m = state.mastery.intervals; const isReview = LEVEL_IDS.indexOf(state.level) < m.current_l;
        let cPhase = isReview ? 4 : m.phase; if (sessionState.type === 'test') cPhase = 3;
        phaseKey = cPhase === 0 ? 'presentation' : (cPhase === 1 ? 'intruder' : (cPhase === 2 ? 'hunt' : 'direct'));
    }

    if(!state.tutorialShown) state.tutorialShown = {}; if(!TUTORIALS[phaseKey]) phaseKey = 'direct';
    if(!state.tutorialShown[phaseKey] && sessionState.type !== 'test') showTutorial(phaseKey, generateQuestionLogic);
    else generateQuestionLogic();
}

function generateQuestionLogic() {
    state.questionStartTime = Date.now(); state.userBuffer = []; resetUI();

    if (state.mode === 'bass') {
        const lvlIdx = LEVEL_IDS.indexOf(state.level);
        let pattern = 'fundamental'; const patterns = ['fundamental'];
        if (lvlIdx >= 1) patterns.push('balada');
        if (lvlIdx >= 2) patterns.push('disco');
        if (lvlIdx >= 3) patterns.push('tumbao');
        if (lvlIdx >= 4) patterns.push('walking');
        if (lvlIdx >= 4) patterns.push('riff');
        pattern = sessionState.type === 'test' ? 'fundamental' : patterns[Math.floor(Math.random() * patterns.length)];

        let correctSequence = []; let bassOffsets = []; let correctProg = "I";

        if (pattern === 'riff') {
            const isMin = state.currentRoundTonality === 'minor';
            const licks = isMin ? [[0, 3, 5, 7], [0, 7, 10, 12], [0, 3, 0, -2]] : [[0, 2, 4, 7], [0, 4, 7, 9], [0, -5, 2, 0]];
            bassOffsets = licks[Math.floor(Math.random() * licks.length)];
            correctProg = isMin ? "i" : "I";
        } else {
            const list = getProgsForLevel(state.level, state.currentRoundTonality); 
            correctProg = sessionState.type === 'test' ? list[Math.floor(Math.random()*list.length)] : getWeightedTarget(list, 'har');
            bassOffsets = getBassSequence(correctProg);
        }

        correctSequence = bassOffsets.map(offset => offset);
        state.target = { answer: correctProg, bassPattern: pattern, sequence: correctSequence }; 
        state.currentNoteCount = correctSequence.length;

        renderUI();
        updateBufferDotsUI(state.currentNoteCount);
        const cadDur = playCadence();
        registerTimeout(() => { dispatchBassPattern(correctProg, bassOffsets, pattern); }, (cadDur + 0.5) * 1000); 

    } else if (state.mode === 'melody') {
        const pool = getPossibleMelodyNotes(); state.target = { sequence: [] };
        for(let i=0; i<state.currentNoteCount; i++) state.target.sequence.push(sessionState.type === 'test' ? pool[Math.floor(Math.random() * pool.length)] : getWeightedTarget(pool, 'mel'));
        
        updateBufferDotsUI(state.currentNoteCount);
        const cadDur = playCadence();
        registerTimeout(repeatSound, (cadDur + 0.5) * 1000); 
        if (sessionState.type === 'test') {
            registerTimeout(startTestTimer, (cadDur + 0.5 + (state.currentNoteCount * 0.8)) * 1000);
        }

    } else if (state.mode === 'harmony') {
        const hGrid = document.getElementById('harmony-grid'); if(hGrid) hGrid.classList.remove('hidden');
        const list = getProgsForLevel(state.level, state.currentRoundTonality); 
        const correct = sessionState.type === 'test' ? list[Math.floor(Math.random()*list.length)] : getWeightedTarget(list, 'har'); 
        const opts = [correct, ...list.filter(x => x !== correct).sort(()=>0.5-Math.random()).slice(0,3)].sort(()=>0.5-Math.random());
        state.target = { answer: correct }; 
        
        if(hGrid) {
            hGrid.innerHTML = '';
            opts.forEach(o => { 
                const btn = document.createElement('button'); btn.className = "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center min-h-[60px]";
                btn.innerHTML = `<div class="font-mono text-violet-500 font-black text-sm not-uppercase">${getAmericanChords(o)}</div><div class="opacity-60 text-[8px] font-bold mt-1">${o}</div>`; 
                btn.onclick = () => { if(state.isPlaying) return; const timeTaken = (Date.now() - state.questionStartTime) / 1000; handleResult(o === state.target.answer, o, state.target.answer, timeTaken, `har_${state.target.answer}`); }; 
                hGrid.appendChild(btn); 
            }); 
        }
        const cadDur = playCadence();
        registerTimeout(() => playProgression(correct), (cadDur + 0.5) * 1000); 
        if (sessionState.type === 'test') {
            const chordsCount = correct.split(' - ').length;
            registerTimeout(startTestTimer, (cadDur + 0.5 + (chordsCount * 1.4)) * 1000);
        }

    } else if (state.mode === 'intervals') {
        const m = state.mastery.intervals; const pool = PEDAGOGIA_INTERVALOS[state.level] || [0, 5, 7, 12];
        const isReviewingPastLevel = LEVEL_IDS.indexOf(state.level) < m.current_l;
        if (!isReviewingPastLevel && m.target_idx >= pool.length) { m.target_idx = pool.length - 1; if (m.phase < 4) m.phase = 4; }
        
        let currentPhase = isReviewingPastLevel ? 4 : m.phase; if (sessionState.type === 'test') currentPhase = 3; 
        updateEvidenceStars();
        const modePhaseInd = document.getElementById('mode-phase-indicator'); if (modePhaseInd) modePhaseInd.innerText = sessionState.type === 'test' ? 'TEST - RECONOCIMIENTO' : FASES_INTERVALOS[currentPhase] || 'INTERVALOS';

        if (currentPhase === 0) {
            const pMod = document.getElementById('presentation-module'); if (pMod) { pMod.classList.remove('hidden'); pMod.classList.add('flex'); }
            let targetIdx = m.target_idx; if (sessionState.type === 'free' || sessionState.type === 'explore') targetIdx = Math.floor(Math.random() * pool.length);
            const target = pool[targetIdx]; state.target = { inv: target, root: 48 + Math.floor(Math.random() * 12) };
            const pTargetEl = document.getElementById('presentation-target'); if(pTargetEl) pTargetEl.innerText = INTERVAL_NAMES[target];
            registerTimeout(() => playInterval(state.target.root, state.target.root + target, 'asc'), 500);
            
        } else if (currentPhase === 1) {
            const iMod = document.getElementById('intruder-module'); if(iMod) { iMod.classList.remove('hidden'); iMod.classList.add('flex'); }
            let targetIdx = m.target_idx; if (sessionState.type === 'free' || sessionState.type === 'explore') targetIdx = Math.floor(Math.random() * pool.length);
            const target = pool[targetIdx]; let basePool = pool.filter(i => i !== target);
            if (sessionState.type !== 'free' && sessionState.type !== 'explore' && targetIdx > 0) { let prev = pool.slice(0, targetIdx).filter(i => i !== target); if (prev.length > 0) basePool = prev; }
            let base = basePool.length > 0 ? basePool[Math.floor(Math.random() * basePool.length)] : (target === 7 ? 0 : 7);
            const isTargetIntruder = Math.random() > 0.5; const intrusoReal = isTargetIntruder ? target : base; const baseReal = isTargetIntruder ? base : target;

            datosIntruso.correctoIdx = Math.floor(Math.random() * 5); datosIntruso.intervalos = [];
            const grid = document.getElementById('intruder-grid');
            if (grid) {
                grid.innerHTML = '';
                const iInst = document.getElementById('intruder-instruction'); if (iInst) iInst.innerText = `ESCUCHA Y ENCUENTRA EL DIFERENTE`;
                for(let i=0; i<5; i++) {
                    const inv = (i === datosIntruso.correctoIdx) ? intrusoReal : baseReal; const root = 48 + Math.floor(Math.random() * 12);
                    datosIntruso.intervalos.push({ inv, root });
                    const flip = document.createElement('div'); flip.id = `intruder-card-${i}`; flip.className = "flip-container";
                    flip.innerHTML = `<div class="flip-inner"><div class="flip-front"><div class="play-icon-btn"><svg class="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg></div></div><div class="flip-back flex items-center justify-center break-words leading-tight"></div></div>`;
                    flip.onclick = () => checkIntervalAnswer(i, "Intruso"); grid.appendChild(flip);
                }
            }
            registerTimeout(playIntruderSequence, 800);

        } else if (currentPhase === 2) {
            const hMod = document.getElementById('hunt-module'); if(hMod) { hMod.classList.remove('hidden'); hMod.classList.add('flex'); }
            let targetIdx = m.target_idx; if (sessionState.type === 'free' || sessionState.type === 'explore') targetIdx = Math.floor(Math.random() * pool.length);
            const currentTarget = pool[targetIdx]; datosCaceria.targetInv = currentTarget; datosCaceria.cartas = []; datosCaceria.evaluado = false;
            let safePool = pool.filter(i => i !== currentTarget);
            if (sessionState.type !== 'free' && sessionState.type !== 'explore' && targetIdx > 0) { let prev = pool.slice(0, targetIdx).filter(i => i !== currentTarget); if (prev.length > 0) safePool = prev; }
            if (safePool.length === 0) safePool = [currentTarget === 7 ? 0 : 7];
            const count = Math.floor(Math.random() * 2) + 1; 
            const grid = document.getElementById('hunt-grid');
            if (grid) {
                grid.innerHTML = '';
                const hInst = document.getElementById('hunt-instruction'); if(hInst) hInst.innerText = `Encuentra ${count}x: ${INTERVAL_NAMES[datosCaceria.targetInv]}`;
                let targetsFound = 0;
                for(let i=0; i<5; i++) {
                    let isTarget = false; if (targetsFound < count && (Math.random() > 0.5 || (5-i) <= (count-targetsFound))) { isTarget = true; targetsFound++; }
                    let inv = isTarget ? datosCaceria.targetInv : safePool[Math.floor(Math.random() * safePool.length)]; const root = 48 + Math.floor(Math.random() * 12);
                    datosCaceria.cartas.push({ inv, root, isTarget, selected: false });
                    const flip = document.createElement('div'); flip.id = `hunt-card-${i}`; flip.className = "flip-container";
                    flip.innerHTML = `<div class="flip-inner"><div class="flip-front"><div class="play-icon-btn"><svg class="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg></div></div><div class="flip-back flex items-center justify-center break-words leading-tight"></div></div>`;
                    flip.onclick = () => { if(datosCaceria.evaluado || state.isPlaying) return; datosCaceria.cartas[i].selected = !datosCaceria.cartas[i].selected; flip.classList.toggle('selected'); };
                    grid.appendChild(flip);
                }
            }
            registerTimeout(playHuntSequence, 800);

        } else {
            const iGridMod = document.getElementById('interval-grid'); if (iGridMod) iGridMod.classList.remove('hidden');
            let target;
            if (sessionState.type === 'test' || sessionState.type === 'explore') target = pool[Math.floor(Math.random() * pool.length)];
            else if (sessionState.type === 'free') target = getWeightedTarget(pool, 'int');
            else { const masteredPool = currentPhase === 4 ? pool : pool.slice(0, m.target_idx + 1); target = getWeightedTarget(masteredPool, 'int'); }
            
            const root = 48 + Math.floor(Math.random() * 12); state.target = { inv: target, root: root };
            const grid = document.getElementById('interval-grid');
            if (grid) {
                grid.innerHTML = '';
                const displayPool = sessionState.type === 'test' ? pool : (currentPhase === 4 ? pool : pool.slice(0, m.target_idx + 1));
                displayPool.forEach(idx => {
                    const b = document.createElement('button'); b.className = "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl text-[10px] font-black uppercase shadow-sm active:scale-95 transition-all";
                    b.innerText = INTERVAL_NAMES[idx]; b.onclick = () => checkIntervalAnswer(idx, "Directo"); grid.appendChild(b);
                });
            }
            const cadDur = playCadence();
            registerTimeout(() => { playInterval(root, root + target); }, (cadDur + 0.5) * 1000);
            if (sessionState.type === 'test') {
                registerTimeout(startTestTimer, (cadDur + 2.1) * 1000);
            }
        }
    }
}

function playIntruderSequence() {
    if (state.isPlaying) return; state.isPlaying = true; let t = 0;
    
    initAudio();
    datosIntruso.intervalos.forEach((data, i) => {
        registerTimeout(() => {
            const card = document.getElementById(`intruder-card-${i}`);
            if(card) { card.classList.add('ring-4', 'ring-violet-500'); setTimeout(() => card.classList.remove('ring-4', 'ring-violet-500'), 1000); }
            playInterval(data.root, data.root + data.inv);
        }, t * 1000);
        t += 1.8;
    });
    registerTimeout(() => state.isPlaying = false, t * 1000);
}

function playHuntSequence() {
    if (state.isPlaying) return; state.isPlaying = true; let t = 0;
    
    initAudio();
    datosCaceria.cartas.forEach((data, i) => {
        registerTimeout(() => {
            const card = document.getElementById(`hunt-card-${i}`);
            if(card) { card.classList.add('ring-4', 'ring-violet-400'); setTimeout(() => card.classList.remove('ring-4', 'ring-violet-400'), 1000); }
            playInterval(data.root, data.root + data.inv);
        }, t * 1000);
        t += 1.8;
    });
    registerTimeout(() => state.isPlaying = false, t * 1000);
}

function checkMelodyAnswer(val) {
    if (state.isPlaying || !state.target || state.mode !== 'melody') return;
    state.userBuffer.push(val);
    updateBufferPreviewChips();
    const dots = document.querySelectorAll('.buffer-dot'); if(dots && dots[state.userBuffer.length-1]) dots[state.userBuffer.length-1].classList.add('active');
    const rem = state.target.sequence.length - state.userBuffer.length;
    if (rem > 0) setAudioStatus(`Faltan ${rem} nota${rem > 1 ? 's' : ''}...`, false);
    if(state.userBuffer.length === state.target.sequence.length) {
        const timeTaken = (Date.now() - state.questionStartTime) / 1000;
        if(!state.hours) state.hours = { intervals: 0, melody: 0, harmony: 0, bass: 0 }; state.hours.melody += timeTaken;
        const isCorrect = state.userBuffer.every((v, i) => v === state.target.sequence[i]);
        const uAns = state.userBuffer.map(x => DEGREES[x]).join(' - '); const cAns = state.target.sequence.map(x => DEGREES[x]).join(' - ');
        const trackKey = `mel_${state.target.sequence[0]}`;

        if (isCorrect) {
            const resolveTime = executeVisualResolution(state.target.sequence[state.target.sequence.length - 1]);
            registerTimeout(() => handleResult(isCorrect, uAns, cAns, timeTaken, trackKey), (resolveTime * 1000) + 400);
        } else registerTimeout(() => handleResult(isCorrect, uAns, cAns, timeTaken, trackKey), 500);
    }
}

function checkBassAnswer(val) {
    if (state.isPlaying || !state.target || state.mode !== 'bass') return;
    state.userBuffer.push(val);
    updateBufferPreviewChips();
    const dots = document.querySelectorAll('.buffer-dot'); if(dots && dots[state.userBuffer.length-1]) dots[state.userBuffer.length-1].classList.add('active');
    const rem = state.target.sequence.length - state.userBuffer.length;
    if (rem > 0) setAudioStatus(`Bajo: faltan ${rem} nota${rem > 1 ? 's' : ''}...`, false);
    
    if(state.userBuffer.length === state.target.sequence.length) {
        const timeTaken = (Date.now() - state.questionStartTime) / 1000;
        if(!state.hours) state.hours = { intervals: 0, melody: 0, harmony: 0, bass: 0 }; state.hours.bass += timeTaken;

        const isCorrect = state.userBuffer.every((v, i) => v === state.target.sequence[i]);
        const uAns = state.userBuffer.map(x => { const vis = getDegreeVisuals(x, true); return vis.label + vis.arrow; }).join(' - ');
        const cAns = state.target.sequence.map(x => { const vis = getDegreeVisuals(x, true); return vis.label + vis.arrow; }).join(' - ');
        
        const trackKey = `bass_${(state.target.sequence[0] % 12 + 12) % 12}`;
        registerTimeout(() => handleResult(isCorrect, uAns, cAns, timeTaken, trackKey), 500);
    }
}

function checkIntervalAnswer(val, type) {
    if (state.isPlaying) return;
    const timeTaken = (Date.now() - state.questionStartTime) / 1000;
    if(!state.hours) state.hours = { intervals: 0, melody: 0, harmony: 0, bass: 0 }; state.hours.intervals += timeTaken;

    let isCorrect = false; let uAns = ""; let cAns = ""; let trackKey = null;

    if (type === "Intruso") {
        isCorrect = (val === datosIntruso.correctoIdx);
        document.querySelectorAll('#intruder-grid .flip-container').forEach((c, idx) => {
            c.classList.add('flipped');
            const back = c.querySelector('.flip-back');
            if (back) {
                const inv = datosIntruso.intervalos[idx].inv; back.innerText = INTERVAL_NAMES[inv];
                if (idx === datosIntruso.correctoIdx) back.classList.add('card-correct');
                else if (idx === val && !isCorrect) back.classList.add('card-incorrect');
                else back.style.opacity = '0.4';
            }
        });
        const targetInv = datosIntruso.intervalos[datosIntruso.correctoIdx].inv; const baseInv = datosIntruso.intervalos[(datosIntruso.correctoIdx + 1) % 5].inv;
        uAns = isCorrect ? "¡Intruso encontrado!" : "Fallo"; cAns = `Intruso: ${INTERVAL_NAMES[targetInv]}\nBase: ${INTERVAL_NAMES[baseInv]}`; trackKey = `int_${targetInv}`;
        registerTimeout(() => handleResult(isCorrect, uAns, cAns, timeTaken, trackKey), isCorrect ? 2500 : 4000);
        return;
    } else if (type === "Directo") {
        isCorrect = (val === state.target.inv); uAns = INTERVAL_NAMES[val]; cAns = INTERVAL_NAMES[state.target.inv]; trackKey = `int_${state.target.inv}`;
    }
    handleResult(isCorrect, uAns, cAns, timeTaken, trackKey);
}

function evaluarCaceria() {
    if (datosCaceria.evaluado || state.isPlaying) return;
    datosCaceria.evaluado = true;
    const timeTaken = (Date.now() - state.questionStartTime) / 1000;
    if(!state.hours) state.hours = { intervals: 0, melody: 0, harmony: 0, bass: 0 }; state.hours.intervals += timeTaken;
    
    let perfecto = true;
    datosCaceria.cartas.forEach(c => { if (c.isTarget && !c.selected) perfecto = false; if (!c.isTarget && c.selected) perfecto = false; });

    document.querySelectorAll('#hunt-grid .flip-container').forEach((c, idx) => {
        c.classList.add('flipped');
        const back = c.querySelector('.flip-back');
        if (back) {
            const cardData = datosCaceria.cartas[idx]; back.innerText = INTERVAL_NAMES[cardData.inv];
            if (cardData.isTarget && cardData.selected) back.classList.add('card-correct');
            else if (!cardData.isTarget && cardData.selected) back.classList.add('card-incorrect');
            else if (cardData.isTarget && !cardData.selected) back.classList.add('card-missed');
            else back.style.opacity = '0.4';
        }
    });
    const delay = perfecto ? 2500 : 4000;
    registerTimeout(() => handleResult(perfecto, perfecto ? "¡Todo Correcto!" : "Fallo", "Selección Perfecta", timeTaken, `int_${datosCaceria.targetInv}`), delay);
}

function triggerConfetti() { 
    const container = document.getElementById('confetti-container'); 
    if(!container) return; 
    container.innerHTML = ''; 
    for(let i=0; i<30; i++) { 
        const el = document.createElement('div'); 
        el.className = 'confetti-piece'; 
        el.style.left = Math.random() * 100 + '%'; 
        el.style.backgroundColor = ['#8b5cf6', '#10b981', '#f59e0b'][Math.floor(Math.random()*3)]; 
        el.style.animation = `confettiDrop ${1 + Math.random()}s ease-out forwards`; 
        container.appendChild(el); 
    } 
}

function handleResult(isCorrect, userStr, correctStr, timeTaken = 5, trackKey = null) {
    if (sessionState.type === 'test') {
        handleTestResult(isCorrect, userStr, correctStr);
        return;
    }

    if (trackKey && sessionState.type !== 'free' && sessionState.type !== 'explore') {
        if (!state.errorStats) state.errorStats = {}; if (!state.errorStats[trackKey]) state.errorStats[trackKey] = { c: 0, t: 0, lastPlayed: 0 };
        state.errorStats[trackKey].t++; if (isCorrect) state.errorStats[trackKey].c++; state.errorStats[trackKey].lastPlayed = Date.now();
    }
    
    if (state.mode === 'harmony' && trackKey && sessionState.type !== 'explore') {
        if(!state.hours) state.hours = { intervals: 0, melody: 0, harmony: 0, bass: 0 };
        state.hours.harmony += timeTaken;
    }

    if (isCorrect && sessionState.type !== 'explore') {
        state.xp += 10; state.streak++; updateStreakRecord();
        const combo = document.getElementById('combo-display');
        if (combo && state.streak > 1) { combo.innerText = `COMBO x${state.streak} 🔥`; combo.classList.add('combo-active'); registerTimeout(() => combo.classList.remove('combo-active'), 1500); }
    } else if (sessionState.type !== 'explore') state.streak = 0; 

    if (state.mode === 'intervals' && trackKey && sessionState.type !== 'free' && sessionState.type !== 'explore') {
        const m = state.mastery.intervals; const isReviewingPastLevel = LEVEL_IDS.indexOf(state.level) < m.current_l;
        if (!isReviewingPastLevel) {
            m.level_time = (m.level_time || 0) + Math.min(timeTaken, 30); 
            if (m.phase >= 1 && m.phase <= 3) {
                if (isCorrect) {
                    m.evidence = (m.evidence || 0) + 1; updateEvidenceStars(); 
                    if (m.evidence >= 3) {
                        m.evidence = 0; m.phase++; const poolLength = (PEDAGOGIA_INTERVALOS[state.level] || []).length;
                        if (m.phase === 3 && m.target_idx === 0) { m.phase = 0; if (m.target_idx < poolLength - 1) m.target_idx++; } 
                        else if (m.phase > 3) {
                            m.phase = 0; if (m.target_idx < poolLength - 1) m.target_idx++; 
                            else {
                                if (m.level_time >= 10800 && m.current_l < 5) { m.current_l++; m.target_idx = 1; m.phase = 0; m.level_time = 0; state.level = LEVEL_IDS[m.current_l]; } 
                                else m.phase = 4; 
                            }
                        }
                    }
                } else { m.evidence = Math.max(0, (m.evidence || 0) - 1); updateEvidenceStars(); }
            } else if (m.phase === 4) {
                if (m.level_time >= 10800 && m.current_l < 5) { m.current_l++; m.target_idx = 1; m.phase = 0; m.level_time = 0; state.level = LEVEL_IDS[m.current_l]; }
            }
        }
    }

    if (sessionState.type !== 'explore') savePersistence();
    triggerHaptic(isCorrect ? 'success' : 'error');

    const modalRes = document.getElementById('result-modal'); if (modalRes) modalRes.style.display = 'flex';
    const btnContinue = document.getElementById('btn-continue-modal');
    if (btnContinue) {
        btnContinue.onclick = function() { modalRes.style.display = 'none'; startGame(); };
        if (isCorrect) { btnContinue.style.display = 'none'; triggerConfetti(); registerTimeout(() => { modalRes.style.display = 'none'; startGame(); }, 1500); } 
        else btnContinue.style.display = 'block'; 
    }

    const rTitle = document.getElementById('result-title'); if(rTitle) rTitle.innerText = isCorrect ? "¡Excelente!" : "Casi...";
    const rIcon = document.getElementById('result-icon'); if(rIcon) rIcon.innerText = isCorrect ? "🎉" : "❌";
    const rUser = document.getElementById('result-user'); if(rUser) rUser.innerText = userStr;
    const rCorrect = document.getElementById('result-correct'); if(rCorrect) rCorrect.innerText = correctStr;
    const cBlock = document.getElementById('correct-block'); if(cBlock) cBlock.classList.toggle('hidden', isCorrect);
}

function handleContinue() { document.getElementById('result-modal').style.display = 'none'; startGame(); }

function getWeakestMode() {
    if (!state.errorStats || Object.keys(state.errorStats).length === 0) return 'melody';
    let stats = { mel: { c: 0, t: 0 }, har: { c: 0, t: 0 }, int: { c: 0, t: 0 }, bass: { c: 0, t: 0 } };
    for (const [key, data] of Object.entries(state.errorStats)) {
        const modePrefix = key.split('_')[0]; 
        if (stats[modePrefix]) { stats[modePrefix].c += data.c; stats[modePrefix].t += data.t; }
    }
    let weakest = 'melody'; let lowestAcc = 100; let hasValidData = false;
    for (const m of ['int', 'mel', 'har', 'bass']) {
        if (stats[m].t >= 5) { 
            hasValidData = true;
            const acc = (stats[m].c / stats[m].t) * 100;
            if (acc < lowestAcc) {
                lowestAcc = acc;
                weakest = m === 'int' ? 'intervals' : (m === 'mel' ? 'melody' : (m === 'har' ? 'harmony' : 'bass'));
            }
        }
    }
    return hasValidData ? weakest : 'melody';
}

function getTopStrengths() {
    if (!state.errorStats) return [];
    let list = [];
    for (const [key, stats] of Object.entries(state.errorStats)) {
        if (stats.t >= 1) {
            const acc = (stats.c / stats.t) * 100;
            if (acc >= 70) list.push({key, acc});
        }
    }
    return list.sort((a,b)=>b.acc-a.acc).slice(0, 3).map(i => formatStatName(i.key));
}

function getTopWeaknesses() {
    if (!state.errorStats) return [];
    let list = [];
    for (const [key, stats] of Object.entries(state.errorStats)) {
        if (stats.t >= 1) {
            const acc = (stats.c / stats.t) * 100;
            if (acc <= 50) list.push({key, acc});
        }
    }
    return list.sort((a,b)=>a.acc-b.acc).slice(0, 3).map(i => formatStatName(i.key));
}

function formatStatName(key) {
    let name = key.split('_')[1];
    if (key.startsWith('int')) return `Intervalo: ${INTERVAL_NAMES[name]}`;
    if (key.startsWith('mel')) return `Melodía (Grado ${DEGREES[name]})`;
    if (key.startsWith('bass')) return `Bajo (Grado ${DEGREES[name]})`;
    if (key.startsWith('har')) return `Acorde: ${name}`;
    return name;
}

function getWeightedTarget(pool, type) {
    if (!state.errorStats) state.errorStats = {};
    let weights = pool.map(val => {
        const stats = state.errorStats[`${type}_${val}`];
        if (!stats || stats.t < 3) return 100; 
        const acc = stats.c / stats.t;
        const daysSince = stats.lastPlayed ? (Date.now() - stats.lastPlayed) / (1000 * 60 * 60 * 24) : 0;
        const timeWeight = Math.min(daysSince * 10, 50); 
        const accWeight = 10 + ((1 - acc) * 150); 
        return accWeight + timeWeight; 
    });
    const totalWeight = weights.reduce((a,b)=>a+b,0);
    let r = Math.random() * totalWeight;
    for(let i=0; i<pool.length; i++) {
        r -= weights[i];
        if(r <= 0) return pool[i];
    }
    return pool[0];
}

function openStats() {
    const modal = document.getElementById('stats-modal');
    const xpEl = document.getElementById('stats-xp'); if(xpEl) xpEl.innerText = state.xp || 0;
    const streakEl = document.getElementById('stats-streak'); if(streakEl) streakEl.innerText = (state.dailyStreak || 0) + ' 🔥';
    
    const h = state.hours || { intervals: 0, melody: 0, harmony: 0, bass: 0 };
    const mInt = Math.floor((h.intervals || 0) / 60);
    const mMel = Math.floor((h.melody || 0) / 60);
    const mHar = Math.floor((h.harmony || 0) / 60);
    const mBass = Math.floor((h.bass || 0) / 60);
    const totalM = mInt + mMel + mHar + mBass;
    
    const totalTimeEl = document.getElementById('stats-total-time'); if(totalTimeEl) totalTimeEl.innerText = `${totalM}m`;
    const timeIntEl = document.getElementById('time-int'); if(timeIntEl) timeIntEl.innerText = `${mInt}m`;
    const timeMelEl = document.getElementById('time-mel'); if(timeMelEl) timeMelEl.innerText = `${mMel}m`;
    const timeHarEl = document.getElementById('time-har'); if(timeHarEl) timeHarEl.innerText = `${mHar}m`;
    const timeBassEl = document.getElementById('time-bass'); if(timeBassEl) timeBassEl.innerText = `${mBass}m`;

    const donutEl = document.getElementById('stats-donut');
    if(donutEl) {
        if (totalM > 0) {
            const pInt = (mInt / totalM) * 100;
            const pMel = (mMel / totalM) * 100;
            const pHar = (mHar / totalM) * 100;
            donutEl.style.background = `conic-gradient(#8b5cf6 0% ${pInt}%, #10b981 ${pInt}% ${pInt+pMel}%, #f59e0b ${pInt+pMel}% ${pInt+pMel+pHar}%, #3b82f6 ${pInt+pMel+pHar}% 100%)`;
        } else {
            donutEl.style.background = `conic-gradient(#cbd5e1 0% 100%)`;
        }
    }

    const stList = document.getElementById('stats-strengths');
    const wkList = document.getElementById('stats-weaknesses');
    if(stList) stList.innerHTML = ''; if(wkList) wkList.innerHTML = '';

    let hasData = false;
    if(state.errorStats) {
        for (const [key, stats] of Object.entries(state.errorStats)) {
            if (stats.t >= 1) {
                hasData = true;
                const acc = (stats.c / stats.t) * 100;
                const li = document.createElement('li');
                li.innerText = `${formatStatName(key)} (${acc.toFixed(0)}%)`;
                if (acc >= 70 && stList) stList.appendChild(li);
                else if (acc <= 50 && wkList) wkList.appendChild(li);
            }
        }
    }

    if (!hasData || (stList && stList.innerHTML === '')) { if(stList) stList.innerHTML = '<li class="text-slate-400 italic">No hay datos suficientes</li>'; }
    if (!hasData || (wkList && wkList.innerHTML === '')) { if(wkList) wkList.innerHTML = '<li class="text-slate-400 italic">No hay datos suficientes</li>'; }

    const histList = document.getElementById('session-history-list');
    if(histList) {
        histList.innerHTML = '';
        if (state.sessionHistory && state.sessionHistory.length > 0) {
            state.sessionHistory.forEach(s => {
                const el = document.createElement('div');
                el.className = "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs flex flex-col gap-1 border border-slate-100 dark:border-slate-700";
                const d = new Date(s.date);
                const dur = Math.floor((s.duration || 0) / 60);
                let typeLabel = s.type === 'daily' ? 'Rutina Diaria' : (s.type === 'test' ? 'Test de Nivelación' : (s.type === 'explore' ? 'Exploración' : 'Práctica Libre'));
                el.innerHTML = `
                    <div class="flex justify-between font-black text-slate-600 dark:text-slate-300">
                        <span>${d.toLocaleDateString()} - ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span class="text-violet-500">${dur} min</span>
                    </div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-widest">${typeLabel} | XP Obtenida: <span class="text-emerald-500">+${s.xpGained || 0}</span></div>
                `;
                histList.appendChild(el);
            });
        } else {
            histList.innerHTML = '<div class="text-slate-400 italic text-xs">No hay sesiones completadas aún.</div>';
        }
    }

    if(modal) modal.style.display = 'flex';
}

function closeStats() { const modal = document.getElementById('stats-modal'); if(modal) modal.style.display = 'none'; }

function startRealPlacementTest() {
    sessionState.type = 'test';
    state.test = { lives: 3, levelIdx: 0, qIdx: 0, active: true };
    document.getElementById('start-modal').style.display = 'none';
    document.body.classList.add('test-mode'); 
    document.getElementById('test-hud').classList.remove('hidden');
    document.getElementById('test-hud').classList.add('flex');
    updateTestHUD();
    generateTestQuestion();
}

function updateTestHUD() {
    document.getElementById('test-level-display').innerText = `Nivel ${state.test.levelIdx + 1}`;
    let hearts = "";
    for(let i=0; i<state.test.lives; i++) hearts += "❤️";
    for(let i=state.test.lives; i<3; i++) hearts += "🖤";
    document.getElementById('test-lives').innerText = hearts;
}

function startTestTimer() {
    if(testTimerId) clearInterval(testTimerId);
    let timeLeft = 8;
    const clockEl = document.getElementById('test-timer-clock');
    if(clockEl) clockEl.innerText = timeLeft + 's';
    
    testTimerId = setInterval(() => {
        timeLeft--;
        if(clockEl) clockEl.innerText = timeLeft + 's';
        if(timeLeft <= 0) {
            clearInterval(testTimerId);
            handleTestResult(false, "Tiempo Agotado", "Debes responder más rápido");
        }
    }, 1000);
}

function exitTest() {
    showCustomConfirm("Salir del Test", "¿Seguro que deseas salir del test? Se perderá el progreso actual de esta prueba.", () => {
        if(testTimerId) { clearInterval(testTimerId); testTimerId = null; }
        
        stopAllSounds(); 
        state.test.active = false;
        document.body.classList.remove('test-mode');
        const testHud = document.getElementById('test-hud');
        if (testHud) { testHud.classList.add('hidden'); testHud.classList.remove('flex'); }
        document.getElementById('start-modal').style.display = 'flex';
    });
}

function generateTestQuestion() {
    if(!state.test.active) return;
    state.level = LEVEL_IDS[state.test.levelIdx];
    const testModes = ['intervals', 'melody', 'harmony'];
    state.mode = testModes[state.test.qIdx];
    if (state.mode === 'intervals') state.mastery.intervals.phase = 3;
    else if (state.mode === 'melody') {
        if(state.test.levelIdx === 0) state.currentNoteCount = 2;
        else if(state.test.levelIdx <= 2) state.currentNoteCount = 3;
        else state.currentNoteCount = 4;
    }
    syncModeUI(state.mode);
    startGame();
}

function handleTestResult(isCorrect, userStr, correctStr) {
    if(testTimerId) { clearInterval(testTimerId); testTimerId = null; }
    
    stopAllSounds(); 
    
    if (!isCorrect) { state.test.lives--; updateTestHUD(); }
    triggerHaptic(isCorrect ? 'success' : 'error');
    if (state.test.lives <= 0) { endPlacementTest(state.test.levelIdx); return; }

    const modalRes = document.getElementById('result-modal'); if(modalRes) modalRes.style.display = 'flex';
    const btnContinue = document.getElementById('btn-continue-modal');
    const rTitle = document.getElementById('result-title'); if(rTitle) rTitle.innerText = isCorrect ? "¡Bien!" : "Fallo";
    const rIcon = document.getElementById('result-icon'); if(rIcon) rIcon.innerText = isCorrect ? "⚡" : "❌";
    const rUser = document.getElementById('result-user'); if(rUser) rUser.innerText = userStr;
    const rCorrect = document.getElementById('result-correct'); if(rCorrect) rCorrect.innerText = correctStr;
    const cBlock = document.getElementById('correct-block'); if(cBlock) cBlock.classList.toggle('hidden', isCorrect);

    if (isCorrect) {
        if(btnContinue) btnContinue.style.display = 'none';
        setTimeout(() => { if(modalRes) modalRes.style.display = 'none'; advanceTest(); }, 1200);
    } else {
        if(btnContinue) {
            btnContinue.style.display = 'block';
            btnContinue.onclick = function() { if(modalRes) modalRes.style.display = 'none'; advanceTest(); };
        }
    }
}

function advanceTest() {
    state.test.qIdx++;
    if (state.test.qIdx > 2) { state.test.qIdx = 0; state.test.levelIdx++; }
    if (state.test.levelIdx > 5) endPlacementTest(5, true); 
    else { updateTestHUD(); generateTestQuestion(); }
}

function endPlacementTest(levelReached, won = false) {
    state.test.active = false;
    document.body.classList.remove('test-mode');
    const testHud = document.getElementById('test-hud');
    if (testHud) { testHud.classList.add('hidden'); testHud.classList.remove('flex'); }
    state.mastery.intervals.current_l = levelReached;
    state.level = LEVEL_IDS[levelReached];
    state.rankIdx = won ? 7 : (levelReached + 1); 
    savePersistence();
    showNotice("Test Finalizado", `Has sido asignado al ${LEVEL_IDS[levelReached].toUpperCase()}.\nTu nuevo rango es: ${RANK_NAMES[state.rankIdx]}.\n\n¡Sigue practicando en tu Rutina Diaria!`);
    setTimeout(() => location.reload(), 3000);
}

function changeNoteCount(delta) { let newVal = state.currentNoteCount + delta; newVal = Math.max(1, Math.min(10, newVal)); if (newVal !== state.currentNoteCount) { state.currentNoteCount = newVal; resetUI(); if(state.target) startGame(); } }
function deleteLastNote() {
    if (state.userBuffer && state.userBuffer.length > 0) {
        state.userBuffer.pop();
        updateBufferPreviewChips();
        const dots = document.querySelectorAll('.buffer-dot');
        if (dots && dots[state.userBuffer.length]) dots[state.userBuffer.length].classList.remove('active');
        setAudioStatus('Nota borrada · Continúa respondiendo', false);
    }
}
function setTonalityMode(mode) { state.tonalityMode = mode; ['ton-major', 'ton-minor', 'ton-combined'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('active-choice'); }); const tModeEl = document.getElementById(`ton-${mode}`); if(tModeEl) tModeEl.classList.add('active-choice'); state.currentRoundTonality = mode === 'combined' ? 'major' : mode; syncFixedKeyUI(); resetUI(); if(state.target) startGame(); }
function setIntervalDirection(dir) { state.intervalDirection = dir; document.querySelectorAll('button[id^="int-dir-"]').forEach(b => b.classList.remove('active-choice')); const intDirEl = document.getElementById(`int-dir-${dir}`); if(intDirEl) intDirEl.classList.add('active-choice'); }
function setFreePhase(phaseIdx) { if ((sessionState.type !== 'free' && sessionState.type !== 'explore') || state.mode !== 'intervals') return; state.mastery.intervals.phase = phaseIdx; ['fp-0', 'fp-1', 'fp-2', 'fp-3'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('active-choice'); }); const pIdxEl = document.getElementById(`fp-${phaseIdx}`); if(pIdxEl) pIdxEl.classList.add('active-choice'); resetUI(); if(state.target) startGame(); }
function setLevel(lvl) {
    const idx = LEVEL_IDS.indexOf(lvl);
    if (sessionState.type !== 'free' && sessionState.type !== 'explore' && sessionState.type !== 'test' && idx > state.mastery.intervals.current_l) {
        showNotice("Nivel Bloqueado", "Debes acumular más horas de práctica y dominar los intervalos anteriores para desbloquear este nivel."); return;
    }
    state.level = lvl; resetUI(); if (state.target) startGame();
}
function setGlobalMode(m) {  stopAllSounds(); state.mode = m; syncModeUI(m); resetUI(); if (state.target) startGame(); }

function applySavedTheme() {
    const savedTheme = localStorage.getItem('fop_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
    } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark');
        updateThemeIcon(false);
    }
    const volSlider = document.getElementById('master-volume');
    if (volSlider) volSlider.value = globalVolume;
    setPlaybackSpeed(playbackSpeed);
    syncFixedKeyUI();
}

function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'flex';
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
}

window.handleAndroidBack = function () {
    const closable = ['confirm-modal', 'info-modal', 'tutorial-modal', 'settings-modal', 'stats-modal', 'result-modal'];
    for (const id of closable) {
        const el = document.getElementById(id);
        if (el && el.style.display === 'flex') {
            el.style.display = 'none';
            return 'handled';
        }
    }
    const startM = document.getElementById('start-modal');
    const userM = document.getElementById('user-modal');
    const inStartOrUser = (startM && startM.style.display === 'flex') || (userM && userM.style.display === 'flex');
    if (!inStartOrUser && activeUserId) {
        confirmExit();
        return 'handled';
    }
    return 'exit';
};

function initIntroSplash() {
    const splash = document.getElementById('introSplashOverlay');
    if (!splash) {
        initUsers();
        return;
    }

    let finished = false;
    const finishSplash = () => {
        if (finished) return;
        finished = true;
        if (!welcomeDone) {
            welcomeDone = true;
            initUsers();
        }
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.classList.add('hidden-splash');
        }, 650);
    };

    setTimeout(finishSplash, 5200);
}

function replayIntroSplash() {
    const splash = document.getElementById('introSplashOverlay');
    const bar = document.getElementById('introSplashProgressBar');
    if (!splash) return;
    splash.classList.remove('hidden-splash', 'fade-out');
    if (bar) {
        bar.style.animation = 'none';
        void bar.offsetWidth;
        bar.style.animation = '';
    }
    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.classList.add('hidden-splash');
        }, 650);
    }, 5200);
}

function isAnyBlockingModalOpen() {
    const splash = document.getElementById('introSplashOverlay');
    if (splash && !splash.classList.contains('hidden-splash') && !splash.classList.contains('fade-out')) return true;
    const ids = ['user-modal', 'start-modal', 'settings-modal', 'stats-modal', 'tutorial-modal', 'info-modal', 'confirm-modal', 'session-end-modal', 'result-modal'];
    return ids.some(id => {
        const el = document.getElementById(id);
        return el && el.style.display === 'flex';
    });
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

        const resModal = document.getElementById('result-modal');
        const btnCont = document.getElementById('btn-continue-modal');
        if (resModal && resModal.style.display === 'flex') {
            if (e.code === 'Enter' && btnCont && btnCont.style.display !== 'none') {
                e.preventDefault();
                btnCont.click();
            }
            return;
        }

        if (isAnyBlockingModalOpen()) return;

        if (e.code === 'Space') {
            e.preventDefault();
            repeatSound();
        } else if (e.code === 'KeyC') {
            e.preventDefault();
            if (!document.body.classList.contains('test-mode')) playCadence();
        } else if (e.code === 'Enter') {
            e.preventDefault();
            if (!document.body.classList.contains('test-mode')) startGame();
        } else if (e.code === 'Backspace') {
            if (state.mode === 'melody' || state.mode === 'bass') {
                e.preventDefault();
                deleteLastNote();
            }
        } else if (state.mode === 'melody' || state.mode === 'bass') {
            // PC keyboard playing: A W S E D F T G Y H U J K -> semitones 0..12 from active tonic
            const pcKeyMap = {
                KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5,
                KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12
            };
            if (Object.prototype.hasOwnProperty.call(pcKeyMap, e.code)) {
                e.preventDefault();
                const offset = pcKeyMap[e.code];
                const base = state.mode === 'bass' ? (state.keyIndex - 12) : state.keyIndex;
                handleExternalMidiNote(base + offset);
            }
        }
    });
}

window.onload = () => {
    applySavedTheme();
    initKeyboardShortcuts();
    initIntroSplash();
};
