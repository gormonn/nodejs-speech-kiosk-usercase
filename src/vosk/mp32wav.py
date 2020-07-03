# from transliterate import translit, get_available_language_codes    
import sys
from os import path
from pydub import AudioSegment

# print(translit(u"Дайте танк (!) - Спам.mp3", reversed=True))

# files                                                                         
src = sys.argv[1]
dst = "%s.wav" % src

# convert wav to mp3                                                            
sound = AudioSegment.from_mp3(src)
newSound = sound.set_channels(1).set_frame_rate(16000).export(dst, bitrate="16k", format="wav")