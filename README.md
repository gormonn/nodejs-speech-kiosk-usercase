# nodejs-speech-kiosk-usercase
Google Speech node-js build for Electron kiosk usercase.

This is just a library build, for a specific project on Electron.

I hope this is a temporary solution. Dictated by a bug:

https://github.com/googleapis/nodejs-speech/issues/547

googleapis/nodejs-speech#547

> @gormonn In your specific case (kiosk application), you can use API keys for authentication. We don't advertise this option too much because we really don't want it to be used in browsers (where users could easily see the api key in the source code).
> 
> **For those who read it: the example below can only be used in kiosk usecase. For regular browsers, please use `OAuth2Client` to implement a proper authentication workflow.**
> 
> Quick'n'dirty example: https://gist.github.com/alexander-fenster/5ee5f04423ede10f008ae59e4b10d9c4 (I tested this in Chrome but not in Electron, but should be pretty much the same)
> More on API keys: https://cloud.google.com/docs/authentication/api-keys
> 
> Let me know if you need help!

Install:

`yarn add nodejs-speech-kiosk-usercase`

Example usage:

```
const {Recognizer} = require('nodejs-speech-kiosk-usercase')
const apiKeys = {
	googleCloud: ['YOUR_API_KEY']
}

const Rec = new Recognizer({
	apiKeys, 
	onSpeechRecognized: res => console.log('РЕЗУЛЬТАТ! ' + JSON.stringify(res)), 
	onSpeechStart: () => console.log('ГОВОРИТ!'), // fires on speech started
	onSpeechEnd: () => console.log('ЗАМОЛЧАЛ!'), // fires on speech ended
	options: {
		isSpeech2Text = true,
		autoInit = true,
		forced = true, // forced start recording
		vad = {} // pass options to vad function
	}
})

// Rec.startAll() - start listening, recording and recognize
// Rec.stopAll() - stop listening, recording and recognize

// Rec.startListening() - start listening
// Rec.stopListening() - stop listening

// Rec.stopRecognize() - stop recording and recognize
// Rec.startRecognize() - start recording and recognize
```
> **For those who read it: the example below can only be used in kiosk usecase. For regular browsers, please use `OAuth2Client` to implement a proper authentication workflow.**

# Saving WAV files to local machine
Add this to Electron's `main` process:
```
const {app, BrowserWindow} = require('electron')
const {speechSaverHandler} = require('nodejs-speech-kiosk-usercase/src/utils-node')

const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
})
// than add this handler to your 'will-download' event

const projectPath = app.getAppPath()
win.webContents.session.on('will-download', function(...rest){
	speechSaverHandler(projectPath, ...rest)
})
```
Then set the `save` option in your Recognizer:
```
const Rec = new Recognizer({
	apiKeys, 
	onSpeechRecognized: res => console.log('РЕЗУЛЬТАТ! ' + JSON.stringify(res)), 
	onSpeechStart: () => console.log('ГОВОРИТ!'), // fires on speech started
	onSpeechEnd: () => console.log('ЗАМОЛЧАЛ!'), // fires on speech ended
	options: {
		save: true
	}
})

```
Enjoy!

Создание ключа:
1. https://console.cloud.google.com/apis/credentials
2. Клик "Создать учетные данные" > "Ключ API" > "Применить ограничения для ключа"
3. Выбрать "Допустимый тип приложений" > "HTTP-источники перехода (веб-сайты)"
4. Сохранить

> More on API keys: https://cloud.google.com/docs/authentication/api-keys