export default /* glsl */`
    vec2 uv = sfmToUv(sfm, scale);

    vec4 mapColor;
    if (all(bvec4(greaterThanEqual(uv, vec2(0.0)),
                  lessThanEqual(   uv, vec2(1.0))))) {
        mapColor = vec4(vec3(texture2D(map, uv)), opacity);
    } else {
        const lowp vec4 blackColor = vec4(vec3(0.0), 1.0);
        mapColor = blackColor;
    }`;
