import maplibregl, { Map } from "maplibre-gl";
import { MAX_ZOOM, MIN_ZOOM } from "../App";
import 'maplibre-gl/dist/maplibre-gl.css';
import { cogProtocol } from '@geomatico/maplibre-cog-protocol';



export const setupMaplibreMap = (
    containerRef: React.RefObject<HTMLElement>,
): Map => {
    // Check if RTL plugin is needed and set it
    if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
        maplibregl.setRTLTextPlugin(
            "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
            true,
        );
    }
    const map = new maplibregl.Map({
        container: containerRef.current!,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [0, 0],
        zoom: 2,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        pitchWithRotate: false,
        bounds: [[-16.5844444439998995, -2.6899999999999400], [74.4302777780001037, 31.2236111110000003]]
    });

    maplibregl.addProtocol('cog', cogProtocol);

    return map;
};