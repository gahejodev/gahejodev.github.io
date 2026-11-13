// Browser-only Piper ONNX engine for Zeeroz Academy Urdu voices.
// Based on the MIT-licensed piper-tts.github.io browser implementation.
// Runtime assets are loaded from jsDelivr; voice models/configs from Hugging Face.
const PH_CFG = { pad: "_", bos: "^", eos: "$", interspersePad: true, addBos: true, addEos: true };
const ORT_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.3/dist/";
const PHONEMIZER_BASE = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/";
ort.env.wasm.wasmPaths = ORT_BASE;
ort.env.wasm.numThreads = 1;

let phonemizerPromise;
function getPhonemizer() {
  return phonemizerPromise ??= (async () => {
    let out = [];
    const mod = await createPiperPhonemize({
      print: line => out.push(JSON.parse(line)),
      printErr: line => console.warn("[Zeeroz Piper phonemizer]", line),
      locateFile: f => PHONEMIZER_BASE + f,
    });
    return {
      phonemize(texts, lang) {
        out = [];
        const rc = mod.callMain(["--espeak_data", "/espeak-ng-data", "--language", lang,
          "--input", JSON.stringify(texts.map(text => ({ text })))]);
        if (rc !== 0) throw new Error("Piper phonemizer exit code " + rc);
        return out;
      },
    };
  })();
}

async function createEngine(onnxUrl, cfgUrl, onProgress) {
  // Avoid retaining every streamed chunk and then allocating a second full-size
  // model buffer. On mobile browsers that doubled peak memory while ONNX opened.
  let modelResponse, configResponse;
  try {
    [modelResponse, configResponse] = await Promise.all([fetch(onnxUrl), fetch(cfgUrl)]);
  } catch (e) {
    throw new Error("Urdu voice download could not connect: " + (e?.message || String(e)));
  }
  if (!modelResponse.ok) throw new Error("Urdu ONNX model download failed (HTTP " + modelResponse.status + ").");
  if (!configResponse.ok) throw new Error("Urdu voice configuration download failed (HTTP " + configResponse.status + ").");
  let modelBuffer;
  try {
    modelBuffer = await modelResponse.arrayBuffer();
  } catch (e) {
    throw new Error("Urdu ONNX model download/read failed: " + (e?.message || String(e)));
  }
  if (modelBuffer.byteLength < 1024 * 1024) {
    throw new Error("Urdu ONNX model file is incomplete or too small (" + modelBuffer.byteLength + " bytes).");
  }
  let cfg;
  try {
    cfg = await configResponse.json();
  } catch (e) {
    throw new Error("Urdu voice configuration is not valid JSON: " + (e?.message || String(e)));
  }
  onProgress?.({loaded:modelBuffer.byteLength,total:modelBuffer.byteLength});
  let session;
  try {
    session = await ort.InferenceSession.create(modelBuffer,{executionProviders:["wasm"]});
  } catch (e) {
    const detail = typeof e === "number" ? "WASM error code " + e : (e?.message || String(e));
    throw new Error("ONNX Runtime could not open the downloaded Urdu model: " + detail);
  }
  const inf=cfg.inference||{}, sampleRate=cfg.audio?.sample_rate||22050, lang=cfg.espeak?.voice||"ur";
  return {
    cfg,sampleRate,
    async infer(ids,speakerId,opts={}) {
      const feeds={
        input:new ort.Tensor("int64",BigInt64Array.from(ids.map(BigInt)),[1,ids.length]),
        input_lengths:new ort.Tensor("int64",BigInt64Array.from([BigInt(ids.length)]),[1]),
        scales:new ort.Tensor("float32",Float32Array.from([opts.noiseScale??inf.noise_scale??0.667,opts.lengthScale??inf.length_scale??1,opts.noiseW??inf.noise_w??0.8]),[3])
      };
      if(speakerId!=null)feeds.sid=new ort.Tensor("int64",BigInt64Array.from([BigInt(speakerId)]),[1]);
      const {output}=await session.run(feeds); return output.data;
    },
    async speak(text,opts={}) {
      const ph=await getPhonemizer();
      const rows=ph.phonemize([text],lang);
      const ids=rows?.[0]?.phoneme_ids;
      if(!Array.isArray(ids)||!ids.length)throw new Error("Urdu text phonemization returned no speech tokens.");
      const eos=cfg.phoneme_id_map?.[PH_CFG.eos]?.[0]??2, sentences=[]; let current=[];
      for(const id of ids){current.push(id);if(id===eos){sentences.push(current);current=[]}}
      if(current.length)sentences.push(current);
      const gap=new Float32Array(Math.round(sampleRate*(opts.sentenceSilence??0.16))),chunks=[];
      for(const sentence of sentences){chunks.push(await this.infer(sentence,opts.speakerId,opts),gap)}
      const out=new Float32Array(chunks.reduce((n,c)=>n+c.length,0));let offset=0;
      for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length}
      return out;
    },
    dispose:()=>session.release()
  };
}
function toWav(samples,sampleRate){
  const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
  const write=(offset,str)=>[...str].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
  write(0,"RIFF");view.setUint32(4,36+samples.length*2,true);write(8,"WAVE");write(12,"fmt ");
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
  write(36,"data");view.setUint32(40,samples.length*2,true);
  for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.max(-1,Math.min(1,samples[i]))*32767,true);
  return new Blob([buffer],{type:"audio/wav"});
}
window.ZeerozPiper={createEngine,getPhonemizer,toWav};
