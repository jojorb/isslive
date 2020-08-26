/* ! ISS on Map with Leaflet Js
 *
 * Libs:
 *			https://github.com/perliedman/leaflet-realtime
 *			https://github.com/joergdietrich/Leaflet.Terminator
 *			https://github.com/shashwatak/satellite-js
 *			https://github.com/henrythasler/Leaflet.Geodesic
 * Help:
 *			http://www.celestrak.com/NORAD/elements/master.asp
 *			http://www.satflare.com/track.asp#TOP
 *			http://spaceflight.nasa.gov/realdata/sightings/SSapplications/Post/JavaSSOP/orbit/ISS/SVPOST.html
 */

var ISS_API_URL = "https://api.wheretheiss.at/v1/satellites/25544";
// var issStatus = JSON.parse(body);
// var issGj = geojson.parse([issStatus], {Point: ['latitude', 'longitude']});

/*!
 * Map setup
 */

var cartodbl = L.tileLayer(
	'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
		attribution: '<a href="https://github.com/RobyRemzy/isslive">View the sources on GitHub</a> | &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
		minZoom: 0,
		maxZoom: 18,
		label: 'light'
	}
);

var map = new L.Map('map', {
	attributionControl: true,
	worldCopyJump: true,
	zoomControl: false
});

map.setView(new L.LatLng(0, -80), 2);
map.addLayer(cartodbl);


/*!
 * render the daylight layer
 */

var t = L.terminator({
	color: '#0CBFD7',
	opacity: 0.8,
	fillColor: '#111634',
	fillOpacity: 0.8,
	resolution: 2
});

t.addTo(map);
setInterval(function () {
	updateTerminator(t);
}, 500);

function updateTerminator(t) {
	var t2 = L.terminator();
	t.setLatLngs(t2.getLatLngs());
	t.redraw();
}

/*!
 * Assets
 */

var issIcon = L.icon({
	iconUrl: './iss.png',
	iconRetinaUrl: './iss.png',
	iconSize: [97, 55],
	iconAnchor: [48.5, 55],
	popupAnchor: [-5, -45]
});

var sunIcon = L.icon({
	iconUrl: './sun.png',
	iconRetinaUrl: './sun.png',
	iconSize: [90, 90],
	iconAnchor: [45, 90],
	popupAnchor: [0, -90]
});

trail = {
	type: 'Feature',
	properties: {
		id: 4,
		geodesic: true,
		geodesic_wrap: true
	},
	geometry: {
		type: 'LineString',
		coordinates: []
	}
};

isspoi = {
	type: 'Feature',
	properties: {
		id: 177
	},
	geometry: {
		type: 'Point',
		coordinates: []
	}
};

suntrack = {
	type: 'Feature',
	properties: {
		id: 1
	},
	geometry: {
		type: 'Point',
		coordinates: []
	}
};

orbitpast = {
	type: 'Feature',
	properties: {
		id: 66432,
		geodesic: true,
		geodesic_steps: 70,
		geodesic_wrap: true
	},
	geometry: {
		type: 'LineString',
		coordinates: []
	}
};

orbitfutur = {
	type: 'Feature',
	properties: {
		id: 5,
		geodesic: true,
		geodesic_steps: 70,
		geodesic_wrap: true
	},
	geometry: {
		type: 'LineString',
		coordinates: []
	}
};

var issGeodesic = L.geodesic([], {
	weight: 3,
	opacity: 0.5,
	color: 'red',
	steps: 50
}).addTo(map);

/*!
 * Drop the ISS Marker ans start to draw the tail
 * JSON API: http://wheretheiss.at/w/developer
 * GEOJSON API: https://github.com/jseppi/issgeojson
 */

var issLayer = L.realtime(function (success, error) {
	L.Realtime.reqwest({
			url: ISS_API_URL,
			crossOrigin: true,
			type: 'json'
		})
		.then(function (resp) {
			console.log('issTracking', resp);
			var lat_iss = resp.latitude;
			var lng_iss = resp.longitude;
			var isspoint = isspoi.geometry.coordinates;
			isspoint.push(lng_iss, lat_iss);
			isspoint.splice(0, Math.max(0, isspoint.length - 2));
			success({
				type: 'FeatureCollection',
				features: [isspoi]
			});
		})
		.catch(error);
}, {
	interval: 10 * 3000, // querry every 30sec

	pointToLayer: function (feature, lat_isslng_iss) {
		console.log("CHECK THIS:", lat_isslng_iss);
		return L.marker(lat_isslng_iss, {
			icon: issIcon
		});
	},

	style: function (feature) {

		return {
			color: '#FFFFFF',
			opacity: 0.23,
			weight: 7
		};
	},

	updateFeature: function (feature, oldLayer, newLayer) {
		// console.log('test: ', feature);

		// issGeodesic.createCircle(feature.geometry.coordinates, 4400);

		var dshb =
			'<center><b>' +
			feature.properties.name + ' - id: [' + feature.properties.id + ']</b>' +
			'<br> speed: ' + (feature.properties.velocity / 3.6).toFixed(0) + ' m/s' +
			' | alti: ' + (feature.properties.altitude * 1).toFixed(0) + ' Km' +
			'<br> coords: [' + (feature.geometry.coordinates[1] * 1).toFixed(4) + ', ' +
			(feature.geometry.coordinates[0] * 1).toFixed(4) + ']' +
			'</center>';
		oldLayer.bindPopup(dshb);
		// oldLayer.create(dshb)
		// $('#dashbord').innerHTML(dshb);

		return L.Realtime.prototype.options.updateFeature(feature, oldLayer, newLayer);
	}
});
issLayer.addTo(map);



/*!
 * Drop the Sun Marker on Map
 * JSON API: http://wheretheiss.at/w/developer
 */

function wrapAroundAmericas(latlng) {
	var lng = latlng.lng;

	return L.latLng(
		latlng.lat,
		lng > 0 ? lng - 360 : lng
	);
}

var sunTracking = L.realtime(function (success, error) {
	L.Realtime.reqwest({
			url: 'https://api.wheretheiss.at/v1/satellites/25544',
			crossOrigin: true,
			type: 'json'
		})
		.then(function (data) {
			console.log('sunTracking', data);
			var lat = data.solar_lat;
			var lng = data.solar_lon;
			var sunpoint = suntrack.geometry.coordinates;
			sunpoint.push(lng, lat);
			sunpoint.splice(0, Math.max(0, sunpoint.length - 2));
			success({
				type: 'FeatureCollection',
				features: [suntrack]
			});
		})
		.catch(error);
}, {
	interval: 1 * 60000, // every 30 minutes

	pointToLayer: function (feature, latlng) {

		return L.marker(wrapAroundAmericas(latlng), {
			icon: sunIcon
		});
	}
});
sunTracking.addTo(map);



/*!
 * Get all the people in space right now
 * JSON API: http://open-notify.org/Open-Notify-API/
 * (need https API)
 */

$.getJSON('https://u4h2tjydjl.execute-api.us-west-2.amazonaws.com/remotepixel/https?url=http://api.open-notify.org/astros.json', function (data) {

	data.people.forEach(function (d) {
		$('#astronames').append('<li> [' + d.craft + '] ' + d.name + '</li>');
	});
});



/*!
 * Draw the futur orbit of the ISS
 * NEED the Space craft TLE to use with satellite-js
 * JSON API: https://api.wheretheiss.at/v1/satellites/25544/tles
 * revolution in 92.69min -> 5561400 millisecondes
 */

function orbitPred(orbit, satrec) {
	var positionAndVelocity = satellite.propagate(satrec, orbit);

	var positionEci = positionAndVelocity.position,
		velocityEci = positionAndVelocity.velocity;

	var gmst = satellite.gstimeFromDate(orbit);

	var position_gd = satellite.eciToGeodetic(positionEci, gmst);

	return {
		t: Math.round(orbit.getTime() / 1000),
		ln: satellite.degreesLong(position_gd.longitude),
		lt: satellite.degreesLat(position_gd.latitude),
		h: position_gd.height
	};
}

var orbitTracking = L.realtime(function (success, error) {
	L.Realtime.reqwest({
		url: 'https://api.wheretheiss.at/v1/satellites/25544/tles',
		crossOrigin: true,
		type: 'json'
	}).then(function (data) {
		console.log('orbiteTracking', data);
		var tleLine1 = data.line1,
			tleLine2 = data.line2;
		var satrec = satellite.twoline2satrec(tleLine1, tleLine2);

		var issFtrack = orbitfutur.geometry.coordinates;
		var issPtrack = orbitpast.geometry.coordinates;

		var rtime = (data.requested_timestamp * 1000);
		var fullrev = 5561400;
		var rev = (fullrev / 10);

		var tle_1 = new Date(rtime - rev),
			tle_OO = new Date(rtime),
			tle_01 = new Date(rtime + rev),
			tle_02 = new Date(rtime + (rev * 2)),
			tle_03 = new Date(rtime + (rev * 3)),
			tle_04 = new Date(rtime + (rev * 4)),
			tle_05 = new Date(rtime + (rev * 5)),
			tle_06 = new Date(rtime + (rev * 6)),
			tle_07 = new Date(rtime + (rev * 7)),
			tle_08 = new Date(rtime + (rev * 8)),
			tle_09 = new Date(rtime + (rev * 9)),
			tle_10 = new Date(rtime + fullrev);

		var orbPrev1 = orbitPred.call(orbPrev1, tle_1, satrec);
		issPtrack.push([orbPrev1.ln, orbPrev1.lt]);

		var orbNow = orbitPred.call(orbNow, tle_OO, satrec);
		issPtrack.push([orbNow.ln, orbNow.lt]);
		issFtrack.push([orbNow.ln, orbNow.lt]);

		var orbPrev_01 = orbitPred.call(orbPrev_01, tle_01, satrec);
		issFtrack.push([orbPrev_01.ln, orbPrev_01.lt]);

		var orbPrev_02 = orbitPred.call(orbPrev_02, tle_02, satrec);
		issFtrack.push([orbPrev_02.ln, orbPrev_02.lt]);

		var orbPrev_03 = orbitPred.call(orbPrev_03, tle_03, satrec);
		issFtrack.push([orbPrev_03.ln, orbPrev_03.lt]);

		var orbPrev_04 = orbitPred.call(orbPrev_04, tle_04, satrec);
		issFtrack.push([orbPrev_04.ln, orbPrev_04.lt]);

		var orbPrev_05 = orbitPred.call(orbPrev_05, tle_05, satrec);
		issFtrack.push([orbPrev_05.ln, orbPrev_05.lt]);

		var orbPrev_06 = orbitPred.call(orbPrev_06, tle_06, satrec);
		issFtrack.push([orbPrev_06.ln, orbPrev_06.lt]);

		var orbPrev_07 = orbitPred.call(orbPrev_07, tle_07, satrec);
		issFtrack.push([orbPrev_07.ln, orbPrev_07.lt]);

		var orbPrev_08 = orbitPred.call(orbPrev_08, tle_08, satrec);
		issFtrack.push([orbPrev_08.ln, orbPrev_08.lt]);

		var orbPrev_09 = orbitPred.call(orbPrev_09, tle_09, satrec);
		issFtrack.push([orbPrev_09.ln, orbPrev_09.lt]);

		var orbPrev_10 = orbitPred.call(orbPrev_10, tle_10, satrec);
		issFtrack.push([orbPrev_10.ln, orbPrev_10.lt]);

		issPtrack.splice(0, Math.max(0, issPtrack.length - 2));
		issFtrack.splice(0, Math.max(0, issFtrack.length - 11));

		success({
			type: 'FeatureCollection',
			features: [orbitpast, orbitfutur]
		});

	}).catch(error);
}, {
	interval: 10 * 1000, // querry every 10sec

	style: function (feature) {

		return {
			color: '#FF2DBE',
			opacity: 0.65,
			weight: 2
		};
	},
});
orbitTracking.addTo(map);