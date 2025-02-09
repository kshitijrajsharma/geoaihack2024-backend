import { Map } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setupMaplibreMap } from "@/utils/setup-maplibre";
import { DrawingMode } from "@/enums/enums";
import { setupTerraDraw } from "@/utils/setup-terradraw";


export const useMapInstance = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<Map | null>(null);
    const [currentZoom, setCurrentZoom] = useState<number>(0);
    const [drawingMode, setDrawingMode] = useState<DrawingMode>(
        DrawingMode.STATIC,
    );


    useEffect(() => {
        const map = setupMaplibreMap(mapContainerRef);
        map.on("load", () => {
            setMap(map);
        });
        return () => map.remove();
    }, []);


    const terraDraw = useMemo(() => {
        if (map) {
            const terraDraw = setupTerraDraw(map);
            terraDraw.start();
            return terraDraw;
        }
    }, [map]);


    useEffect(() => {
        terraDraw?.setMode(drawingMode);
    }, [terraDraw, drawingMode]);


    const updateZoom = useCallback(() => {
        if (!map) return;
        setCurrentZoom(Math.round(map.getZoom()) + 1);
    }, [map]);

    useEffect(() => {
        if (!map) return;
        map.on("zoomend", updateZoom);
        return () => {
            map.off("zoomend", updateZoom);
        };
    }, [map, updateZoom]);

    return {
        mapContainerRef,
        map,
        currentZoom,
        terraDraw,
        drawingMode,
        setDrawingMode,
    };
};