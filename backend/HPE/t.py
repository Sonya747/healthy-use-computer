#%%
import numpy as np
from datasets import Pose_300WLP


data = Pose_300WLP('my_300WLP', 'my_300WLP.txt')
data2 = Pose_300WLP('my_AFLW2000', 'my_AFLW2000.txt')

n = 0
pitch_min = 0
pitch_max = 0
yaw_min = 0
yaw_max = 0
roll_min = 0
roll_max = 0

for img, labels, cont_labels, i in data2:
    if n <100000:
        pitch = cont_labels[0]
        yaw = cont_labels[1]
        roll = cont_labels[2]
        if pitch < pitch_min:
            pitch_min = pitch
        if pitch > pitch_max:
            pitch_max = pitch
        if yaw < yaw_min:
            yaw_min = yaw
        if yaw > yaw_max:
            yaw_max = yaw
        if roll < roll_min:
            roll_min = roll
        if roll > roll_max:
            roll_max = roll
        print(img.shape, labels, cont_labels, i)

        n += 1

#%%
print(pitch_min, pitch_max, yaw_min, yaw_max, roll_min, roll_max)
# tensor(-89.9716) tensor(89.5304) tensor(-44.9650) tensor(21.4310) tensor(-34.7984) tensor(25.3314)
# tensor(-76.4606) tensor(78.5077) tensor(-55.4047) tensor(48.4888) tensor(-58.3008) tensor(63.6054)
#%%
bins = np.array(range(-90, 90, 3))
a = np.digitize([yaw, pitch, roll], bins) - 1
print(a)

#%%
import torch
from torchsummary import summary
from models import ResNet34

# 查看模型结构
model = ResNet34().to('cuda')
summary(model, (3, 450, 450))

