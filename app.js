class MultiTrack {
  timer = 0;
  actx = new (AudioContext || webkitAudioContext)();
  srcs = [];
  audiosArray = [];

  playing = false;
  currentTime = 0;

  constructor(srcs) {
    this.time = document.querySelector("#time");
    this.fileInput = document.querySelector("#fileInput");
    this.trackcontainer = document.querySelector("#trackContainer");
    this.playBut= document.querySelector("#playButton");
    this.srcs = srcs;
    for (let obj of srcs) {
      this.audiosArray.push(
        new Track(obj.id, obj.src, this.actx, this.trackcontainer, null, this)
      );
      // fetch(obj.src, { mode: "cors" }).then(resp => resp.arrayBuffer()).then(buffer => {
      //     decode(buffer, obj)
      // });
    }

    this.gameLoop();
  }
  playPauseAll() {
    for (let audio of this.audiosArray) {
      if (audio.srcNode) {
        audio.srcNode.stop();
        audio.stopNode();
      } else {
        audio.playLoop(this.currentTime);
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

  handleFileChange(e) {
    let reader = new FileReader();
    reader.onload = () => {
      let arrayBuffer = reader.result;
      let id = this.fileInput.files[0].name;
      this.audiosArray.push(
        new Track(id, null, this.actx, this.trackcontainer, arrayBuffer,this)
      );
    };
    reader.readAsArrayBuffer(fileInput.files[0]);

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
      let moddedCurTime = curTime % this.audiosArray[0]?.duration;
      if (moddedCurTime) {
        this.currentTime = moddedCurTime;
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
