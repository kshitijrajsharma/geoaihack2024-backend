import maplibregl from "maplibre-gl";
import {
    TerraDraw,
    TerraDrawRectangleMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';



export const setupTerraDraw = (map: maplibregl.Map) => {
    return new TerraDraw({
        tracked: true,
        adapter: new TerraDrawMapLibreGLAdapter({
            map,
            coordinatePrecision: 16,
        }),
        modes: [
            new TerraDrawRectangleMode({
                styles: {
                    fillColor: "#fff",
                    fillOpacity: 0,
                    outlineColor: "#000",
                    outlineWidth: 2,
                },
            }),
        ],
    });
};