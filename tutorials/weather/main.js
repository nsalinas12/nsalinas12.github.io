const API_KEY = "a8d296a5c03cb3bb051d49b4b23a75a6";
const BASE_URI = "http://api.weatherstack.com/current";

window.addEventListener("DOMContentLoaded", () => {
    console.log("Finished loading");

    document.getElementById("weather-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        let input = event.target[0].value;

        /*await fetchWeatherResults(input).then((response) => {
            parseData(response);
        }).catch((err) => console.error(err));
        
        */
        
        parseData(testingResponse);

    });
});

async function fetchWeatherResults(input) {
    let fetchURL = BASE_URI + "?access_key=" + API_KEY + "&query=" + input + "&units=f";
    return fetch(fetchURL).then(response => response.json());
}

function parseData(response) {
    document.getElementById("results-content").innerHTML = "";

    //1. Parse City Location
    let cityName = response.location.name;
    loadTextElement(cityName, "h2", "results-city");

    //2. Image URI
    let imageURI = response.current.weather_icons[0];
    loadImageURI(imageURI);

    //3. Parse Current Weather Description
    let description = response.current.weather_descriptions[0];
    loadTextElement(description, "i", "results-description");

    //4. Set Background Color 

    let backgroundColor = COLORS[description] !== undefined ? COLORS[description].backgroundColor : "white";
    let textColor = COLORS[description] !== undefined ? COLORS[description].textColor : "black";

    document.getElementById("results-container").style.background = backgroundColor;
    document.getElementById("results-container").style.color = textColor;

    //4. Parse Temperature Degrees
    let tempFarenheit = response.current.temperature;
    loadTextElement(tempFarenheit + "° F", "h1", "results-temperature");

    //5. Load Feels Like
    let feelsLike = response.current.feelslike;
    loadTextElement("Feels like " + feelsLike + "° F", "p", "results-description")
}

function loadTextElement(textValue, documentTag, classname="") {
    let textElement = document.createElement(documentTag);
    textElement.textContent = textValue;
    classname !== "" ? textElement.setAttribute("class", classname) : null;
    document.getElementById("results-content").appendChild(textElement);   
}

function loadImageURI(imageURI){
    let imageElement = document.createElement("img");
    imageElement.setAttribute("src", imageURI);
    imageElement.setAttribute("width", 64);
    imageElement.setAttribute("height", 64);
    document.getElementById("results-content").appendChild(imageElement);   
}

let testingResponse = {
    "request": {
        "type": "City",
        "query": "Los Angeles, United States of America",
        "language": "en",
        "unit": "f"
    },
    "location": {
        "name": "Los Angeles",
        "country": "United States of America",
        "region": "California",
        "lat": "34.052",
        "lon": "-118.243",
        "timezone_id": "America/Los_Angeles",
        "localtime": "2020-08-25 13:15",
        "localtime_epoch": 1598361300,
        "utc_offset": "-7.0"
    },
    "current": {
        "observation_time": "08:15 PM",
        "temperature": 93,
        "weather_code": 113,
        "weather_icons": [
            "https://assets.weatherstack.com/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
        ],
        "weather_descriptions": [
            "Sunny"
        ],
        "wind_speed": 0,
        "wind_degree": 248,
        "wind_dir": "WSW",
        "pressure": 1009,
        "precip": 0,
        "humidity": 40,
        "cloudcover": 0,
        "feelslike": 97,
        "uv_index": 8,
        "visibility": 10,
        "is_day": "yes"
    }
}