import weatherRoute from "@src/routes/weather/weather.route.ts";
import { serve } from "@std/http/server";

serve(weatherRoute.fetch);
