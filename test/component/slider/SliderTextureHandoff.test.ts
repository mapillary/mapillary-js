import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";

function plane(imageId: string, texture: any): any {
    return { imageId, mesh: { material: { uniforms: { projectorTex: { value: texture } } } } };
}
function texture(): any {
    return { dispose: jasmine.createSpy("dispose") };
}

describe("SliderGLRenderer texture handoff", () => {
    test("moves the live texture to the rebuilt plane and disposes only the replaced one", () => {
        const live = texture(), replaced = texture();
        const old = plane("a", live), next = plane("a", replaced);
        (new SliderGLRenderer() as any)._preserveTextures([old], [next]);
        expect(next.mesh.material.uniforms.projectorTex.value).toBe(live);
        expect(old.mesh.material.uniforms.projectorTex.value).toBeNull();
        expect(replaced.dispose).toHaveBeenCalledTimes(1);
        expect(live.dispose).not.toHaveBeenCalled();
    });

    test("does not dispose a texture shared by the old and rebuilt planes", () => {
        const shared = texture();
        const old = plane("a", shared), next = plane("a", shared);
        (new SliderGLRenderer() as any)._preserveTextures([old], [next]);
        expect(next.mesh.material.uniforms.projectorTex.value).toBe(shared);
        expect(shared.dispose).not.toHaveBeenCalled();
    });

    test("leaves planes for other images untouched", () => {
        const live = texture(), other = texture();
        const next = plane("b", other);
        (new SliderGLRenderer() as any)._preserveTextures([plane("a", live)], [next]);
        expect(next.mesh.material.uniforms.projectorTex.value).toBe(other);
        expect(other.dispose).not.toHaveBeenCalled();
    });
});
