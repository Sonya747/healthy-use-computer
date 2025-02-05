import React, { CSSProperties, useState } from 'react';
import { Slider } from 'antd';

const Screen = () => {
    const [brightness, setBrightness] = useState(100);
    const [temperature, setTemperature] = useState(6500);
    const [saturation, setSaturation] = useState(100);

    const handleBrightnessChange = (value: number) => {
        setBrightness(value);
    };

    const handleTemperatureChange = (value: number) => {
        setTemperature(value);
    };

    const handleSaturationChange = (value: number) => {
        setSaturation(value);
    };

    const screenStyle:CSSProperties = {
        // filter: `brightness(${brightness}%) saturate(${saturation}%)`,
        // backgroundColor: `hsl(0, 0%, ${100 - temperature / 100}%)`,
        // height: '100vh',
        // display: 'flex',
        // flexDirection: 'column',
        // alignItems: 'center',
        // justifyContent: 'center'
    };

    return (
        <div style={screenStyle}>
            <h1>Screen Settings</h1>
            <div style={{ width: '80%', marginBottom: '20px' }}>
                <label>Brightness:</label>
                <Slider min={0} max={200} value={brightness} onChange={handleBrightnessChange} />
            </div>
            <div style={{ width: '80%', marginBottom: '20px' }}>
                <label>Color Temperature:</label>
                <Slider min={1000} max={10000} value={temperature} onChange={handleTemperatureChange} />
            </div>
            <div style={{ width: '80%', marginBottom: '20px' }}>
                <label>Saturation:</label>
                <Slider min={0} max={200} value={saturation} onChange={handleSaturationChange} />
            </div>
        </div>
    );
};

export default Screen;