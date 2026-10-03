// --- 1. Helper Functions ---
function getWeatherDescription(code) {
  if (code === 0) return "Clear sky";
  if (code >= 1 && code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Unknown";
}

function toFahrenheit(celsius) {
  return ((celsius * 9) / 5 + 32).toFixed(1);
}

// Format temperature according to active unit
function formatTemp(celsius, unit) {
  return unit === "C" ? celsius.toFixed(1) : toFahrenheit(celsius);
}

// --- 2. State & DOM Elements ---
let currentUnit = "C"; // Default unit is Celsius
let lastWeatherData = null; // Caches the latest fetched data

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const statusMsg = document.getElementById("statusMsg");

const unitToggleBtn = document.getElementById("unitToggleBtn");
const currentWeatherCard = document.getElementById("currentWeatherCard");
const cityNameEl = document.getElementById("cityName");
const currentConditionBadgeEl = document.getElementById("currentConditionBadge");
const currentConditionEl = document.getElementById("currentCondition");
const currentTempEl = document.getElementById("currentTemp");
const currentTempUnitEl = document.getElementById("currentTempUnit");
const currentWindEl = document.getElementById("currentWind");

const forecastBody = document.getElementById("forecastBody");
const maxTempHeader = document.getElementById("maxTempHeader");
const minTempHeader = document.getElementById("minTempHeader");

// --- 3. Render Weather View ---
function renderWeatherView() {
  if (!lastWeatherData) return;

  const { cityDisplay, current, daily } = lastWeatherData;
  const conditionDesc = getWeatherDescription(current.weathercode);

  // Update Current Weather Card
  cityNameEl.textContent = cityDisplay;
  currentConditionBadgeEl.textContent = conditionDesc;
  currentConditionEl.textContent = conditionDesc;
  currentTempEl.textContent = formatTemp(current.temperature, currentUnit);
  currentTempUnitEl.textContent = `°${currentUnit}`;
  currentWindEl.textContent = current.windspeed;

  currentWeatherCard.style.display = "block";

  // Update Forecast Table Headers
  maxTempHeader.textContent = `MAX °${currentUnit}`;
  minTempHeader.textContent = `MIN °${currentUnit}`;

  // Populate Table
  forecastBody.innerHTML = "";
  const totalDays = daily.time.length;

  for (let i = 0; i < totalDays; i++) {
    const date = daily.time[i];
    const code = daily.weathercode[i];
    const maxTemp = formatTemp(daily.temperature_2m_max[i], currentUnit);
    const minTemp = formatTemp(daily.temperature_2m_min[i], currentUnit);
    const precip = daily.precipitation_sum[i];

    const row = document.createElement("tr");
    if (precip > 0) {
      row.classList.add("rainy");
    }

    row.innerHTML = `
      <td>${date}</td>
      <td>${getWeatherDescription(code)}</td>
      <td>${maxTemp}</td>
      <td>${minTemp}</td>
      <td>${precip}</td>
    `;
    forecastBody.appendChild(row);
  }
}

// --- 4. Main Search Handler ---
async function handleSearch() {
  const city = cityInput.value.trim();

  if (!city) {
    statusMsg.textContent = "Please enter a city name.";
    return;
  }

  statusMsg.textContent = "Loading...";
  currentWeatherCard.style.display = "none";
  forecastBody.innerHTML = "";

  try {
    // Geocoding API
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geocodingUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      statusMsg.textContent = `City "${city}" not found. Please try again.`;
      return;
    }

    const { name, latitude, longitude, country } = geoData.results[0];
    console.log(`Resolved: ${name} (${country}) -> Lat: ${latitude}, Lon: ${longitude}`);

    // Weather Forecast API
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const weatherResponse = await fetch(forecastUrl);
    const weatherData = await weatherResponse.json();

    statusMsg.textContent = "";

    // Cache the data for unit switching
    lastWeatherData = {
      cityDisplay: `${name}, ${country || ""}`,
      current: weatherData.current_weather,
      daily: weatherData.daily
    };

    renderWeatherView();

  } catch (error) {
    console.error("Error fetching weather data:", error);
    statusMsg.textContent = "Something went wrong fetching the weather data. Please try again later.";
  }
}

// --- 5. Toggle Unit Handler ---
unitToggleBtn.addEventListener("click", () => {
  if (currentUnit === "C") {
    currentUnit = "F";
    unitToggleBtn.textContent = "Switch to °C";
  } else {
    currentUnit = "C";
    unitToggleBtn.textContent = "Switch to °F";
  }

  // Re-render UI with converted temperatures if data is already loaded
  if (lastWeatherData) {
    renderWeatherView();
  }
});

// --- 6. Event Listeners ---
searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
});