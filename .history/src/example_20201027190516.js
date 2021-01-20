'use strict'
const hark = require('hark')
const Recorder = require('./recorder')
const { recognize } = require('./index')
const {zipResults} = require('./utils')

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
	onAllStart = () => console.log('onAllStart'),
	onAllStop = () => console.log('onAllStop'),
	options = {}
}){
	const {
		isSpeech2Text = true,
		autoInit = true,
		forced = true,
		idleDelay = 5000,
		harkOptions = {},
		save = false
	} = options
	// it's might be an issue with memory (global)
	this._isSpeech2Text = isSpeech2Text
	this._idleTimeout = null
	this._touched = false
	this._recorder = { worker: false }
	
	const mediaListener = stream => {
		this.Stream = stream
		const speechEvents = hark(stream, harkOptions)

		this._audioContext = new AudioContext({sampleRate: 16000});
		const source = this._audioContext.createMediaStreamSource(stream)		
		this._recorder = new Recorder(source, {numChannels: 1})

		const onVoiceStart = () => {
			this._touched = true
			startRecording()
			onSpeechStart()
		}
		const onVoiceEnd = () => {
			speechEvents.stop()
			stopRecording()
			onSpeechEnd()
		}

		// не понятно надо отвязывать или нет (автоматическая сборка мусора, не?)
		speechEvents.on('speaking', onVoiceStart)
		speechEvents.on('stopped_speaking', onVoiceEnd)

		const startRecording = () => {
			if(this._isSpeech2Text) this._recorder.record()
		}
		const stopRecording = () => {
			restartIdleTimeout()
			this._recorder.stop()
			if(this._isSpeech2Text) this._recorder.exportWAV(googleSpeechRequest) // might be a bug
			this._recorder.clear() // иначе, запись склеивается
		}

		const speechSave = (results, buffer) => {
			let link = document.createElement('a')
			const blob = new Blob([buffer], {type: 'audio/x-wav'})
			link.href = URL.createObjectURL(blob)
			link.setAttribute("download", zipResults(results))
			link.click()
			URL.revokeObjectURL(link.href)
		}

		const googleSpeechRequest = blob => {
			const { googleCloud = [] } = apiKeys
			const [googleCloudKey] = googleCloud
			let reader = new FileReader()
			reader.onload = async function() {
				if (reader.readyState == 2) {
					const buffer = reader.result
					const uint8Array = new Uint8Array(buffer)
					const recognitionResult = await recognize(uint8Array, googleCloudKey)
					onSpeechRecognized(recognitionResult, buffer)
					if(save) speechSave(recognitionResult, buffer)
				}
			}
			reader.readAsArrayBuffer(blob)
		}

		const forcedStartRecord = () => {
			if(forced){
				startRecording()
			}
		}

		const restartIdleTimeout = () => {
			clearTimeout(this._idleTimeout)
			if(idleDelay){
				this._idleTimeout = setTimeout(beforeStopAll, idleDelay)
			}
		}
		const beforeStopAll = () => {
			// console.log('beforeStopAll', recorder.recording)
			const isRecording = this._recorder.recording
			const wasSpeech = this._touched
			const isIdleWithotSpeech = !wasSpeech && isRecording
			// если делать clearTimeout(this._idleTimeout) в stopListening то не надо
			// const audioNodeAlreadyClosed = this._audioContext.state === 'closed'
			// if(audioNodeAlreadyClosed){
			// 	console.log('lol')
			// 	return
			// }
			if(isIdleWithotSpeech){
				return this.stopAll()
			}
			if(isRecording){
				return restartIdleTimeout()
			}else{
				return this.stopAll()
			}
		}

		onAllStart()
		forcedStartRecord()
		// this.startIdleTimeout()
		restartIdleTimeout()
	}

	this.startListening = () => {
		navigator.getUserMedia({audio: true}, mediaListener, err => {
			console.error("No live audio input in this browser: " + err)
		})
	}
	this.stopListening = async () => {
		// console.log('stopListening', this._audioContext.state)
		clearTimeout(this._idleTimeout)
		if(this._audioContext.state !== 'closed'){ // по сути недостижимо, ибо чистим idleTimeout
			this.Stream.getTracks()[0].stop()
			await this._audioContext.close()
		}
	}
	
	this.stopRecognize = () => {
		this._isSpeech2Text = false
	}
	this.startRecognize = () => {
		this._isSpeech2Text = true
	}

	this.stopAll = async () => {
		// не понятно, останавливается ли запись
		if(this._recorder.worker) this._recorder.worker.terminate()
		this.stopRecognize()
		await this.stopListening()
		onAllStop()
	}
	this.startAll = async () => {
		await this.stopAll() // во избежание дублирования
		this.startRecognize()
		this.startListening()
	}
	
	if(autoInit){
		this.startListening()
	}
}

module.exports = {Recognizer, Recorder, recognize}