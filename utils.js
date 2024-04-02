
// Returns Uint8Array of WAV bytes
function getWavBytes(buffer, options) {
  const type = options.isFloat ? Float32Array : Uint16Array;
  const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT;

  const headerBytes = getWavHeader(Object.assign({}, options, { numFrames }));
  const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);

  // prepend header, then add pcmBytes
  wavBytes.set(headerBytes, 0);
  wavBytes.set(new Uint8Array(buffer), headerBytes.length);

  return wavBytes;
}

// adapted from https://gist.github.com/also/900023
// returns Uint8Array of WAV header bytes
function getWavHeader(options) {
  const numFrames = options.numFrames;
  const numChannels = options.numChannels || 2;
  const sampleRate = options.sampleRate || 44100;
  const bytesPerSample = options.isFloat ? 4 : 2;
  const format = options.isFloat ? 3 : 1;

  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const buffer = new ArrayBuffer(44);
  const dv = new DataView(buffer);

  let p = 0;

  function writeString(s) {
    for (let i = 0; i < s.length; i++) {
      dv.setUint8(p + i, s.charCodeAt(i));
    }
    p += s.length;
  }

  function writeUint32(d) {
    dv.setUint32(p, d, true);
    p += 4;
  }

  function writeUint16(d) {
    dv.setUint16(p, d, true);
    p += 2;
  }

  writeString("RIFF"); // ChunkID
  writeUint32(dataSize + 36); // ChunkSize
  writeString("WAVE"); // Format
  writeString("fmt "); // Subchunk1ID
  writeUint32(16); // Subchunk1Size
  writeUint16(format); // AudioFormat https://i.stack.imgur.com/BuSmb.png
  writeUint16(numChannels); // NumChannels
  writeUint32(sampleRate); // SampleRate
  writeUint32(byteRate); // ByteRate
  writeUint16(blockAlign); // BlockAlign
  writeUint16(bytesPerSample * 8); // BitsPerSample
  writeString("data"); // Subchunk2ID
  writeUint32(dataSize); // Subchunk2Size

  return new Uint8Array(buffer);
}
function convertAudioBufferToBlob(audioBuffer) {
  var channelData = [],
    totalLength = 0,
    channelLength = 0;

  for (var i = 0; i < audioBuffer.numberOfChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
    totalLength += channelData[i].length;
    if (i == 0) channelLength = channelData[i].length;
  }

  // interleaved
  const interleaved = new Float32Array(totalLength);

  for (
    let src = 0, dst = 0;
    src < channelLength;
    src++, dst += audioBuffer.numberOfChannels
  ) {
    for (var j = 0; j < audioBuffer.numberOfChannels; j++) {
      interleaved[dst + j] = channelData[j][src];
    }
    //interleaved[dst] = left[src];
    //interleaved[dst + 1] = right[src];
  }

  // get WAV file bytes and audio params of your audio source
  const wavBytes = this.getWavBytes(interleaved.buffer, {
    isFloat: true, // floating point or 16-bit integer
    numChannels: audioBuffer.numberOfChannels,
    sampleRate: 48000,
  });
  const wav = new Blob([wavBytes], { type: "audio/wav" });
  return wav;
}