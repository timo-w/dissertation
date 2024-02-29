console.log("Sanity check from mixer-audio.js.");

context = new (window.AudioContext || window.webkitAudioContext)();

function playSound(buffer, time) {
    let source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source[source.start ? 'start' : 'noteOn'](time);
}

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
}


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
    filter.connect(context.destination);

    // Initial lowpass value
    filter.type = 'lowpass';
    filter.frequency.setTargetAtTime(20000, context.currentTime, 0);

    return {
        source: source,
        gainNode: gainNode,
        filter: filter
    };
  }



let Ambience = function() {
    loadSounds(this, {
        birds: birdsFile,
        fire: fireFile,
        rain: rainFile,
        wind: windFile,
        shop: shopFile,
    });
    this.isPlaying = false;
}

Ambience.prototype.play = function() {
    // Create sources
    this.ctlbirds = createSource(this.birds);
    this.ctlfire = createSource(this.fire);
    this.ctlwind = createSource(this.wind);
    this.ctlrain = createSource(this.rain);
    this.ctlshop = createSource(this.shop);
    // Set initial gain
    this.ctlbirds.gainNode.gain.value = 0;
    this.ctlfire.gainNode.gain.value = 0;
    this.ctlwind.gainNode.gain.value = 0;
    this.ctlrain.gainNode.gain.value = 0;
    this.ctlshop.gainNode.gain.value = 0;
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


Ambience.prototype.setBirds = function(element) {
 x = parseInt(element.value) / parseInt(element.max);
	this.ctlbirds.gainNode.gain.value = x;
};
Ambience.prototype.setFire = function(element) {
	let x = parseInt(element.value) / parseInt(element.max);
	this.ctlfire.gainNode.gain.value = x;
};
Ambience.prototype.setWind = function(element) {
	let x = parseInt(element.value) / parseInt(element.max);
	this.ctlwind.gainNode.gain.value = x;
};
Ambience.prototype.setRain = function(element) {
	let x = parseInt(element.value) / parseInt(element.max);
	this.ctlrain.gainNode.gain.value = x;
};
Ambience.prototype.setShop = function(element) {
	let x = parseInt(element.value) / parseInt(element.max);
	this.ctlshop.gainNode.gain.value = x*10;
};

Ambience.prototype.setLowpass = function(element) {
	let x = parseInt(element.value);
    x = (x * 20000) / 100;
	this.ctlbirds.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
    this.ctlfire.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
    this.ctlrain.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
    this.ctlwind.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
    this.ctlshop.filter.frequency.setTargetAtTime(x, context.currentTime, 0);
};




let UI = function() {
    loadSounds(this, {
        button: buttonFile,
        notch: notchFile,
    });
    this.isPlaying = false;
    this.ctlnotch = createSource(this.notch);
    this.ctlnotch.gainNode.gain.value = 0.5;
}

UI.prototype.soundButton = function() {
	this.ctlbutton = createSource(this.button);
	this.ctlbutton.gainNode.gain.value = 0.5;
	this.ctlbutton.source.loop = false;
	let onName = this.ctlbutton.source.start ? 'start' : 'noteOn';
	this.ctlbutton.source[onName](0);
}

UI.prototype.soundNotch = function() {
    this.ctlnotch = createSource(this.notch);
    this.ctlnotch.gainNode.gain.value = 0.25;
    this.ctlnotch.source.loop = false;
    let onName = this.ctlnotch.source.start ? 'start' : 'noteOn';
    this.ctlnotch.source[onName](0);
}


let ambienceTrack = new Ambience();
let uiTrack = new UI();