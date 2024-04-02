class Track {
  constructor(id, src, actx, container, arrayBuffer, multitrackInstance, cb) {
    if (cb instanceof Function) this.cb = cb;

    this.multitrackInstance = multitrackInstance;
    this.container = container;
    this.actx = actx;
    this.id = id;
    this.src = src;
    this.muted = false;
    this.srcNode = null;
    this.pan = 0;
    this.lastVolumeValue = 1;
    this.verticalZoom = 1;
    this.mutedVolume = 0;

    if (arrayBuffer) {
      this.decode(arrayBuffer);
    } else {
      fetch(src, { mode: "cors" })
        .then((resp) => resp.arrayBuffer())
        .then((buffer) => {
          this.decode(buffer);
        });
    }
  }

  initPeaks() {
    const options = {
      enableSegments: false,
      zoomview: false,
      overview: {
        container: this.waveform,
      },
      mediaElement: this.audioElement,
      webAudio: {
        audioContext: this.actx,
        audioBuffer: this.audioBuffer,
      },
    };

    this.peaks = peaks.init(options, (err, peaks) => {
      if (err) {
        console.error(`Failed to initialize Peaks instance: ${err.message}`);
        return;
      }
    });

    this.peaks.on("overview.click", (e) => this.handleClickOnWaveForm(e));
  }
  changeVerticalZoom(variation) {
    this.verticalZoom += variation;
    this.peaks.views._overview.setAmplitudeScale(this.verticalZoom);
  }

  handleClickOnWaveForm(e) {
    this.multitrackInstance.currentTime = e.time;
    this.multitrackInstance.makeAllTracksSeekToTime(e.time);
    this.multitrackInstance.playPauseAll();
    setTimeout(() => this.multitrackInstance.playPauseAll(), 1);
  }

  mute() {
    if (this.muted) {
      ((this.gainNode || {}).gain || {}).value = this.lastVolumeValue;
      this.volumeInput.value =
        ((this.gainNode || {}).gain || {}).value || this.lastVolumeValue;
    } else {
      // this.lastVolumeValue = ((this.gainNode || {}).gain || {}).value || 1;
      ((this.gainNode || {}).gain || {}).value = this.mutedVolume;
      this.volumeInput.value = this.mutedVolume;
    }

    this.muted = !this.muted;
    this.div.classList.toggle("muted", this.muted);
  }

  decode(buffer, cb) {
    this.arrayBuffer = buffer;
    this.actx.decodeAudioData(buffer, (audioBuffer) => {
      this.audioBuffer = audioBuffer;

      this.duration = audioBuffer.duration;
      if (this.cb instanceof Function) this.cb(this.duration);
      this.createTrackElements();
    });
  }

  createTrackElements() {
    this.div = document.createElement("div");
    this.div.classList.add("track");

    this.label = document.createElement("span");
    this.label.classList.add("label");
    this.label.innerText = this.id;

    this.button = document.createElement("button");
    this.button.onclick = () => this.mute();
    this.button.classList.add("muteButton");
    this.button.classList.add("file_" + this.id);
    this.button.innerText = "MUTE";

    this.labelDuration = document.createElement("span");
    this.labelDuration.classList.add("labelDuration");
    this.labelDuration.innerText = this.duration.toFixed(2) + "''";

    this.removeButton = document.createElement("button");
    this.removeButton.classList.add("removeButton");
    this.removeButton.onclick = () => this.remove();
    this.removeButton.innerHTML = " x ";

    this.audioElement = document.createElement("audio");

    this.blob = convertAudioBufferToBlob(this.audioBuffer);
    this.audioElement.src = window.URL.createObjectURL(this.blob);
    this.audioElement.muted = true;

    // this.blob = new Blob([this.audioBuffer], { type: "audio/wav" });
    // this.audioElement.src = window.URL.createObjectURL(this.blob);
    // console.log( this.audioElement.src )

    this.volumeInput = document.createElement("input");
    this.volumeInput.type = "range";
    this.volumeInput.classList.add("volumeInput");
    this.volumeInput.oninput = (e) => this.handleChangeVolume(e);
    this.volumeInput.max = 1;
    this.volumeInput.min = this.mutedVolume;
    this.volumeInput.step = 0.01;
    this.volumeInput.value = "1";

    this.waveform = document.createElement("div");
    this.waveform.classList.add("waveform");

    this.zoomInButton = document.createElement("button");
    this.zoomInButton.innerText = "+";
    this.zoomInButton.onclick = () => this.changeVerticalZoom(1);
    this.zoomOutButton = document.createElement("button");
    this.zoomOutButton.innerText = "-";
    this.zoomOutButton.onclick = () => this.changeVerticalZoom(-1);

    this.zoomInButton.classList.add("zoomButton");
    this.zoomOutButton.classList.add("zoomButton");

    this.panInput = document.createElement("input");
    this.panInput.type = "range";
    this.panInput.classList.add("panInput");
    this.panInput.oninput = (e) => this.handleChangePan(e);
    this.panInput.max = 1;
    this.panInput.min = -1;
    this.panInput.step = 0.01;
    this.panInput.value = "0";
    this.panInput.ondblclick = () => (this.panInput.value = "0");

    // this.bpmLabel = document.createElement("span");
    // this.bpmLabel.classList.add("bpmLabel");
    // this.bpmLabel.innerHTML = this.detectedBPM?this.detectedBPM + " BPM":""

    this.div.appendChild(this.audioElement);
    this.div.appendChild(this.label);
    this.div.appendChild(this.button);
    this.div.appendChild(this.labelDuration);
    this.div.appendChild(this.volumeInput);
    this.div.appendChild(this.panInput);
    this.div.appendChild(this.waveform);
    this.div.appendChild(this.zoomInButton);
    this.div.appendChild(this.zoomOutButton);

    // this.div.appendChild(this.bpmLabel);
    this.div.appendChild(this.removeButton);

    this.container.appendChild(this.div);

    this.initPeaks();
  }

  handleChangeVolume(e) {
    ((this.gainNode || {}).gain || {}).value = e.target.value;
    this.lastVolumeValue = e.target.value;
  }

  handleChangePan(e) {
    this.pan = Number(e.target.value);
    ((this.panNode || {}).pan || {}).value = this.pan;
  }
  remove() {
    this.peaks.destroy();
    if (this.multitrackInstance.playing) {
      this.multitrackInstance.playPauseAll();
    }
    this.div.parentElement.removeChild(this.div);
    //remove the instance from the array
    for (let i = 0; i < this.multitrackInstance.audiosArray.length; i++) {
      let audio = this.multitrackInstance.audiosArray[i];
      if (audio.id == this.id) {
        this.multitrackInstance.audiosArray.splice(i, 1);
        break;
      }
    }
    //remove everything
    for (let key of Object.keys(this)) {
      this[key] = undefined;
    }
  }

  stopNode() {
    this.gainNode.disconnect();
    this.srcNode.disconnect();
    this.srcNode = null;
    this.gainNode = null;
  }
  playLoop(time) {
    this.timer = performance.now();

    this.srcNode = this.actx.createBufferSource(); // create audio source

    this.srcNode.loopStart = this.multitrackInstance.loopFrom;
    this.srcNode.loopEnd = this.multitrackInstance.loopTo || null;

    this.srcNode.buffer = this.audioBuffer; // use decoded buffer

    this.srcNode.loop = true; // takes care of perfect looping

    // srcNode.playbackRate.value = 0.5;

    this.srcNode.start(0, time || 0);
    this.audioElement.currentTime = time || 0;

    this.gainNode = this.actx.createGain();
    this.panNode = this.actx.createStereoPanner();
    this.gainNode.gain.value = this.muted ? -1 : this.lastVolumeValue;

    this.srcNode
      .connect(this.panNode)
      .connect(this.gainNode)
      .connect(this.actx.destination);
  }
}
