# -*- coding: utf-8 -*-
import shutil
import time

source = "SNOTE_CHINH_THUC.docx"
targets = ["SNOTE.docx", "SNOTE_DONG_BO.docx"]

print(f"Applying {source} to {targets}...")
for target in targets:
    for i in range(10):
        try:
            shutil.copyfile(source, target)
            print(f"-> Successfully updated {target}!")
            break
        except PermissionError:
            print(f"[{i+1}/10] {target} is currently open in Word. Retrying in 2 seconds...")
            time.sleep(2)
        except Exception as e:
            print(f"Error copying to {target}: {e}")
            break
