export default /* glsl */`
    vec2 uv = sfmToUv(sfm, scale);
    float u = uv.x;
    float v = uv.y;

    vec4 mapColor;
    if (u >= 0. && u <= 1. && v >= 0. && v <= 1.) {
        mapColor = texture2D(map, vec2(u, v));
        mapColor.a = opacity;
    } else {
        mapColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
`;
