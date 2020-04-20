const Recorder = require('recorderjs')
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
	keys,
	onSpeechStart = () => console.log('voice_start'),
	onSpeechEnd = () => console.log('voice_stop'),
	onSpeechRecognized = res => console.log('onSpeechRecognized', res)
}){
	navigator.getUserMedia({audio: true}, init, err => {
		console.error("No live audio input in this browser: " + err)
	})

	function init(stream){
		const audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(stream)

		const recorder = new Recorder(source, {numChannels: 1})

		VAD({
			source,
			voice_start: onVoiceStart,
			voice_stop: onVoiceEnd,
			DEBUG: true
		})

		function onVoiceStart(){
			onSpeechStart()
			recorder.record()
		}

		function onVoiceEnd(){
			onSpeechEnd()
			stopRecording()
		}

		function stopRecording() {
			recorder.stop();
			// gumStream.getAudioTracks()[0].stop();
			recorder.exportWAV(googleSpeechRequest);
			recorder.clear(); // иначе, запись склеивается
		}

		function googleSpeechRequest(blob) {
			let reader = new FileReader()
			reader.onload = async function() {
				if (reader.readyState == 2) {
					const uint8Array = new Uint8Array(reader.result);
					const recognitionResult = await recognize(uint8Array, keys.googleCloud[0]);
					onSpeechRecognized(recognitionResult)
					// console.log({recognitionResult})
				}
			}
			reader.readAsArrayBuffer(blob)
		}
	}
}

module.exports = {Recognizer}