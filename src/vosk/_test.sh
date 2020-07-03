file=$1
ext="${file##*.}"
name="${file%.*}"
model=$2
# echo $name
# echo $ext
# echo $file.wav

FILE=$file.wav
if [ ! -f "$FILE" ]; then
    echo "Converting file to wav"
    python mp32wav.py $file
fi
echo "Starting vosk-api"
python test_simple.py $file.wav $model