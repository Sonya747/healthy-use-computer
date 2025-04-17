import os
import PyInstaller.__main__

params = [
    'main.py',
    '--name=myapi',
    '--onefile',
    '--noconsole',
    '--hidden-import=main',
    '--distpath=dist' # 输出到backend/dist目录
]
PyInstaller.__main__.run(params)