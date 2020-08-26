# isslive
Realtime.reqwest to scout the  International Space Station


### Libs:
*			https://github.com/perliedman/leaflet-realtime
*			https://github.com/joergdietrich/Leaflet.Terminator
*			https://github.com/shashwatak/satellite-js
*			https://github.com/henrythasler/Leaflet.Geodesic

### Orbit

The ISS orbit is design with satellite-js and the TLE (line1,2 and the requested_timestamp) from the wheretheiss.at API:

> https://api.wheretheiss.at/v1/satellites/25544/tles

One full orbit (92.69min) is render on the map with a geodesic design.

22/NOV/2016 23:55:40

```json
{
	"requested_timestamp":1479855340,
	"tle_timestamp":1479759668,
	"line1":"1 25544U 98067A   16326.84800926  .00003019  00000-0  53649-4 0  9999",
	"line2":"2 25544  51.6455 351.8135 0006162 239.2875 125.9187 15.53695609 29514"
}
```

![screeshot](https://raw.githubusercontent.com/RobyRemzy/isslive/master/capture.png)  
### TODO

* better precision on sun position
* display a dashbord for all ISS const and info
* add a dragable marker to get the (Azimuth, Elevation) to get the line of sight of ISS
