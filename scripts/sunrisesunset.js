Date.prototype.getDayOfTheYear = function() {
	var onejan = new Date(this.getFullYear(),0,1);
	return Math.ceil((this - onejan) / 86400000);
}

Date.prototype.getMinuteOfTheDay = function() {
	return this.getHours() * 60 + this.getMinutes()
}

// -- *D ---
//
// These trigonometry functions use degrees instead of radians.
//
function sinD(n)  { return Math.sin (n * 0.0174532925199433); }
function cosD(n)  { return Math.cos (n * 0.0174532925199433); }
function tanD(n)  { return Math.tan (n * 0.0174532925199433); }
function asinD(n) { return Math.asin(n) * 57.2957795130823;   }
function acosD(n) { return Math.acos(n) * 57.2957795130823;   }
function atanD(n) { return Math.atan(n) * 57.2957795130823;   }


function Int(n) { return n < 0 ? Math.ceil(n) : Math.floor(n); }
function Sign(n) { if (n < 0) return -1; if (n > 0) return 1; return 0; }


// -- isNull --
//
// Determines whether an object is null.
//
function isNull(anObject)
{
  return typeof anObject == "object" && !anObject;
}


// --- CalculateSunriseOrSunset ---
//
// Calculates the time of sunrise or sunset at a given location on a given day.
//
// Parameters
//    latitude - latitude in degrees of location
//   longitude - longitude in degrees of location
//        date - Date object - day to calculate
//     sunrise - Boolean - whether to calculate sunrise (true) or sunset (false)
//    twilight - Boolean - whether to calculate twilight (true) or sunrise/sunset (false)
//
// Returns
//   floating-point hour of sun event in UTC
//     (e.g., 5.15 => 0509Z), or null if the event doesn't occur on the given day
//
function CalculateSunriseOrSunset(geo, date, sunrise, twilight)
{
  // Source:
  //   Almanac for Computers, 1990
  //   published by Nautical Almanac Office
  //   United States Naval Observatory
  //   Washington, DC 20392

  day   = date.getDate();
  month = date.getMonth() + 1;
  year  = date.getFullYear();

  var zenith;

  if (twilight)
  {
      zenith = 99;
  }
  else
      zenith = 90.8333333333;


  // Calculate the day of the year.

  N1 = Math.floor(275.0 * month / 9.0);
  N2 = Math.floor((month + 9.0) / 12.0);
  N3 = 1.0 + Math.floor((year - 4.0 * Math.floor(year / 4.0) + 2.0) / 3.0);
  N = N1 - (N2 * N3) + day - 30.0;


  // Convert the longitude to hour value and calculate an approximate time.

  lngHour = geo.long / 15.0;

  if (sunrise)
      t = N + ((6.0 - lngHour) / 24.0);
  else
      t = N + ((18.0 - lngHour) / 24.0)


  // Calculate the sun's mean anomaly.

  M = (0.9856 * t) - 3.289;


  // Calculate the sun's true longitude.

  L = M + (1.916 * sinD(M)) + (0.020 * sinD(2 * M)) + 282.634;

  while (L >= 360) L -= 360.0;
  while (L <  0)   L += 360.0;


  // Caculate the sun's right ascension.

  RA = atanD(0.91764 * tanD(L));

  while (RA >= 360) RA -= 360.0;
  while (RA <  0)   RA += 360.0;


  // Right ascension value needs to be in the same quadrant as L.

  Lquadrant = Math.floor(L / 90.0) * 90.0;
  RAquadrant = Math.floor(RA / 90.0) * 90.0;
  RA = RA + (Lquadrant - RAquadrant);


  // Right ascension value needs to be converted into hours.

  RA /= 15.0;


  // Calculate the sun's declination.

  sinDec = 0.39782 * sinD(L);
  cosDec = cosD(asinD(sinDec));


  // Calculate the sun's local hour angle.

  cosH = (cosD(zenith) - (sinDec * sinD(geo.lat))) / (cosDec * cosD(geo.lat));

  if (sunrise)
  {
      if (cosH > 1) return null;
  }
  else
  {
      if (cosH < -1) return null;
  }


  // Finish calculating H and convert into hours.

  if (sunrise)
      H = 360.0 - acosD(cosH);
  else
      H = acosD(cosH);

  H /= 15.0


  // Calculate local mean time of rising.

  T = H + RA - (0.06571 * t) - 6.622;


  // Adjust back to UTC.

  UT = T - lngHour;

  // remove me
  UT += Math.ceil(geo.long / 15);

  while (UT >= 24) UT -= 24.0;
  while (UT <  0)  UT += 24.0;

  return UT;
}


function timeToAngle(time){
  var r = ((time / 24) * twoPi);
  return r;

}

var currentDate;
var geo; // = { 'lat' : 59.17, 'long': 18.3 };
var sun; 

var width = 400,
    height = 400,
    twoPi = Math.PI * 2;

var arc = d3.svg.arc()
    .startAngle(0)
    .innerRadius(124)
    .outerRadius(148);

var svg = d3.select(".display").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var graph = svg.append("g")
    .attr("class", "display");

function renderGraph(){

  graph.append("path")
      .attr("d", arc.endAngle(twoPi))
      .attr("class", "background")

  var startAngle = Math.PI+timeToAngle(CalculateSunriseOrSunset(geo, currentDate, true, false));
  var endAngle = Math.PI+timeToAngle(CalculateSunriseOrSunset(geo, currentDate, false, false));

  sun = graph.append("path")
      .attr("class", "foreground")
      .attr("d", arc.startAngle(startAngle))
      .attr("d", arc.endAngle(endAngle));

}
      
function animater(){
  var startAngle = Math.PI+timeToAngle(CalculateSunriseOrSunset(geo, new Date('2012-06-20'), true, false));
  var endAngle = Math.PI+timeToAngle(CalculateSunriseOrSunset(geo, new Date('2012-06-20'), false, false));

  sun.transition()
    .attr("d", arc.startAngle(startAngle))
    .attr("d", arc.endAngle(endAngle));

}

$(document).ready(function(){
  geo = com.unitedCoders.geo.ll[0];
  $("h2").text(geo.city);

  if (window.location.hash){
    currentDate = new Date(window.location.hash);    
  }
  else{
    currentDate = new Date();    
  }

  $(".date").text(currentDate.getFullYear() + '-' + (currentDate.getMonth() < 10 ? '0' : '')+ (currentDate.getMonth() + 1) + '-' + (currentDate.getDate() < 10 ? '0' : '') +  currentDate.getDate()  );

  renderGraph();

});