export default /* glsl */`
vec2 sfmToUv(const in vec2 sfm, const in vec2 scale) {
    float u = scale.x * sfm.x + 0.5;
    float v = - scale.y * sfm.y + 0.5;
    return vec2(u, v);
}
`;
