import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  lat: number;
  lon: number;
  days?: number; // Optional: number of days to forecast (1-5)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon, days } = await req.json() as WeatherRequest;

    // Validate latitude
    if (typeof lat !== 'number' || isNaN(lat)) {
      return new Response(
        JSON.stringify({ error: 'Latitude must be a valid number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lat < -90 || lat > 90) {
      return new Response(
        JSON.stringify({ error: 'Invalid latitude. Must be between -90 and 90' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate longitude
    if (typeof lon !== 'number' || isNaN(lon)) {
      return new Response(
        JSON.stringify({ error: 'Longitude must be a valid number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lon < -180 || lon > 180) {
      return new Response(
        JSON.stringify({ error: 'Invalid longitude. Must be between -180 and 180' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate days parameter (optional, but if provided must be valid)
    if (days !== undefined) {
      if (typeof days !== 'number' || isNaN(days)) {
        return new Response(
          JSON.stringify({ error: 'Days must be a valid number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (days < 1 || days > 14) {
        return new Response(
          JSON.stringify({ error: 'Invalid days parameter. Must be between 1 and 14' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Fetching weather for coordinates: lat=${lat}, lon=${lon}, days=${days || 'default'}`);

    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    // If multi-day forecast requested, use forecast API
    if (days && days > 1) {
      const maxDays = Math.min(days, 5); // OpenWeatherMap free tier supports 5 days
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      const response = await fetch(forecastUrl);

      if (!response.ok) {
        console.error('OpenWeatherMap Forecast API error:', response.status);
        throw new Error(`Weather Forecast API request failed: ${response.status}`);
      }

      const forecastData = await response.json();
      console.log('Forecast data received for', forecastData.list.length, 'time periods');

      // Group forecasts by day (OpenWeatherMap returns 3-hour intervals)
      const dailyForecasts: any[] = [];
      const processedDates = new Set<string>();

      for (const item of forecastData.list) {
        const date = item.dt_txt.split(' ')[0]; // Extract YYYY-MM-DD
        
        if (!processedDates.has(date) && dailyForecasts.length < maxDays) {
          processedDates.add(date);
          
          // Find midday forecast (12:00) for most accurate daily temp
          const middayForecast = forecastData.list.find((f: any) => 
            f.dt_txt.startsWith(date) && f.dt_txt.includes('12:00:00')
          ) || item;

          dailyForecasts.push({
            date: date,
            temperature: Math.round(middayForecast.main.temp),
            condition: middayForecast.weather[0].main,
            description: middayForecast.weather[0].description,
            icon: middayForecast.weather[0].icon,
          });
        }
      }

      const result = {
        city: forecastData.city.name,
        forecasts: dailyForecasts,
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single day current weather (backward compatible)
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const response = await fetch(weatherUrl);

    if (!response.ok) {
      console.error('OpenWeatherMap API error:', response.status);
      throw new Error(`Weather API request failed: ${response.status}`);
    }

    const weatherData = await response.json();
    console.log('Weather data received:', weatherData);

    // Extract relevant information
    const result = {
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].main,
      description: weatherData.weather[0].description,
      city: weatherData.name,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
