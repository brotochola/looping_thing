class MultiTrack {
  timer = 0;
  actx = new (AudioContext || webkitAudioContext)();
  srcs = [];
  audiosArray = [];

  playing = false;
  currentTime = 0;
  loopFrom = 0;

  constructor(srcs) {
    this.time = document.querySelector("#time");
    this.fileInput = document.querySelector("#fileInput");
    this.trackcontainer = document.querySelector("#trackContainer");
    this.playBut = document.querySelector("#playButton");
    this.loopToElement = document.querySelector("#loopTo");
    this.loopFromElement = document.querySelector("#loopFrom");
    this.srcs = srcs;
    for (let obj of srcs) {
      this.createNewTrack(obj.id, obj.src, null);

      // fetch(obj.src, { mode: "cors" }).then(resp => resp.arrayBuffer()).then(buffer => {
      //     decode(buffer, obj)
      // });
    }

    this.gameLoop();
  }
  makeSureTimeDoesntGoBeyondLoopLimits(time) {
    let val;
    if (time > this.loopFrom && time < this.loopTo) {
      val = time;
    } else if (time < this.loopFrom || time > this.loopTo) {
      val = this.loopFrom;
    }
    return val;
  }
  playPauseAll() {
    for (let audio of this.audiosArray) {
      if (audio.srcNode) {
        audio.srcNode.stop();
        audio.stopNode();
      } else {
        //set limits

        audio.playLoop(
          this.makeSureTimeDoesntGoBeyondLoopLimits(this.currentTime)
        );
      }
    }

    if (this.playing) {
      this.playBut.innerText = "Play";
    } else {
      this.timer = performance.now() - this.currentTime * 1000;
      this.playBut.innerText = "Stop";
    }
    this.playing = !this.playing;
  }
  handleLoopChange(e) {
    console.log("handleLoopChange", e.target.value, e.target.id);
    let value = Number(e.target.value);

    if (e.target.id == "loopFrom") {
      this.loopFrom = !isNaN(value) && e.target.value != "" ? value : 0;
    } else if (e.target.id == "loopTo") {
      this.loopTo =
        !isNaN(value) && e.target.value != "" ? value : this.shortestTrack;
    }

    this.playPauseAll()
    setTimeout(()=>this.playPauseAll(),1)
  }
  createNewTrack(id, src, arrayBuffer) {
    this.audiosArray.push(
      new Track(
        id,
        src,
        this.actx,
        this.trackcontainer,
        arrayBuffer,
        this,
        (duration) => {
          this.getShortestTrackDuration();
        }
      )
    );
  }

  getShortestTrackDuration() {
    this.shortestTrack = 9999;
    for (let i = 0; i < this.audiosArray.length; i++) {
      let audio = this.audiosArray[i];
      if (audio.duration < this.shortestTrack)
        this.shortestTrack = audio.duration;
    }
    this.loopTo = this.shortestTrack;
    this.loopToElement.value = this.loopTo;
  }
  handleFileChange(e) {
    for (let file of this.fileInput.files) {
      let reader = new FileReader();
      reader.onload = () => {
        let id = file.name;
        this.createNewTrack(id, null, reader.result);
      };

      reader.readAsArrayBuffer(file);
    }

    if (this.playing) {
      playPauseAll();
    }
  }
  addTrack() {
    this.fileInput.click();
  }

  mute(id) {
    let audio = this.audiosArray.filter((k) => k.id == id)[0];

    if (!audio) {
      return console.warn(audio.id + " COULD NOT BE MUTED");
    }

    audio.mute();
  }

  gameLoop() {
    if (this.playing) {
      let curTime = (performance.now() - this.timer) / 1000;
      let moddedCurTime =
        (curTime % (this.loopTo - this.loopFrom)) + this.loopFrom;
      if (moddedCurTime) {
        this.currentTime =
          this.makeSureTimeDoesntGoBeyondLoopLimits(moddedCurTime);
        this.makeAllTracksSeekToTime(this.currentTime);
        this.time.innerText = this.currentTime.toFixed(2);
      }
    }

    requestAnimationFrame(() => this.gameLoop());
  }
  makeAllTracksSeekToTime(time) {
    for (let track of this.audiosArray) {
      track.audioElement.currentTime = time;
    }
  }
}
