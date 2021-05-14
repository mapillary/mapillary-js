---
id: geo
title: Geo
---

## Geo Coordinates

Throughout MapillaryJS, two 3-dimensional coordinate systems are used; [geodetic (WGS84)](https://en.wikipedia.org/wiki/Geodetic_datum) and [local topocentric East, North, Up (ENU)](https://en.wikipedia.org/wiki/Local_tangent_plane_coordinates).

:::note

MapillaryJS provides helper functions for conversion through the [enuToGeodetic](/api/modules/api#enutogeodetic) and [geodeticToEnu](/api/modules/api#geodetictoenu) functions.

:::

### Conversion

Here, we describe the logic used to [convert coordinates](https://en.wikipedia.org/wiki/Geographic_coordinate_conversion) between the geodetic (WGS84), [Earth-Centered, Earth-Fixed (ECEF)](https://en.wikipedia.org/wiki/ECEF) and local topocentric East, North, Up (ENU) reference frames.

The WGS84 has longitude (degrees), latitude (degrees) and altitude (meters) values.

The ECEF Z-axis pierces the north pole and the XY-axis defines the equatorial plane. The X-axis extends from the geocenter to the intersection of the Equator and the Greenwich Meridian. All values in meters.

The WGS84 parameters are:

```
a = 6378137
b = a(1 - f)
f = 1 / 298.257223563
e = Math.sqrt((a^2 - b^2) / a^2)
e' = Math.sqrt((a^2 - b^2) / b^2)
```

The WGS84 to ECEF conversion is performed using the following:

```
X = (N - h)cos(phi)cos(lambda)
Y = (N + h)cos(phi)sin(lambda)
Z = (b^2N / a^2 + h)sin(phi)
```

where

```
phi = latitude
lambda = longitude
h = height above ellipsoid (altitude)
N = Radius of curvature (meters) = a / Math.sqrt(1 - e^2sin(phi)^2)
```

The ECEF to WGS84 conversion is performed using the following:

```
phi = arctan((Z + e'^2bsin(theta)^3) / (p - e^2acos(theta)^3))
lambda = arctan(Y / X)
h = p / cos(phi) - N
```

where

```
const p = Math.sqrt(X ^ (2 + Y) ^ 2);
const theta = arctan(Za / pb);
```

In the ENU reference frame the x-axis points to the East, the y-axis to the North and the z-axis Up. All values in meters.

The ECEF to ENU conversion is performed using the following:

```
    |       -sin(lambda_r)          cos(lambda_r)             0      |
T = | -sin(phi_r)cos(lambda_r)  -sin(phi_r)sin(lambda_r)  cos(phi_r) |
    |  cos(phi_r)cos(lambda_r)   cos(phi_r)sin(lambda_r)  sin(phi_r) |

    | X - X_r |
V = | Y - Y_r |
    | Z - Z_r |

| x |
| y | = TV
| z |
```

where

```
phi_r = latitude of reference
lambda_r = longitude of reference
X_r, Y_r, Z_r = ECEF coordinates of reference
```

The ENU to ECEF conversion is performed by solving the above equation for X, Y, Z.

WGS84 to ENU and ENU to WGS84 are two step conversions with ECEF calculated in the first step for both conversions.
