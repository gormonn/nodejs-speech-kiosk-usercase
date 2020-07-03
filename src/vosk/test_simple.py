#!/usr/bin/env python3

from vosk import Model, KaldiRecognizer, SetLogLevel
import sys
import os
import wave
import json
import collections

SetLogLevel(0)

# if(sys.argv[1])

arg_names = ['command', 'sound', 'modelfolder']
args = dict(zip(arg_names, sys.argv))
Arg_list = collections.namedtuple('Arg_list', arg_names)
args = Arg_list(*(args.get(arg, None) for arg in arg_names))

if(args.modelfolder==None):
    modelfolder = "models/model"
else:
    modelfolder = args.modelfolder
    

print(modelfolder)
if not os.path.exists(modelfolder):
    print ("Please download the model from https://github.com/alphacep/vosk-api/blob/master/doc/models.md and unpack as 'model' in the current folder.")
    exit (1)

wf = wave.open(sys.argv[1], "rb")
if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
    print("Channels: %s" % wf.getnchannels())
    print("getsampwidth: %s" % wf.getsampwidth())
    print("getcomptype: %s" % wf.getcomptype())
    print ("Audio file must be WAV format mono PCM.")
    exit (1)

model = Model(modelfolder)
rec = KaldiRecognizer(model, wf.getframerate())

READABLE_RESULT=1
READABLE_PREFIX=0
READABLE_PARTIAL=0

def _printResultReadable(rec_Result, partial=False):
    if partial==False:
        key = 'text'
    else:
        key = 'partial'

    result = json.loads(rec_Result())[key]
    if(result!=''):
        if(READABLE_PREFIX):
            print("%s: %s" % (key, result))
        else:
            print(result)

def _printResultSimple(rec_Result):
    print(rec_Result())

def printResult(rec_Result, partial=False):
    if READABLE_RESULT==1:
        _printResultReadable(rec_Result, partial)
    else:
        _printResultSimple(rec_Result)


while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    if rec.AcceptWaveform(data):
        printResult(rec.Result)
    elif READABLE_PARTIAL==1:
        printResult(rec.PartialResult, True)

printResult(rec.FinalResult)
