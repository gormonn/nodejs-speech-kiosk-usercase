'use strict'


// var lastDate = 0;
// var data = []
// var TICKINTERVAL = 86400000
// let XAXISRANGE = 777600000
// // function getDayWiseTimeSeries(baseval, count, yrange) {
// //   var i = 0;
// //   while (i < count) {
// //     var x = baseval;
// //     var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

// //     data.push({
// //       x, y
// //     });
// //     lastDate = baseval
// //     baseval += TICKINTERVAL;
// //     i++;
// //   }
// // }

// // getDayWiseTimeSeries(new Date('11 Feb 2017 GMT').getTime(), 10, {
// //   min: 10,
// //   max: 90
// // })

// function getNewSeries(baseval, y) {
//   var newDate = baseval + TICKINTERVAL;
//   lastDate = newDate

//   for(var i = 0; i< data.length - 10; i++) {
//     // IMPORTANT
//     // we reset the x and y of the data which is out of drawing area
//     // to prevent memory leaks
//     data[i].x = newDate - XAXISRANGE - TICKINTERVAL
//     data[i].y = 0
//   }

//   data.push({
//     x: newDate,
//     y
//   })

//   chart.updateSeries([{ data }])
// }

// function resetData(){
//   // Alternatively, you can also reset the data at certain intervals to prevent creating a huge series 
//   data = data.slice(data.length - 10, data.length);
// }


// const ApexCharts = require('apexcharts/dist/apexcharts.common')

// // let data = []

// var options = {
//   series: [{ data: data.slice() }],
//   chart: {
//     id: 'realtime',
//     height: 350,
//     type: 'line',
//     animations: {
//       enabled: true,
//       easing: 'linear',
//       dynamicAnimation: {speed: 1000}
//     },
//     toolbar: {show: false},
//     zoom: {enabled: false}
//   },
//   dataLabels: {enabled: false},
//   stroke: {curve: 'smooth'},
//   title: {
//     text: 'Dynamic Updating Chart',
//     align: 'left'
//   },
//   markers: {size: 0},
//   xaxis: {
//     type: 'datetime',
//     range: XAXISRANGE,
//   },
//   yaxis: {max: 30, min: -30},
//   legend: {show: false}
// };

// var chart = new ApexCharts(document.querySelector("#chart"), options);
// chart.render()

// window.setInterval(function () {
//   getNewSeries(lastDate, { min: 10, max: 90 })
//   chart.updateSeries([{ data: data }])
// }, 1000)

// var chart = new ApexCharts(document.querySelector('#chart'), options)
// chart.appendSeries({
//   name: 'newSeries',
//   data: [32, 44, 31, 41, 22]
// })
// chart.render()

//https://github.com/kdavis-mozilla/vad.js
class VAD {
  constructor(options) {
    // console.log({options})
    // debugger;
    // Default options
    this.options = {
      fftSize: 512, //512,
      bufferLen: 512, //512,
      voice_stop: function () { },
      voice_start: function () { },
      smoothingTimeConstant: 0.99,
      energy_offset: 1e-8,
      energy_threshold_ratio_pos: 2,
      energy_threshold_ratio_neg: 0.5,
      energy_integration: 1,
      filter: [
        { f: 200, v: 0 },
        { f: 2000, v: 1 } // 200 -> 2k is 1
      ],
      source: null,
      context: null,
      DEBUG: false
    };
    this.canvas = document.getElementById('draw')
    this.canvasCtx = this.canvas.getContext("2d");
    // User options
    for (let option in options) {
      if (options.hasOwnProperty(option)) {
        this.options[option] = options[option];
      }
    }
    // Require source
    if (!this.options.source)
      throw new Error("The options must specify a MediaStreamAudioSourceNode.");
    // Set this.options.context
    this.options.context = this.options.source.context;
    // Calculate time relationships
    this.hertzPerBin = this.options.context.sampleRate / this.options.fftSize;
    this.iterationFrequency = this.options.context.sampleRate / this.options.bufferLen;
    this.iterationPeriod = 1 / this.iterationFrequency;
    // let DEBUG = true;
    if (this.options.DEBUG)
      console.log('Vad' +
        ' | sampleRate: ' + this.options.context.sampleRate +
        ' | hertzPerBin: ' + this.hertzPerBin +
        ' | iterationFrequency: ' + this.iterationFrequency +
        ' | iterationPeriod: ' + this.iterationPeriod);
    this.setFilter = function (shape) {
      this.filter = [];
      for (let i = 0, iLen = this.options.fftSize / 2; i < iLen; i++) {
        this.filter[i] = 0;
        for (let j = 0, jLen = shape.length; j < jLen; j++) {
          if (i * this.hertzPerBin < shape[j].f) {
            this.filter[i] = shape[j].v;
            break; // Exit j loop
          }
        }
      }
    };
    this.setFilter(this.options.filter);
    this.ready = {};
    this.vadState = false; // True when Voice Activity Detected
    // Energy detector props
    this.energy_offset = this.options.energy_offset;
    this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos;
    this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg;
    this.voiceTrend = 0;
    this.voiceTrendMax = 10;
    this.voiceTrendMin = -10;
    this.voiceTrendStart = 5;
    this.voiceTrendEnd = -5;
    // Create analyser 
    this.analyser = this.options.context.createAnalyser();
    this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant; // 0.99;
    this.analyser.fftSize = this.options.fftSize;
    this.floatFrequencyData = new Float32Array(this.analyser.frequencyBinCount);
    // Setup local storage of the Linear FFT data
    this.floatFrequencyDataLinear = new Float32Array(this.floatFrequencyData.length);
    // Connect this.analyser
    this.options.source.connect(this.analyser);
    // Create ScriptProcessorNode
    this.scriptProcessorNode = this.options.context.createScriptProcessor(this.options.bufferLen, 1, 1);
    // Connect scriptProcessorNode (Theretically, not required)
    this.scriptProcessorNode.connect(this.options.context.destination);
    // Create callback to update/analyze floatFrequencyData
    let self = this;
    this.scriptProcessorNode.onaudioprocess = function (e) {
      console.log('onaudioprocess')
      // const floatSamples = e.inputBuffer.getChannelData(0)
      // console.log(floatSamples.getSettings())
      self.analyser.getFloatFrequencyData(self.floatFrequencyData);
      self.update();
      self.monitor();
    };
    // Connect scriptProcessorNode
    this.options.source.connect(this.scriptProcessorNode);
    // log stuff
    this.logging = false;
    this.log_i = 0;
    this.log_limit = 100;
    this.triggerLog = function (limit) {
      this.logging = true;
      this.log_i = 0;
      this.log_limit = typeof limit === 'number' ? limit : this.log_limit;
    };
    this.log = function (msg) {
      if (this.logging && this.log_i < this.log_limit) {
        this.log_i++;
        console.log(msg);
      }
      else {
        this.logging = false;
      }
    };
    this.update = function () {
      // Update the local version of the Linear FFT
      let fft = this.floatFrequencyData;
      for (let i = 0, iLen = fft.length; i < iLen; i++) {
        this.floatFrequencyDataLinear[i] = Math.pow(10, fft[i] / 10);
      }
      this.ready = {};
    };
    this.getEnergy = function () {
      if (this.ready.energy) {
        return this.energy;
      }
      let energy = 0;
      let fft = this.floatFrequencyDataLinear;
      for (let i = 0, iLen = fft.length; i < iLen; i++) {
        energy += this.filter[i] * fft[i] * fft[i];
      }
      this.energy = energy;
      this.ready.energy = true;
      return energy;
    };
    let logg = []
    this.monitor = function () {
      let energy = this.getEnergy();
      let signal = energy - this.energy_offset;
      if (signal > this.energy_threshold_pos) {
        this.voiceTrend = (this.voiceTrend + 1 > this.voiceTrendMax) ? this.voiceTrendMax : this.voiceTrend + 1;
      }
      else if (signal < -this.energy_threshold_neg) {
        this.voiceTrend = (this.voiceTrend - 1 < this.voiceTrendMin) ? this.voiceTrendMin : this.voiceTrend - 1;
      }
      else {
        // voiceTrend gets smaller
        if (this.voiceTrend > 0) {
          this.voiceTrend--;
        }
        else if (this.voiceTrend < 0) {
          this.voiceTrend++;
        }
      }
      let start = false, end = false;
      if (this.voiceTrend > this.voiceTrendStart) {
        // Start of speech detected
        start = true;
      }
      else if (this.voiceTrend < this.voiceTrendEnd) {
        // End of speech detected
        end = true;
      }
      // const loggData = {
      //   energy,
      //   energy_offset: this.energy_offset,
      //   energy_threshold_pos: this.energy_threshold_pos,
      //   energy_threshold_neg: this.energy_threshold_neg,
      //   signal, integration, voiceTrend: this.voiceTrend, start, end
      // }

      // logg.push(this.voiceTrend)
      // getNewSeries(lastDate, this.voiceTrend)

      // Integration brings in the real-time aspect through the relationship with the frequency this functions is called.

      // Интеграция привносит аспект реального времени через связь с частотой, которую называют эти функции.
      let integration = signal * this.iterationPeriod * this.options.energy_integration;

      // Idea?: The integration is affected by the voiceTrend magnitude? - Not sure. Not doing atm.
      // The !end limits the offset delta boost till after the end is detected.

      // Идея ?: На интеграцию влияет величина voiceTrend? - Точно сказать не могу. Не делаю атм.
      //! End ограничивает увеличение дельты смещения до тех пор, пока не будет обнаружен конец.
      if (integration > 0 || !end) {
        this.energy_offset += integration;
      }
      else {
        this.energy_offset += integration * 10;
      }
      this.energy_offset = this.energy_offset < 0 ? 0 : this.energy_offset;
      this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos;
      this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg;
      // Broadcast the messages
      if (start && !this.vadState) {
        this.vadState = true;
        this.options.voice_start();
      }
      if (end && this.vadState) {
        console.log(logg)
        this.vadState = false;
        this.options.voice_stop();
      }
      this.log('e: ' + energy +
        ' | e_of: ' + this.energy_offset +
        ' | e+_th: ' + this.energy_threshold_pos +
        ' | e-_th: ' + this.energy_threshold_neg +
        ' | signal: ' + signal +
        ' | int: ' + integration +
        ' | voiceTrend: ' + this.voiceTrend +
        ' | start: ' + start +
        ' | end: ' + end);
      return signal;
    };
  }
}

module.exports = VAD