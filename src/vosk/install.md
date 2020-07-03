```
conda create --name speech-kiosk python=3.8 -y
conda activate speech-kiosk
cd src/vosk
pip install -r requirements.txt
sudo apt-get install ffmpeg
```

models list:
https://alphacephei.com/vosk/models.html

download models:
```
sh _model_loader.sh [url_to_model] [folder_name]
```

example:
```
#download and save model to models/ru-small
sh _model_loader.sh https://alphacephei.com/vosk/models/vosk-model-small-ru-0.4.zip ru-small

#download and save model to models/ru-big
sh _model_loader.sh https://alphacephei.com/vosk/models/vosk-model-ru-0.10.zip ru-big

#download and save model to models/model
sh _model_loader.sh https://alphacephei.com/vosk/models/vosk-model-ru-0.10.zip
```

run:
```
sh _test.sh [path_to_mp3_file] [path_to_ml_model]
```

example:
```
cd src/vosk
conda activate speech-kiosk
sh _test.sh ./example/anacondaz-novyi-priut.mp3 models/ru-big
```