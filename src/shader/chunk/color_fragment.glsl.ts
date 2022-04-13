export default /* glsl */`
    vec2 uv = sfmToUv(sfm, scale);
    float u = uv.x;
    float v = uv.y;

    vec4 baseColor;
    if (u >= 0. && u <= 1. && v >= 0. && v <= 1.) {
        baseColor = texture2D(map, vec2(u, v));
        baseColor.a = opacity;
    } else {
        baseColor = vec4(0.0, 0.0, 0.0, 0.0);
    }

    gl_FragColor = baseColor;
`;
