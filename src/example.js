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
	options = {}
}){
	const {
		isSpeech2Text = true,
		autoInit = true,
		forced = true,
		vad = {}
	} = options
	this._isSpeech2Text = isSpeech2Text

	const mediaListener = stream => {
		this._audioContext = new AudioContext();
		const source = this._audioContext.createMediaStreamSource(stream)

		const recorder = new Recorder(source, {numChannels: 1})


		const onVoiceStart = () => {
			startRecording()
			onSpeechStart()
		}
		const onVoiceEnd = () => {
			stopRecording()
			onSpeechEnd()
		}

		const startRecording = () => {
			if(this._isSpeech2Text) recorder.record()
		}
		const stopRecording = () => {
			recorder.stop()
			if(this._isSpeech2Text) recorder.exportWAV(googleSpeechRequest)
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
			...vad,
			source,
			voice_start: onVoiceStart,
			voice_stop: onVoiceEnd,
			DEBUG: true
		})

		if(forced){
			onVoiceStart()
			setTimeout(onVoiceEnd, 5000)
		}
	}
	
	this.startListening = () => {
		navigator.getUserMedia({audio: true}, mediaListener, err => {
			console.error("No live audio input in this browser: " + err)
		})
	}
	this.stopListening = async () => {
		await this._audioContext.close();
	}
	
	this.stopRecognize = () => {
		this._isSpeech2Text = false
	}
	this.startRecognize = () => {
		this._isSpeech2Text = true
	}

	this.stopAll = async () => {
		this.stopRecognize()
		await this.stopListening()
	}
	this.startAll = async () => {
		this.startRecognize()
		this.startListening()
	}

	if(autoInit){
		this.startListening()
	}
}

module.exports = {Recognizer, Recorder, VAD, recognize}