# nodejs-speech-kiosk-usercase
Google Speech node-js build for Electron kiosk usercase
This is just a library build, for a specific project on Electron.

I hope this is a temporary solution. Dictated by a bug:
https://github.com/googleapis/nodejs-speech/issues/547

> @gormonn In your specific case (kiosk application), you can use API keys for authentication. We don't advertise this option too much because we really don't want it to be used in browsers (where users could easily see the api key in the source code).
> 
> **For those who read it: the example below can only be used in kiosk usecase. For regular browsers, please use `OAuth2Client` to implement a proper authentication workflow.**
> 
> Quick'n'dirty example: https://gist.github.com/alexander-fenster/5ee5f04423ede10f008ae59e4b10d9c4 (I tested this in Chrome but not in Electron, but should be pretty much the same)
> More on API keys: https://cloud.google.com/docs/authentication/api-keys
> 
> Let me know if you need help!

