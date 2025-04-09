import torch
import torch.nn as nn
import torch.nn.functional as F


# Basic Block for ResNet
class BasicBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1):
        super(BasicBlock, self).__init__()

        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)

        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)
        out = F.relu(out)
        return out


# ResNet-34 Model
class ResNet34(nn.Module):
    def __init__(self):
        super(ResNet34, self).__init__()

        self.in_channels = 64
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)

        self.layer1 = self._make_layer(64, 3, stride=1)
        self.layer2 = self._make_layer(128, 4, stride=2)
        self.layer3 = self._make_layer(256, 6, stride=2)
        self.layer4 = self._make_layer(512, 3, stride=2)

        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.Flatten = nn.Flatten(1)
        self.linear = nn.Linear(512, 128)
        self.relu = nn.ReLU()

        self.fc_yaw = nn.Linear(128, 19)  # Yaw: 19类
        self.fc_pitch = nn.Linear(128, 38)  # Pitch: 38类
        self.fc_roll = nn.Linear(128, 38)  # Roll: 38类

    def _make_layer(self, out_channels, num_blocks, stride):
        layers = []
        layers.append(BasicBlock(self.in_channels, out_channels, stride))
        self.in_channels = out_channels
        for _ in range(1, num_blocks):
            layers.append(BasicBlock(self.in_channels, out_channels))
        return nn.Sequential(*layers)

    def forward(self, x):
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        x = self.Flatten(x)
        x5 = self.linear(x)
        x5 = self.relu(x5)

        x5 = x5.view(x5.size(0), -1)
        pre_yaw = self.fc_yaw(x5)  # 输出19类
        pre_pitch = self.fc_pitch(x5)  # 输出38类
        pre_roll = self.fc_roll(x5)  # 输出38类

        yaw_bin = pre_yaw - torch.max(pre_yaw, dim=1, keepdim=True).values
        pitch_bin = pre_pitch - torch.max(pre_pitch, dim=1, keepdim=True).values
        roll_bin = pre_roll - torch.max(pre_roll, dim=1, keepdim=True).values

        return yaw_bin, pitch_bin, roll_bin



