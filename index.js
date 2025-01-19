import OpenAI from 'openai';
import dotenv from 'dotenv';
import readlineSync from 'readline-sync';
import axios from 'axios';

import { system_prompt, formatWeatherDetailsPrompt } from './prompt.js';
import { generateWeatherMessage, getWeatherDetails } from './weather.js';


dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const tools = {
    'getWeatherDetails': getWeatherDetails,
    'generateWeatherMessage': generateWeatherMessage,
}

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