console.log("Sanity check from audio.js.");

const context = new (window.AudioContext || window.webkitAudioContext)();


// For audio visualisation
const analyser = context.createAnalyser();
analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);


function playSound(buffer, time) {
    let source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source[source.start ? 'start' : 'noteOn'](time);
};

function loadSounds(obj, soundMap, callback) {
    let names = [];
    let paths = [];
    for (let name in soundMap) {
        let path = soundMap[name];
        names.push(name);
        paths.push(path);
    }
    bufferLoader = new BufferLoader(context, paths, function(bufferList) {
        for (let i=0; i<bufferList.length; i++) {
            let buffer = bufferList[i];
            let name = names[i];
            obj[name] = buffer;
        }
        if (callback) {
            callback();
        }
    });
    bufferLoader.load();
};


function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    let loader = this;
    request.onload = function() {
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
            if (!buffer) {
                alert('error decoding file data: ' + url);
                return;
            }
            loader.bufferList[index] = buffer;
            if (++loader.loadCount == loader.urlList.length)
                loader.onload(loader.bufferList);
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    }
    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }
    request.send();
};

BufferLoader.prototype.load = function() {
    for (let i=0; i<this.urlList.length; ++i)
    this.loadBuffer(this.urlList[i], i);
};

function createSource(buffer) {
    let source = context.createBufferSource();
    let gainNode = context.createGain();
    let filter = context.createBiquadFilter();

    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    gainNode.connect(filter);
    filter.connect(analyser);
    analyser.connect(context.destination);
    
    // Initial lowpass value
    filter.type = 'lowpass';
    filter.frequency.setTargetAtTime(20000, context.currentTime, 0);

    return {
        source: source,
        gainNode: gainNode,
        filter: filter
    };
};


// Calculate the time until the next second
function timeUntilNextSecond() {
    const now = context.currentTime;
    const delay = Math.ceil(now) - now + 1;
    return delay * 1000; // Convert to milliseconds
};


// Ambience track
let Ambience = function() {
    loadSounds(this, {
        birds: birdsFile,
        fire: fireFile,
        rain: rainFile,
        wind: windFile,
        shop: shopFile,
    });
    this.isPlaying = false;
};

Ambience.prototype.play = function() {
    // Create sources
    this.ctlbirds = createSource(this.birds);
    this.ctlfire = createSource(this.fire);
    this.ctlwind = createSource(this.wind);
    this.ctlrain = createSource(this.rain);
    this.ctlshop = createSource(this.shop);
    // Set initial gain based on sliders
    this.masterVolume = parseInt(document.getElementById("master-volume").value) / 100;
    this.ctlbirds.volume = parseInt(document.getElementById("slider-1").value) / 100;
    this.ctlfire.volume = parseInt(document.getElementById("slider-2").value) / 100;
    this.ctlwind.volume = 0;
    this.ctlrain.volume = parseInt(document.getElementById("slider-3").value) / 100;
    this.ctlshop.volume = parseInt(document.getElementById("slider-4").value) / 100;
    this.setMaster();
    // Set initial lowpass
    this.setLowpass(document.getElementById("slider-5"));
    // Start playback in a loop
    let onName = this.ctlbirds.source.start ? 'start' : 'noteOn';
    this.ctlbirds.source[onName](0);
    this.ctlfire.source[onName](0);
    this.ctlwind.source[onName](0);
    this.ctlrain.source[onName](0);
    this.ctlshop.source[onName](0);
};


Ambience.prototype.stop = function() {
    let offName = this.ctlbirds.source.stop ? 'stop' : 'noteOff';
    this.ctlbirds.source[offName](0);
    this.ctlfire.source[offName](0);
    this.ctlrain.source[offName](0);
    this.ctlwind.source[offName](0);
    this.ctlshop.source[offName](0);
};

Ambience.prototype.toggle = function() {
    this.isPlaying ? this.stop() : this.play();
    this.isPlaying = !this.isPlaying;
};

Ambience.prototype.setMaster = function() {
    this.masterVolume = parseInt(document.getElementById("master-volume").value) / 100;
    this.ctlbirds.gainNode.gain.value = this.ctlbirds.volume * this.masterVolume;
    this.ctlfire.gainNode.gain.value = this.ctlfire.volume * this.masterVolume;
    this.ctlwind.gainNode.gain.value = this.ctlwind.volume * this.masterVolume;
    this.ctlrain.gainNode.gain.value = this.ctlrain.volume * this.masterVolume;
    this.ctlshop.gainNode.gain.value = this.ctlshop.volume * this.masterVolume;
};
Ambience.prototype.setBirds = function(element) {
	this.ctlbirds.volume = parseInt(element.value) / parseInt(element.max);
    this.ctlbirds.gainNode.gain.value = this.ctlbirds.volume * this.masterVolume;
};
Ambience.prototype.setFire = function(element) {
	this.ctlfire.volume = parseInt(element.value) / parseInt(element.max);
    this.ctlfire.gainNode.gain.value = this.ctlfire.volume * this.masterVolume;
};
Ambience.prototype.setWind = function(element) {
	this.ctlwind.volume = parseInt(element.value) / parseInt(element.max);
    this.ctlwind.gainNode.gain.value = this.ctlwind.volume * this.masterVolume;
};
Ambience.prototype.setRain = function(element) {
	this.ctlrain.volume = parseInt(element.value) / parseInt(element.max);
    this.ctlrain.gainNode.gain.value = this.ctlrain.volume * this.masterVolume;
};
Ambience.prototype.setShop = function(element) {
	this.ctlshop.volume = parseInt(element.value) / parseInt(element.max);
    this.ctlshop.gainNode.gain.value = this.ctlshop.volume * this.masterVolume;
};

Ambience.prototype.setLowpass = function(element) {
	let x = parseInt(element.value);
    // Convert to exponential scale
    x = Math.round(Math.exp(x / 100 * Math.log(20000)) + 200);
	this.ctlbirds.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
    this.ctlfire.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
    this.ctlrain.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
    this.ctlwind.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
    this.ctlshop.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
};


// UI track
let UI = function() {
    loadSounds(this, {
        button: buttonFile,
        notch: notchFile,
    });
}

UI.prototype.soundButton = function() {
	this.ctlbutton = createSource(this.button);
	this.ctlbutton.gainNode.gain.value = 0.7;
	this.ctlbutton.source.loop = false;
	let onName = this.ctlbutton.source.start ? 'start' : 'noteOn';
	this.ctlbutton.source[onName](0);
};

UI.prototype.soundNotch = function() {
    this.ctlnotch = createSource(this.notch);
    this.ctlnotch.gainNode.gain.value = 0.5;
    this.ctlnotch.source.loop = false;
    let onName = this.ctlnotch.source.start ? 'start' : 'noteOn';
    this.ctlnotch.source[onName](0);
};


// Generate equal temperament notes list
const range = (start, stop) => Array(stop - start + 1).fill().map((_, i) => start + i);
const octaveRange = range(0, 8).map(val => [val, val - 4]);
const semitoneOffsets = [
    ["C", -9], ["C#", -8], ["Db", -8], ["D", -7], ["D#", -6], ["Eb", -6], ["E", -5], ["F", -4],
    ["F#", -3], ["Gb", -3], ["G", -2], ["G#", -1], ["Ab", -1], ["A", 0], ["A#", 1], ["Bb", 1], ["B", 2],
];
const notes = octaveRange.reduce((ob, [range, multiplier]) => semitoneOffsets.reduce((ob, [note, semitones]) => ({
    ...ob,
    [note + range]: 440 * Math.pow(2, (semitones + (multiplier * 12)) / 12),
}), ob), {});

// Map each note to its offset in cents (100 cents p/ semitone) relative to 440 Hz
const noteCentsOffsets = {};
Object.keys(notes).forEach(note => {
  const frequency = notes[note];
  const centsOffset = 1200 * Math.log2(frequency / 440);
  noteCentsOffsets[note] = centsOffset;
});

// A pentatonic scale
const pentatonic_scale = [
    'C#3', 'D#3', 'F#3', 'G#3', 'A#3',
    'C#4', 'D#4', 'F#4', 'G#4', 'A#4',
    'C#5', 'D#5', 'F#5', 'G#5', 'A#5',
    '-', '-', '-', '-', '-',
    '-', '-', '-', '-', '-',
    '-', '-', '-', '-', '-',
];


// Instrument track
let Instrument = function() {
    loadSounds(this, {
        marimba: marimbaFile,
        synth: synthFile,
    });
};

Instrument.prototype.soundMarimba = function(note) {
	this.ctlmarimba = createSource(this.marimba);
	this.ctlmarimba.gainNode.gain.value = parseInt(document.getElementById("marimba-volume").value) / 100;
	this.ctlmarimba.source.loop = false;
    this.ctlmarimba.source.detune.value = noteCentsOffsets[note];
	let onName = this.ctlmarimba.source.start ? 'start' : 'noteOn';
	this.ctlmarimba.source[onName](0);
};

Instrument.prototype.soundSynth = function(note) {
    this.ctlsynth = createSource(this.synth);
    this.ctlsynth.gainNode.gain.value = parseInt(document.getElementById("synth-volume").value) / 100;
    this.ctlsynth.source.loop = false;
    this.ctlsynth.source.detune.value = noteCentsOffsets[note];
    let onName = this.ctlsynth.source.start ? 'start' : 'noteOn';
    this.ctlsynth.source[onName](0);
};

Instrument.prototype.startMarimba = function() {
    setTimeout(() => {
        invl1 = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * pentatonic_scale.length);
            const randomNote = pentatonic_scale[randomIndex];
            try {
                this.soundMarimba(randomNote);
            } catch (TypeError) {
                // Don't play anything
            }
        }, 200);
    }, timeUntilNextSecond());
    
};

Instrument.prototype.startSynth = function() {
    setTimeout(() => {
        invl2 = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * pentatonic_scale.length);
            const randomNote = pentatonic_scale[randomIndex];
            try {
                this.soundSynth(randomNote);
            } catch (TypeError) {
                // Don't play anything
            }
        }, 400);
    }, timeUntilNextSecond());
};

Instrument.prototype.soundGuitar = function(intensity, density, variation) {
    // Select samples
    let files = {};
    let samples = [];
    let chosen_sample;
    switch (intensity) {
        case "gentle":
            files = guitarFiles["gentle"];
            break;
        case "standard":
            files = guitarFiles["standard"];
            break;
        case "intense":
            files = guitarFiles["intense"];
            break;
    }
    switch (density) {
        case "sparse":
            samples = files["sparse"];
            break;
        case "moderate":
            samples = files["moderate"];
            break;
        case "full":
            samples = files["full"];
            break;
    }
    chosen_sample = samples[variation];

    // Play sample
    loadSounds(this, {
        sample: chosen_sample
    });
    this.ctlguitar = createSource(this.sample);
    this.ctlguitar.gainNode.gain.value = parseInt(document.getElementById("guitar-volume").value) / 100;
	this.ctlguitar.source.loop = false;
	let onName = this.ctlguitar.source.start ? 'start' : 'noteOn';
	this.ctlguitar.source[onName](0);
};
// Guitar volume
Instrument.prototype.setGuitar = function(element) {
    this.ctlguitar.gainNode.gain.value = parseInt(element.value) / parseInt(element.max);
};


// Sequencer track
let Sequencer = function() {
    loadSounds(this, {
        kick: kickFile,
        snare: snareFile,
        hatClosed: hatClosedFile,
        hatOpen: hatOpenFile,
        clap: clapFile,
        crunch: crunchFile,
        shaker: shakerFile,
        cowbell: cowbellFile
    });
};

Sequencer.prototype.playSound = function(sound) {
    switch (sound) {
        case 0:
            this.ctl = createSource(this.kick);
            break;
        case 1:
            this.ctl = createSource(this.snare);
            break;
        case 2:
            this.ctl = createSource(this.hatClosed);
            break;
        case 3:
            this.ctl = createSource(this.hatOpen);
            break;
        case 4:
            this.ctl = createSource(this.clap);
            break;
        case 5:
            this.ctl = createSource(this.crunch);
            break;
        case 6:
            this.ctl = createSource(this.shaker);
            break;
        case 7:
            this.ctl = createSource(this.cowbell);
            break;
        default:
            console.error('Unknown sequencer sound provided.');
            break;
    }
	this.ctl.gainNode.gain.value = parseInt(document.getElementById("sequencer-volume").value) / 100;
	this.ctl.source.loop = false;
    // Set lowpass
    let x = parseInt(document.getElementById("sequencer-filter").value);
    x = Math.round(Math.exp(x / 100 * Math.log(20000)) + 200);
    this.ctl.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
	let onName = this.ctl.source.start ? 'start' : 'noteOn';
	this.ctl.source[onName](0);
};


// Initialise tracks
let ambienceTrack = new Ambience();
let uiTrack = new UI();
let instrumentTrack = new Instrument();
let sequencerTrack = new Sequencer();