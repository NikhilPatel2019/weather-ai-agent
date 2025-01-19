import OpenAI from 'openai';
import dotenv from 'dotenv';
import readlineSync from 'readline-sync';
import axios from 'axios';


dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

async function getWeatherDetails(city) {
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

async function generateWeatherMessage(city) {
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

const tools = {
    'getWeatherDetails': getWeatherDetails,
    'generateWeatherMessage': generateWeatherMessage,
}

const system_prompt = `
You are an assistant with START, PLAN, ACTION, Observation and Output state.
Wait for the user prompt and first PLAN using available tools.
After Planning, take ACTION with available tools and wait for observation based on action.
Once you get the observation, Return the AI Response based on the start prompt and observation.

Strictly follow the JSON Output format as in examples.

Available Tools:
- function getWeatherDetails(city: string): string
getWeatherDetails is a function that accepts city name as string and returns the weather of that city.
- function generateWeatherMessage(city: string): string
generateWeatherMessage is a function that accepts city name as string and all the weather related details for the given city.

Example:
START
{ "type": "user", "content": "What is the sum of weather of Navsari and Banglore?" }
{ "type": "plan", "content": "I will call the generateWeatherMessage for Navsari" }
{ "type": "action", "function": "generateWeatherMessage", "input": "Navsari" }
{ "type": "observation", "observation":    "
The current weather in Navsari is as follows:
- Temperature: 28°C
- Minimum Temperature: 29°C
- Maximum Temperature: 29°C
- Pressure: 1014 hPa
- Humidity: 28%
- Weather: Clear Sky
- Wind Speed: 0.72 m/s at 303°
- Visibility: 10000 meters
- Sunrise: 1737251254
- Sunset: 1737290997
" }
{ "type": "plan", "content": "I will call the getWeatherDetails for Banglore" }
{ "type": "action", "function": "getWeatherDetails", "input": "Banglore" }
{ "type": "observation", "observation":  "
The current weather in Banglore is as follows:
- Temperature: 15°C
- Minimum Temperature: 20°C
- Maximum Temperature: 20°C
- Pressure: 1000 hPa
- Humidity: 24%
- Weather: Clear Sky
- Wind Speed: 0.72 m/s at 303°
- Visibility: 9000 meters
- Sunrise: 1737251253
- Sunset: 1737290497
"
}
{ "type": "output", "output": "The sum of weather of Navsari and Banglore is 43°C" }
`;

const formatWeatherDetailsPrompt = `You are a virtual assistant specializing in providing weather updates and personalized activity suggestions. Based on the following weather data for a specific location, organize the details into a structured summary and suggest suitable activities for the day:  

- Temperature: [Insert Temperature]°C (feels like [Insert Feels Like Temperature]°C)  
- Minimum Temperature: [Insert Min Temperature]°C  
- Maximum Temperature: [Insert Max Temperature]°C  
- Pressure: [Insert Pressure] hPa  
- Humidity: [Insert Humidity]%  
- Weather: [Insert Weather Description]  
- Wind Speed: [Insert Wind Speed] m/s at [Insert Wind Direction]°  
- Visibility: [Insert Visibility] meters  
- Sunrise: [Insert Sunrise Time]  
- Sunset: [Insert Sunset Time]  

Organize the weather information into a clear, concise format and suggest activities that align with the weather conditions. Consider the following factors when suggesting activities:  
1. The time of day (morning, afternoon, evening).  
2. Weather conditions (e.g., clear sky, rain, wind speed).  
3. Outdoor vs. indoor activities depending on comfort and safety.  
4. Specific activities relevant to the location, such as landmarks, local attractions, or seasonal events.  
5. Suggestions for relaxation, leisure, or adventure.  

The output should include:  
1. A structured weather report.  
2. A list of activities tailored to the weather conditions and location.  
3. Helpful notes, such as safety tips or items to carry (e.g., water, sunscreen).  

Example Output:  
Current Weather in Navsari:
- Temperature: 30.94°C (feels like 29.5°C)
- Minimum Temperature: 30.94°C
- Maximum Temperature: 30.94°C
- Pressure: 1013 hPa
- Humidity: 28%
- Weather: Clear sky
- Wind Speed: 2.3 m/s at 290°
- Visibility: 10 km
- Sunrise: 7:17:34 AM
- Sunset: 6:19:57 PM

Suggested Activities in Navsari:
1. Morning Walks or Jogging: 
   - With clear skies, low humidity, and mild wind, the morning is ideal for outdoor activities like walking or jogging in a park such as Jamshed Baug or along the riverfront.

2. Exploring Local Attractions:
   - Visit the Dandi Beach to enjoy a peaceful seaside experience or explore the Dandi Memorial, reflecting on history while enjoying the sunny day.

3. Shopping in Local Markets:
   - The comfortable weather is great for visiting Navsari’s local markets like the Tower Road Bazaar, where you can shop for textiles, jewelry, and local crafts.

4. Outdoor Picnic or Photography:
   - The clear sky and excellent visibility make it a perfect day for a picnic or capturing scenic views at Unai Hot Springs or the serene Gandevi Temple.

5. Evening Activities:
   - With sunset at 6:19 PM, head to Dandi Beach or Meherji Rana Library to enjoy a beautiful sunset or immerse yourself in Parsi heritage.

6. Relax with Refreshments:
   - Enjoy a refreshing drink or a meal at local cafes or rooftop restaurants to unwind in the clear, cool evening weather.

Notes:
- The temperature might feel slightly cooler than the reading due to the low humidity.
- Ensure you carry sunglasses, sunscreen, and a water bottle to stay hydrated and protected from the sun.

Make the response natural, engaging, and helpful.`




const messages = [ { role: "system", content: system_prompt} ]
while(true){
    const query = readlineSync.question('>> ');
    const userMessage = { type: "user", user: query }
    messages.push({ role: "user", content: JSON.stringify(userMessage) });

    while(true){
        const chat = await client.chat.completions
                        .create({
                            model: 'gpt-4o',
                            messages,
                            response_format: { type: 'json_object' }
                        })
        const result = chat.choices[0].message.content;
        messages.push({ role: 'assistant', content: result });

        // console.log("\n------------------------------");
        // console.log(result);
        // console.log("------------------------------\n");

        const call = JSON.parse(result);

        if(call.type === 'output'){
            console.log(`🤖: ${call.output}`);
            break;
        }
        else if(call.type === 'action'){
            const fn = tools[call.function];
            const observation = await fn(call.input);
            const obs = { type: "observation", observation }
            messages.push(
                { role: "developer", content: JSON.stringify(obs) }, 
                { role: "user", content: formatWeatherDetailsPrompt });
        }
    }
        
}