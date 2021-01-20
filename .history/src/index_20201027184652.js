'use strict'
// Copyright 2020 Google LLC
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Never use API keys in applications where users can access the source code
// (e.g. in websites). Use OAuth2Client instead. This example is for specific
// use case (kiosk where users have no source access).
// Details here: https://github.com/googleapis/nodejs-speech/issues/547
// For more information about API keys, please visit
// https://cloud.google.com/docs/authentication/api-keys

const speech = require('@google-cloud/speech');
const { GoogleAuth } = require('google-auth-library');
// const Speech = require('./gs/build/src');

async function recognize(
  content,
  apiKey,
  languageCode = 'ru-RU',
  onData = data => console.log({data})
){
  const googleAuth = new GoogleAuth();
  const auth = googleAuth.fromAPIKey(apiKey)
  const client = new speech.v1p1beta1.SpeechClient({auth});
  // const client = new Speech.v1p1beta1.SpeechClient({
  //   auth,
  //   fallback: true
  // })
  const audio = {
    content
  };
  const config = {
    encoding: 'LINEAR16',
    languageCode // 'en-US'
  };
  const request = {
    audio,
    config,
    interimResults: true,  // возврат промежуточных результатов распознавания
    singleUtterance: true   // непрерывность распознавания из стрима (пауза не сработает из файла)
  };

  const [response] = await client.recognize(request);
  return response
  
  // const recognizeStream = client.streamingRecognize(request)
  //   .on('error', console.error)
  //   .on('data', data => console.log('recognizeStream', data))
  // return recognizeStream

  // Create a recognize stream
  // const recognizeStream = client
  //   .streamingRecognize(request)
  //   .on('error', console.error)
  //   .on('data', onData);
}

module.exports = {recognize};

// class Speech{
//   construnctor(API_KEY, language = 'ru-RU'){
//     this.apiKey = API_KEY
//     this.languageCode = language // en-US
//   }
//   init(apiKey){
//     // const { apiKey } = this
//     const googleAuth = new GoogleAuth();
//     this.auth = googleAuth.fromAPIKey(apiKey);
//     console.log({apiKey, auth: this.auth})
//   }
//   async recognize(content){
//     const { auth, languageCode } = this
//     // const { apiKey, languageCode } = this
//     // const googleAuth = new GoogleAuth();
//     // const auth = googleAuth.fromAPIKey(apiKey);
//     const client = new speech.v1p1beta1.SpeechClient({auth});
//     const audio = {
//       content
//     };
//     const config = {
//       encoding: 'LINEAR16',
//       languageCode
//     };
//     const request = {
//       audio,
//       config,
//     };
//     const [response] = await client.recognize(request);
//     return response;
//   }
// }

// module.exports = Speech