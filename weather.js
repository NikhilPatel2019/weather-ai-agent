import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function getWeatherDetails(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`;
    try {
        const response = await axios.get(url);
        const data = response.data;
        const weatherDetails = {
            temperature: data.main.temp,
            feels_like: data.main.feels_like,
            temp_min: data.main.temp_min,
            temp_max: data.main.temp_max,
            pressure: data.main.pressure,
            humidity: data.main.humidity,
            weather: data.weather[0].description,
            wind_speed: data.wind.speed,
            wind_deg: data.wind.deg,
            visibility: data.visibility,
            sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
            sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
        };
        return weatherDetails;
    } catch (error) {
        console.error(`Error fetching weather data: ${error}`);
        return 'Unable to fetch weather data';
    }
}

export async function generateWeatherMessage(city) {
    const weatherDetails = await getWeatherDetails(city);
    if (!weatherDetails) {
        return 'Unable to fetch weather data';
    }

    return `
        The current weather in ${city} is as follows:
        - Temperature: ${weatherDetails.temperature}°C (feels like ${weatherDetails.feels_like}°C)
        - Minimum Temperature: ${weatherDetails.temp_min}°C
        - Maximum Temperature: ${weatherDetails.temp_max}°C
        - Pressure: ${weatherDetails.pressure} hPa
        - Humidity: ${weatherDetails.humidity}%
        - Weather: ${weatherDetails.weather}
        - Wind Speed: ${weatherDetails.wind_speed} m/s at ${weatherDetails.wind_deg}°
        - Visibility: ${weatherDetails.visibility} meters
        - Sunrise: ${weatherDetails.sunrise}
        - Sunset: ${weatherDetails.sunset}
    `;
}