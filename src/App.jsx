import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow
} from 'lucide-react';
import './App.css';

const WeatherApp = () => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);

  // On mount, fetch current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
          fetchWeatherByCity('New York');
        }
      );
    }
  }, []);

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
      );

      if (!response.ok) throw new Error('Weather data not available');
      const data = await response.json();

      const geoResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const geoData = await geoResponse.json();

      setWeatherData({
        ...data,
        cityName: geoData.city || geoData.locality || 'Current Location'
      });
    } catch {
      setError('Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (cityName) => {
    setLoading(true);
    setError('');
    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) throw new Error('City not found');
      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) throw new Error('City not found');

      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
      );

      if (!weatherResponse.ok) throw new Error('Weather data not available');
      const weatherData = await weatherResponse.json();

      setWeatherData({
        ...weatherData,
        cityName: `${name}, ${country}`
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (city.trim()) fetchWeatherByCity(city.trim());
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      fetchWeatherByCoords(currentLocation.lat, currentLocation.lon);
      setCity('');
    }
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun size={32} color="gold" />;
    if (code <= 3) return <Cloud size={32} color="lightgray" />;
    if (code <= 67) return <CloudRain size={32} color="skyblue" />;
    if (code <= 77) return <CloudSnow size={32} color="lightblue" />;
    return <Cloud size={32} color="lightgray" />;
  };

  const getWeatherDescription = (code) => {
    const desc = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      61: 'Rain',
      71: 'Snow',
      95: 'Thunderstorm'
    };
    return desc[code] || 'Unknown';
  };

  return (
    <div className="weather-app">
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1>WeatherNow</h1>
          <p>Check live weather & forecast instantly</p>
        </div>

        {/* Search */}
        <div className="search-box">
          <div className="search-input">
            <Search className="search-icon" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Search city (e.g., Paris, Tokyo)"
            />
          </div>
          <div className="search-actions">
            <button onClick={handleSubmit} disabled={loading || !city.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            {currentLocation && (
              <button onClick={useCurrentLocation} className="location-btn">
                <MapPin />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && <div className="error">{error}</div>}

        {/* Weather Data */}
        {weatherData && !loading && (
          <div className="weather-data">
            {/* Current Weather */}
            <div className="current-weather">
              <div className="location-info">
                <h2>{weatherData.cityName}</h2>
                <p>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="weather-icon">
                {getWeatherIcon(weatherData.current_weather.weathercode)}
                <span>{getWeatherDescription(weatherData.current_weather.weathercode)}</span>
              </div>
            </div>

            <div className="temperature">
              <span className="temp">{Math.round(weatherData.current_weather.temperature)}°</span>
              <span className="unit">C</span>
            </div>

            {/* Stats */}
            <div className="stats">
              <div className="stat">
                <Wind />
                <p>Wind</p>
                <strong>{weatherData.current_weather.windspeed} km/h</strong>
              </div>
              <div className="stat">
                <Gauge />
                <p>Direction</p>
                <strong>{weatherData.current_weather.winddirection}°</strong>
              </div>
              <div className="stat">
                <Droplets />
                <p>Humidity</p>
                <strong>{weatherData.hourly?.relative_humidity_2m?.[0] || 'N/A'}%</strong>
              </div>
              <div className="stat">
                <Eye />
                <p>Visibility</p>
                <strong>
                  {weatherData.hourly?.visibility?.[0]
                    ? `${Math.round(weatherData.hourly.visibility[0] / 1000)} km`
                    : 'N/A'}
                </strong>
              </div>
            </div>

            {/* Forecast */}
            {weatherData.daily && (
              <div className="forecast">
                <h3>7-Day Forecast</h3>
                <div className="forecast-grid">
                  {weatherData.daily.time.slice(0, 7).map((date, i) => (
                    <div key={date} className="forecast-item">
                      <span className="day">
                        {i === 0 ? 'Today' : new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      {getWeatherIcon(weatherData.daily.weather_code[i])}
                      <div className="temps">
                        <span>{Math.round(weatherData.daily.temperature_2m_max[i])}°</span>
                        <span className="min">{Math.round(weatherData.daily.temperature_2m_min[i])}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Fetching weather data...</p>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          Data by <strong>Open-Meteo</strong> | Designed for all screens 🌍
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
