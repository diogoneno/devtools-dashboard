import { useState } from 'react';
import '../ToolLayout.css';

const UnitConverter = () => {
  const [category, setCategory] = useState('length');
  const [fromUnit, setFromUnit] = useState('meters');
  const [toUnit, setToUnit] = useState('feet');
  const [value, setValue] = useState('1');
  const [result, setResult] = useState('');

  const conversions = {
    length: {
      meters: 1,
      kilometers: 0.001,
      feet: 3.28084,
      miles: 0.000621371,
      inches: 39.3701,
      yards: 1.09361
    },
    weight: {
      kilograms: 1,
      grams: 1000,
      pounds: 2.20462,
      ounces: 35.274
    },
    temperature: {
      celsius: (v) => v,
      fahrenheit: (v) => (v * 9/5) + 32,
      kelvin: (v) => v + 273.15
    }
  };

  const convert = () => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setResult('Invalid number');
      return;
    }

    if (category === 'temperature') {
      // Special handling for temperature
      let celsius = num;
      if (fromUnit === 'fahrenheit') celsius = (num - 32) * 5/9;
      if (fromUnit === 'kelvin') celsius = num - 273.15;

      const converted = conversions.temperature[toUnit](celsius);
      setResult(converted.toFixed(2));
    } else {
      const baseValue = num / conversions[category][fromUnit];
      const converted = baseValue * conversions[category][toUnit];
      setResult(converted.toFixed(4));
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Unit Converter</h1>
        <p>Convert between different units of measurement</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="length">Length</option>
            <option value="weight">Weight</option>
            <option value="temperature">Temperature</option>
          </select>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label>From</label>
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
              {Object.keys(conversions[category]).map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>To</label>
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
              {Object.keys(conversions[category]).map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Value</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={convert}>Convert</button>

        {result && (
          <div className="success-message">
            {value} {fromUnit} = {result} {toUnit}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitConverter;
