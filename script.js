// Get references to HTML elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const loadingSection = document.querySelector('.loading');
const backBtn = document.getElementById('back-btn');

const locationElement = document.getElementById('location');
const dateTimeElement = document.getElementById('date-time');
const weatherIconElement = document.getElementById('weather-icon');
const temperatureElement = document.getElementById('temperature');
const feelsLikeElement = document.getElementById('feels-like');
const weatherDescriptionElement = document.getElementById('weather-description');

const humidityValueElement = document.getElementById('humidity-value');
const windValueElement = document.getElementById('wind-value');
const cloudinessValueElement = document.getElementById('cloudiness-value');
const pressureValueElement = document.getElementById('pressure-value');

const forecastContainer = document.getElementById('forecast-container');

const graphTabs = document.querySelectorAll('.tab-btn');
const weatherChartCanvas = document.getElementById('weather-chart');

// OpenWeatherMap API Key (Replace with your actual key)
const API_KEY = '3a5a4b320876ff7ef918e2988c4080e8'; // <<<--- REPLACE WITH YOUR API KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

// Variable to store the current weather data and forecast data
let currentWeatherData = null;
let forecastData = null;
// Variable to store the current unit ('metric' for Celsius, 'imperial' for Fahrenheit)
let currentUnit = 'metric';
// Variable to store the current chart instance
let weatherChart = null;
// Variable to store the currently active graph tab ('temperature', 'humidity', 'wind')
let activeGraphTab = 'temperature';

// Mapping of OpenWeatherMap icon codes to local image paths
// You might need to add more mappings based on the OpenWeatherMap API response
const weatherIconMap = {
    '01d': 'images/clear-sky.png', // clear sky (day)
    '01n': 'images/clear-sky.png', // clear sky (night) - using same icon for simplicity
    '02d': 'images/clouds-and-sun.png', // few clouds (day)
    '02n': 'images/clouds-and-sun.png', // few clouds (night) - using same icon
    '03d': 'images/scattered-clouds.png', // scattered clouds
    '03n': 'images/scattered-clouds.png', // scattered clouds
    '04d': 'images/broken-clous.png', // broken clouds
    '04n': 'images/broken-clous.png', // broken clouds
    '09d': 'images/shower-rain.png', // shower rain
    '09n': 'images/shower-rain.png', // shower rain
    '10d': 'images/rain.png', // rain (day)
    '10n': 'images/rain.png', // rain (night)
    '11d': 'images/thunderstorm.png', // thunderstorm
    '11n': 'images/thunderstorm.png', // thunderstorm
    '13d': 'images/snow.png', // snow
    '13n': 'images/snow.png', // snow
    '50d': 'images/mist.png', // mist
    '50n': 'images/mist.png', // mist
    // Default icon if code is not found
    'default': 'images/clouds-and-sun.png'
};

// Function to get the correct image path based on OpenWeatherMap icon code
function getWeatherIconPath(iconCode) {
    return weatherIconMap[iconCode] || weatherIconMap['default'];
}

// Function to format date and time
function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000); // Timestamp is in seconds
    const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
    return date.toLocaleDateString('en-US', options);
}

// Function to format forecast date
function formatForecastDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
}

// Function to fetch weather data from OpenWeatherMap API
async function getWeatherData(location, units) {
    showLoading(); // Show loading indicator

    const currentWeatherUrl = `${BASE_URL}weather?q=${location}&appid=${API_KEY}&units=${units}`;
    const forecastUrl = `${BASE_URL}forecast?q=${location}&appid=${API_KEY}&units=${units}`;

    try {
        // Fetch current weather data
        const currentWeatherResponse = await fetch(currentWeatherUrl);
        if (!currentWeatherResponse.ok) {
            if (currentWeatherResponse.status === 404) {
                throw new Error('Location not found');
            }
            throw new Error(`HTTP error! status: ${currentWeatherResponse.status}`);
        }
        currentWeatherData = await currentWeatherResponse.json();

        // Fetch 5-day forecast data
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) {
             if (forecastResponse.status === 404) {
                throw new Error('Location not found');
            }
            throw new Error(`HTTP error! status: ${forecastResponse.status}`);
        }
        forecastData = await forecastResponse.json();

        // If both fetches are successful, display the weather info
        displayWeatherInfo(); // Call the new function here

    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(); // Show error message
    }
}

// Function to display all weather information after data is fetched
function displayWeatherInfo() {
    if (!currentWeatherData || !forecastData) {
        console.error("Weather data or forecast data is missing.");
        showError(); // Show error if data is incomplete
        return;
    }

    displayCurrentWeather();
    displayForecast();
    updateWeatherChart();
    showWeatherInfo(); // Show the weather info section
}


// Function to display current weather information
function displayCurrentWeather() {
    if (!currentWeatherData) return;

    locationElement.textContent = `${currentWeatherData.name}, ${currentWeatherData.sys.country}`;
    dateTimeElement.textContent = formatDateTime(currentWeatherData.dt);
    weatherIconElement.src = getWeatherIconPath(currentWeatherData.weather[0].icon);
    weatherIconElement.alt = currentWeatherData.weather[0].description;

    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    temperatureElement.innerHTML = `${Math.round(currentWeatherData.main.temp)} <span>${tempUnit}</span>`;
    feelsLikeElement.textContent = `Feels like: ${Math.round(currentWeatherData.main.feels_like)} ${tempUnit}`;
    weatherDescriptionElement.textContent = currentWeatherData.weather[0].description;

    humidityValueElement.textContent = `${currentWeatherData.main.humidity}%`;
    // Wind speed unit depends on the 'units' parameter in the API call
    const windUnit = currentUnit === 'metric' ? 'km/h' : 'mph';
    windValueElement.textContent = `${(currentWeatherData.wind.speed * (currentUnit === 'metric' ? 3.6 : 1)).toFixed(1)} ${windUnit}`; // Convert m/s to km/h if metric
    cloudinessValueElement.textContent = `${currentWeatherData.clouds.all}%`;
    pressureValueElement.textContent = `${currentWeatherData.main.pressure} hPa`;
}

// Function to display 5-day forecast
function displayForecast() {
    if (!forecastData) return;

    forecastContainer.innerHTML = ''; // Clear previous forecast cards

    // OpenWeatherMap forecast provides data every 3 hours.
    // We need to filter for one entry per day, ideally around noon.
    const dailyForecasts = forecastData.list.filter((item, index, arr) => {
        const date = new Date(item.dt * 1000);
        // Find the first entry for each day (after the current day)
        if (index === 0) return false; // Skip the first entry as it might be today
        const nextItem = arr[index + 1];
        if (!nextItem) return true; // Keep the last item if it's the only one left for the day
        const nextDate = new Date(nextItem.dt * 1000);
        return date.getDate() !== nextDate.getDate();
    });

    dailyForecasts.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = formatForecastDate(date); // e.g., "Mon, 15 May"
        const icon = getWeatherIconPath(item.weather[0].icon);
        const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
        const temp = Math.round(item.main.temp);
        // OpenWeatherMap forecast doesn't provide min/max temp for the *day*,
        // only for the 3-hour period. Using temp for simplicity.
        const tempRange = `${Math.round(item.main.temp_min)} - ${Math.round(item.main.temp_max)} ${tempUnit}`;


        const forecastCardHTML = `
            <div class="forecast-card">
                <div class="day">${day}</div>
                <img src="${icon}" alt="${item.weather[0].description}">
                <div class="temp">${temp} ${tempUnit}</div>
                <div class="temp-range">${tempRange}</div>
            </div>
        `;
        forecastContainer.innerHTML += forecastCardHTML;
    });
}

// Function to initialize or update the weather chart
function updateWeatherChart() {
    if (!forecastData) return;

    // Destroy previous chart instance if it exists
    if (weatherChart) {
        weatherChart.destroy();
    }

    const labels = forecastData.list.map(item => {
        const date = new Date(item.dt * 1000);
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleTimeString('en-US', options);
    });

    let data = [];
    let yAxisLabel = '';
    let borderColor = '';
    let bgColor = '';
    let unit = '';

    if (activeGraphTab === 'temperature') {
        data = forecastData.list.map(item => item.main.temp);
        yAxisLabel = `Temperature (${currentUnit === 'metric' ? '°C' : '°F'})`;
        borderColor = '#5c9ce5';
        bgColor = 'rgba(92, 156, 229, 0.2)';
        unit = currentUnit === 'metric' ? '°C' : '°F';
    } else if (activeGraphTab === 'humidity') {
        data = forecastData.list.map(item => item.main.humidity);
        yAxisLabel = 'Humidity (%)';
        borderColor = '#2ecc71';
        bgColor = 'rgba(46, 204, 113, 0.2)';
        unit = '%';
    } else if (activeGraphTab === 'wind') {
        // Convert wind speed if needed (API returns m/s for metric, mph for imperial)
        data = forecastData.list.map(item => (item.wind.speed * (currentUnit === 'metric' ? 3.6 : 1)).toFixed(1));
        yAxisLabel = `Wind Speed (${currentUnit === 'metric' ? 'km/h' : 'mph'})`;
        borderColor = '#e74c3c';
        bgColor = 'rgba(231, 76, 60, 0.2)';
        unit = currentUnit === 'metric' ? 'km/h' : 'mph';
    }

    const ctx = weatherChartCanvas.getContext('2d');

    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: yAxisLabel,
                data: data,
                borderColor: borderColor,
                backgroundColor: bgColor,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow container to control size
            plugins: {
                legend: {
                    display: false // Hide legend
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += `${context.parsed.y}${unit}`;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                }
            }
        }
    });
}

// Function to handle unit toggle (Celsius/Fahrenheit)
function handleUnitToggle(unit) {
    if (currentUnit === unit) return; // Do nothing if already in this unit

    currentUnit = unit;

    // Update active class on buttons
    if (unit === 'metric') {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        celsiusBtn.classList.remove('active');
        fahrenheitBtn.classList.add('active');
    }

    // Re-fetch data with the new unit and update display
    if (currentWeatherData && currentWeatherData.name) {
         getWeatherData(currentWeatherData.name, currentUnit);
    } else {
        // If no location is loaded, perhaps show a default message or state
        console.log("No location loaded to switch units for.");
    }
}

// Function to handle graph tab switching
function handleGraphTabClick(tab) {
    // Remove active class from all tabs
    graphTabs.forEach(btn => btn.classList.remove('active'));

    // Add active class to the clicked tab
    const clickedTab = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
        activeGraphTab = tab; // Update active tab state
        updateWeatherChart(); // Update the chart with the new data
    }
}


// Function to handle search
function handleSearch() {
    const location = locationInput.value.trim();
    if (location) {
        getWeatherData(location, currentUnit);
    } else {
        // Optionally show a message or error if input is empty
        console.log("Please enter a location.");
    }
}

// Function to show loading indicator
function showLoading() {
    weatherInfoSection.style.display = 'none';
    notFoundSection.style.display = 'none';
    loadingSection.style.display = 'flex'; // Use flex as per CSS
}

// Function to show weather info section
function showWeatherInfo() {
    loadingSection.style.display = 'none';
    notFoundSection.style.display = 'none';
    weatherInfoSection.style.display = 'block'; // Use block as per CSS
}

// Function to show error section
function showError() {
    loadingSection.style.display = 'none';
    weatherInfoSection.style.display = 'none';
    notFoundSection.style.display = 'block'; // Use block as per CSS
}

// Event Listeners

// Search button click
searchBtn.addEventListener('click', handleSearch);

// Enter key in location input
locationInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

// Unit toggle buttons click
celsiusBtn.addEventListener('click', () => handleUnitToggle('metric'));
fahrenheitBtn.addEventListener('click', () => handleUnitToggle('imperial'));

// Graph tab buttons click
graphTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        handleGraphTabClick(tab);
    });
});

// Back button click in error state
backBtn.addEventListener('click', () => {
    // You could clear the input or just hide the error and show the initial state
    notFoundSection.style.display = 'none';
    // Optionally show a default message or the input field area again
    // For simplicity, we'll just hide the error.
});


// Initial load: Optionally load weather for a default city
// window.onload = () => {
//     getWeatherData('New York', currentUnit); // Load New York weather on page load
// };

// Initially hide weather info and error sections
weatherInfoSection.style.display = 'none';
notFoundSection.style.display = 'none';
loadingSection.style.display = 'none'; // Hide loading initially

// Note: The initial state visible is just the header and search box.
// The weather-info, not-found, and loading sections are hidden by default via CSS and JS.
