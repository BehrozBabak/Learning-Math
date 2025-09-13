
# generate_coqui.py - تولید فایل‌های WAV فارسی با Coqui TTS
# Usage: pip install TTS
# Then run: python generate_coqui.py
from TTS.api import TTS
phrases = {
  "welcome":"سلام! من اسب تک‌شاخم، بیا با هم ریاضی‌بازی کنیم. آماده‌ای؟",
  "correct":"آفرین! خیلی خوب بود.",
  "wrong":"نه، اشکالی نداره، یه بار دیگه امتحان کن.",
  "hint":"راهنما: از شکل‌ها کمک بگیر و آرام بشمار.",
  "start_exam":"آزمون شروع شد. ده سوال داری؛ جواب‌ها رو انتخاب کن.",
  "congrats":"تبریک! کارت عالی بود، آفرین بهت!"
}
model_name = 'tts_models/fa/custom/persian-tts-coqui'
tts = TTS(model_name, progress_bar=False, gpu=False)
for k,v in phrases.items():
    out = f'sounds/{k}.wav'
    print('تولید', out)
    tts.tts_to_file(text=v, file_path=out)
print('پایان')