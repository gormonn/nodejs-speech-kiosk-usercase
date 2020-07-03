# !/bin/bash
url=$1
# url="https://github.com/daanzu/kaldi-active-grammar/releases/download/v1.4.0/vosk-model-en-us-daanzu-20200328.zip"
file="${url##*/}"
name="${file%.*}"
# echo $file
# echo $name

if [ -z $2 ];
# empty name
then modelfoldername="models/model"
else modelfoldername="models/${2}"
fi

# rm model --dir
wget $url
unzip $name
mv $name $modelfoldername
rm $file