'use-strict'
const ffmetadata = require("ffmetadata")
// const ds = require('disk-space')()

const {
    unzipResults,
    isCorrectDownload,
    createSavePath
} = require('./utils')
/**
 * title - is a transcript
 * comment - is a confidence
 * @param {*} savePath 
 * @param {*} param1 
 */
const setMetadata = (savePath, [title, comment]) => {
    ffmetadata.write(savePath, {title, comment}, function(err) {
        if (err) console.error("Error writing metadata", err);
        else console.log("Data written");

        ffmetadata.read(savePath, function(err, data) {
            if (err) console.error("ffmetadata Error reading metadata", err)
            else console.log('ffmetadata', data)
            // console.log('need to put:', transcription)
        })
    })
}

function speechSaverHandler(projectPath, e, item, webContents){
    const {
        fileName,
        transcript,
        confidence
    } = unzipResults(item.getFilename())
    
    if(isCorrectDownload(fileName) && transcript && confidence){
        // ds("/" , function(error , data){
        //     console.log(data)   // return {usedSize : "" , totalSize : ""}  in Byte
        // })
        const savePath = createSavePath(projectPath, item, confidence)
        if(savePath){
            item.setSavePath(savePath)
            item.once('done', (event, state) => {
                if (state === 'completed') {
                    setMetadata(savePath, [transcript, confidence])
                } else {
                    console.log(`Download failed: ${state}`)
                }
            })
        }
    }else{
        console.log("A speech file won't save")
        e.preventDefault()
    }
}

module.exports = {speechSaverHandler}
