'use-strict'
// const {SPEECH_NAME_DEFAULT, SPEECH_DATA_SEPARATOR} = require('./const')
const SPEECH_NAME_DEFAULT = 'speech'
const SPEECH_DATA_SEPARATOR = '___SDS___'
const SPEECH_GOOGLE_RESULT_SEPARATOR = '___GRS___'
const SPEECH_SAVE_PATH = '/tmp/speech/'
const SPEECH_SAVE_PATH_L = SPEECH_SAVE_PATH + '70-80/' // low confidence
const SPEECH_SAVE_PATH_H = SPEECH_SAVE_PATH + '90/' // high confidence

const createSavePath = (projectPath, item, confidence) => {
    if(confidence >= .7){
        const path = (confidence <= .8) ? SPEECH_SAVE_PATH_L : SPEECH_SAVE_PATH_H
        return `${projectPath + path + item.getStartTime()}.wav`
    }else{
        return false
    }
}

// const getPathByConfidence = confidence => {
//     if(confidence >= .7){
//         const path = (confidence <= .8) ? SPEECH_SAVE_PATH_L : SPEECH_SAVE_PATH_H
//     }else{
//         return false
//     }
// }

const zip = (array, separator) =>
    array.join(separator)

const unzip = (string, separator) =>
    string.split(separator)

/**
 * Сохранение результатов распознавания в строку имени файла
 * где:
 * SPEECH_NAME_DEFAULT - Ключевое имя, для корректного перехвата
 * события will-download при скачивании файла
 * results: [
 *  transcript, - результат распознавания речи от гугла
 *  confidence  - степень доверия нейросети к корректности распознавания
 * ]
 * Считаю, что для корректного обучения Kaldi(VOSK-API) требуются значения не ниже 0,9
 * * @param {*} results 
 */
const zipResults = (res) => {
    const { results } = res
    const alternatives = (results && results[0] ? results[0].alternatives : null)
    const transcript = (alternatives && alternatives[0] ? alternatives[0].transcript : '')
    const confidence = (alternatives && alternatives[0] ? alternatives[0].confidence : '')
    const zippedResults = zip([transcript,confidence], SPEECH_GOOGLE_RESULT_SEPARATOR)
    return zip([SPEECH_NAME_DEFAULT, zippedResults], SPEECH_DATA_SEPARATOR)
}
const unzipResults = string => {
    const [fileName, results] = unzip(string, SPEECH_DATA_SEPARATOR)
    const [transcript, confidence] = unzip(results, SPEECH_GOOGLE_RESULT_SEPARATOR)
    return {fileName, transcript, confidence}
}
const isCorrectDownload = fileName =>
    fileName === SPEECH_NAME_DEFAULT

module.exports = {zipResults, unzipResults, isCorrectDownload, createSavePath}