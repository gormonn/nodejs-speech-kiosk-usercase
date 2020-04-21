const Recorder = require('./recorder')
const { recognize } = require('./index')
const VAD = require('./vad')

// example use:
// const keys = {
// 	googleCloud: ['YOUR_KEY']
// }

// Recognizer({
// 	keys, 
// 	onSpeechRecognized: res => console.log('РЕЗУЛЬТАТ! ' + JSON.stringify(res)),
// 	onSpeechStart: () => console.log('ГОВОРИТ!'),
// 	onSpeechEnd: () => console.log('ЗАМОЛЧАЛ!')
// })

function Recognizer({
	apiKeys,
	onSpeechStart = () => console.log('voice_start'),
	onSpeechEnd = () => console.log('voice_stop'),
	onSpeechRecognized = res => console.log('onSpeechRecognized', res),
	isSpeech2Text = true,
	audioWorkletModule = false
}){
	this._isSpeech2Text = isSpeech2Text
	this._audioWorkletModule = audioWorkletModule

	this.stopRecognize = () => {
		this._isSpeech2Text = false
	}
	this.startRecognize = () => {
		this._isSpeech2Text = true
	}
	this.changeProcessor = (audioWorkletModule) =>{
		this._audioWorkletModule = audioWorkletModule
		this.init()
	}

	this.init = () => {
		const audioCtx = new AudioContext()
		const initRec = source => {
			if(this._audioWorkletModule){
				// After the resolution of module loading, an AudioWorkletNode can be constructed.
				let reverbWorkletNode = new AudioWorkletNode(audioCtx, this._audioWorkletModule.name)

				source.disconnect();
				// AudioWorkletNode can be interoperable with other native AudioNodes.
				source.connect(reverbWorkletNode).connect(audioCtx.destination)
			}
			// const audioContext = new AudioContext();
			
			// const source = audioCtx.createMediaStreamSource(stream)

			const recorder = new Recorder(source, {numChannels: 1})

			const onVoiceStart = () => {
				onSpeechStart()
				if(this._isSpeech2Text) recorder.record()
			}

			const onVoiceEnd = () => {
				onSpeechEnd()
				if(this._isSpeech2Text) stopRecording()
			}

			const stopRecording = () => {
				recorder.stop()
				recorder.exportWAV(googleSpeechRequest)
				recorder.clear() // иначе, запись склеивается
			}

			const googleSpeechRequest = blob => {
				const { googleCloud = [] } = apiKeys
				const [googleCloudKey] = googleCloud
				let reader = new FileReader()
				reader.onload = async function() {
					if (reader.readyState == 2) {
						const uint8Array = new Uint8Array(reader.result);
						const recognitionResult = await recognize(uint8Array, googleCloudKey);
						onSpeechRecognized(recognitionResult, reader.result)
						// console.log({recognitionResult})
					}
				}
				reader.readAsArrayBuffer(blob)
			}

			VAD({
				source,
				voice_start: onVoiceStart,
				voice_stop: onVoiceEnd,
				DEBUG: true
			})
		}
		
		// navigator.getUserMedia({audio: true}, init, err => {
		// 	console.error("No live audio input in this browser: " + err)
		// })

		if(this._audioWorkletModule){
			audioCtx.audioWorklet.addModule(this._audioWorkletModule.src)
				.then(() => getLiveAudio(audioCtx))
				.then(initRec)
				.catch(e => console.error(e))
		}else{
			const stream = getLiveAudio(audioCtx)
			stream.then(initRec).catch(e => console.error(e))
		}


		function getLiveAudio(audioCtx) {
			return navigator.mediaDevices.getUserMedia({ audio: true })
				.then(stream => audioCtx.createMediaStreamSource(stream))
		}
	}
	
	this.init()
}

module.exports = {Recognizer, Recorder, VAD, recognize}