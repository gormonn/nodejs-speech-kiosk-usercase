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

// todo: добавить возможность остановить прослушку

function Recognizer({
	apiKeys,
	onSpeechStart = () => console.log('voice_start'),
	onSpeechEnd = () => console.log('voice_stop'),
	onSpeechRecognized = res => console.log('onSpeechRecognized', res),
	isSpeech2Text = true,
	autoStart = true
}){
	this._isSpeech2Text = isSpeech2Text

	this.stopRecognize = () => {
		this._isSpeech2Text = false
	}
	this.startRecognize = () => {
		this._isSpeech2Text = true
	}

	const mediaListener = stream => {
		this._audioContext = new AudioContext();
		const source = this._audioContext.createMediaStreamSource(stream)

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
					onSpeechRecognized(recognitionResult)
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
	
	this.startListening = () => {
		navigator.getUserMedia({audio: true}, mediaListener, err => {
			console.error("No live audio input in this browser: " + err)
		})
	}

	this.stopListening = async () => {
		await this._audioContext.close();
	}

	this.stopAll = async () => {
		this.stopRecognize()
		await this.stopListening()
	}

	this.startAll = async () => {
		this.startRecognize()
		this.startListening()
	}

	if(autoStart){
		this.startListening()
	}
}

module.exports = {Recognizer, Recorder, VAD, recognize}