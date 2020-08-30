const API_KEY = "a8d296a5c03cb3bb051d49b4b23a75a6";
const BASE_URI = "https://api.weatherstack.com/current";

let hasResults = false;

window.addEventListener("DOMContentLoaded", () => {
    console.log("Finished loading");

    document.getElementById("weather-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        let input = event.target[0].value;

        await fetchWeatherResults(input).then((response) => {
            if( response.error === undefined ){
                parseData(response);
            } else {
                console.log("Error message:\t", response);
                parseError(response)
            }
        }).catch((err) => alert(err.message));
    });
});

async function fetchWeatherResults(input) {
    let fetchURL = BASE_URI + "?access_key=" + API_KEY + "&query=" + input + "&units=f";
    return fetch(fetchURL).then(response => response.json());
}

function parseData(response) {
    document.getElementById("results-content").innerHTML = "";

    if (document.getElementById("results-container").classList.contains("isHidden")) {
        document.getElementById("results-container").classList.remove("isHidden");
    }
    

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

    console.log(COLORS, description, textColor);

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

function parseError(errorResponse) {
    alert(errorResponse.error.info);
}

let sunnyResponse = {
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

let smokeResponse = {
    "request": {
        "type": "City",
        "query": "Saladas, Argentina",
        "language": "en",
        "unit": "f"
    },
    "location": {
        "name": "Saladas",
        "country": "Argentina",
        "region": "Corrientes",
        "lat": "-28.250",
        "lon": "-58.633",
        "timezone_id": "America/Argentina/Cordoba",
        "localtime": "2020-08-25 19:29",
        "localtime_epoch": 1598383740,
        "utc_offset": "-3.0"
    },
    "current": {
        "observation_time": "10:29 PM",
        "temperature": 90,
        "weather_code": 122,
        "weather_icons": [
            "https://assets.weatherstack.com/images/wsymbols01_png_64/wsymbol_0004_black_low_cloud.png"
        ],
        "weather_descriptions": [
            "Smoke"
        ],
        "wind_speed": 15,
        "wind_degree": 70,
        "wind_dir": "ENE",
        "pressure": 1004,
        "precip": 0,
        "humidity": 32,
        "cloudcover": 0,
        "feelslike": 93,
        "uv_index": 1,
        "visibility": 1,
        "is_day": "no"
    }
};

let partlyCloudyResponse = {
    "request": {
        "type": "City",
        "query": "New Orleans, United States of America",
        "language": "en",
        "unit": "f"
    },
    "location": {
        "name": "New Orleans",
        "country": "United States of America",
        "region": "Louisiana",
        "lat": "29.954",
        "lon": "-90.075",
        "timezone_id": "America/Chicago",
        "localtime": "2020-08-25 17:34",
        "localtime_epoch": 1598376840,
        "utc_offset": "-5.0"
    },
    "current": {
        "observation_time": "10:34 PM",
        "temperature": 90,
        "weather_code": 116,
        "weather_icons": [
            "https://assets.weatherstack.com/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png"
        ],
        "weather_descriptions": [
            "Partly cloudy"
        ],
        "wind_speed": 17,
        "wind_degree": 100,
        "wind_dir": "E",
        "pressure": 1012,
        "precip": 0.1,
        "humidity": 75,
        "cloudcover": 75,
        "feelslike": 106,
        "uv_index": 7,
        "visibility": 10,
        "is_day": "yes"
    }
};

let invalidResponse = {
    "success": false,
    "error": {
        "code": 615,
        "type": "request_failed",
        "info": "Your API request failed. Please try again or contact support."
    }
}