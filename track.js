class Track {
  constructor(id, src, actx, container, arrayBuffer) {
    this.container = container;
    this.actx = actx;
    this.id = id;
    this.src = src;
    this.muted = false;
    this.srcNode = null;

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

  mute() {
    if (this.muted) {
      this.gainNode.gain.value = this.lastVolumeValue
        ? this.lastVolumeValue
        : 1;

      this.volumeInput.value = this.gainNode.gain.value;
    } else {
      this.lastVolumeValue = ((this.gainNode || {}).gain || {}).value || 1;
      this.gainNode.gain.value = -1;
      this.volumeInput.value = -1;
    }

    this.muted = !this.muted;

    this.div.classList.toggle("muted", this.muted);
  }

  decode(buffer) {
    this.actx.decodeAudioData(buffer, (abuffer) => {
      this.abuffer = abuffer;
      
      this.duration = abuffer.duration;
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
    this.labelDuration.innerText = this.duration.toString() + "'";

    this.removeButton = document.createElement("button");
    this.removeButton.classList.add("removeButton");
    this.removeButton.onclick = () => this.remove();
    this.removeButton.innerHTML = " x ";

    this.volumeInput = document.createElement("input");
    this.volumeInput.type = "range";
    this.volumeInput.classList.add("volumeInput");
    this.volumeInput.oninput = (e) => this.handleChangeVolume(e);
    this.volumeInput.max = 1;
    this.volumeInput.min = -1;
    this.volumeInput.step = 0.01;
    this.volumeInput.value = 1;

    // this.bpmLabel = document.createElement("span");
    // this.bpmLabel.classList.add("bpmLabel");
    // this.bpmLabel.innerHTML = this.detectedBPM?this.detectedBPM + " BPM":""

    this.div.appendChild(this.label);
    this.div.appendChild(this.button);
    this.div.appendChild(this.labelDuration);
    this.div.appendChild(this.volumeInput);
    // this.div.appendChild(this.bpmLabel);
    this.div.appendChild(this.removeButton);

    this.container.appendChild(this.div);
  }


  handleChangeVolume(e) {
    ((this.gainNode || {}).gain || {}).value = e.target.value;
  }
  remove() {
    if (playing) {
      playPauseAll();
    }
    this.div.parentElement.removeChild(this.div);
    for (let key of Object.keys(this)) {
      this[key] = undefined;
    }
    for (let i = 0; i < audiosArray.length; i++) {
      let audio = audiosArray[i];
      if (audio.id == this.id) {
        audiosArray.splice(i, 1);
        break;
      }
    }
  }
  playLoop() {
    this.timer = performance.now();

    let srcNode = actx.createBufferSource(); // create audio source
    srcNode.buffer = this.abuffer; // use decoded buffer
    srcNode.connect(actx.destination); // create output
    srcNode.loop = true; // takes care of perfect looping
    this.srcNode = srcNode; // create a reference for control buttons
    srcNode.start(0, 0); // play...

    let gainNode = actx.createGain();
    // gainNode.gain.value =1 // 10 %
    gainNode.connect(actx.destination);

    // now instead of connecting to aCtx.destination, connect to the gainNode
    srcNode.connect(gainNode);
    this.gainNode = gainNode;
  }
}
