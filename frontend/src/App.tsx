import axios from 'axios';
import bbox from '@turf/bbox';
import Datepicker from 'react-tailwindcss-datepicker';
import VaulDrawer from './components/vaul-drawer';
import {
  CalenderIcon,
  DatacraftLogo,
  GeoAIHackLogo,
  GoogleImage,
  Imagery,
  InstaDeepLogo,
  LocustImage,
  OSMImage,
  PredictionIcon,
  QuestionIcon
} from './assets';
import { COUNTRY_CODES_JSON } from './utils/country_codes';
import { DrawIcon } from './components/icons/draw-icon';
import { DrawingMode } from './enums/enums';
import {
  GeoTiffLayers,
  GOOGLE_SATELLITE_BASEMAP_LAYER,
  GoogleBasemapLayer,
  PredictionsLayer
} from './layers';
import { Map } from 'maplibre-gl';
import { MinusIcon, PlusIcon } from '@/components/icons';
import { PREDICTIONS_GEOJSON } from './utils/predictions';
import { TerraDraw } from 'terra-draw';
import { useCallback, useEffect, useState } from 'react';
import { useMapInstance } from '@/hooks/use-map';



export const MAX_ZOOM = 23;
export const MIN_ZOOM = 0;

const COUNTRY_CODES = Object.keys(COUNTRY_CODES_JSON);


const ZoomControl = ({ map }: { map: Map | null }) => {

  const handleZoomIn = () => {
    if (!map) return;
    if (map.getZoom() < MAX_ZOOM) {
      map.zoomIn();
    }

  }
  const handleZoomOut = () => {
    if (!map) return;
    if (map.getZoom() > MIN_ZOOM) {
      map.zoomOut();
    }
  }


  return (
    <div className='bottom-10 left-6 flex items-center justify-between gap-x-4 floating-components'>
      <button onClick={handleZoomIn}><PlusIcon className='cursor-pointer  w-4 h-4' /></button>
      <button onClick={handleZoomOut}><MinusIcon className='cursor-pointer  w-4 h-4' /></button>
    </div >
  )
}

const LegendControl = () => {
  return (
    <div className='bottom-10 right-6 floating-components flex flex-col gap-y-4'>
      <p className='font-bold text-md text-right'>Legend</p>
      <div className=' flex items-center justify-between gap-x-4 '>
        <div className='w-4 h-4 rounded-full bg-red-600'></div>
        <h1>Breeding Zones</h1>
      </div>
    </div >
  )
}


const AppInfo = () => {
  return (
    <div className='floating-components h-12 top-6 left-6 flex gap-x-2 items-center font-bold'><img src={LocustImage} className='w-8 h-8 ' alt='Locust Finder Logo'></img> LocustFinder</div>
  )
}

const OrganizersInfo = () => {
  const logos = [InstaDeepLogo, DatacraftLogo, GeoAIHackLogo];
  return (
    <div className='floating-components bottom-10 w-[87%] self-center mx-auto'>
      <small>Organized by:</small>
      <div className='flex gap-x-4'>
        {
          logos.map((logo, index) => (
            <img key={index} src={logo} alt='logo' className='w-full h-5' />
          ))
        }
      </div>
      <small>© GeoTechAI Team</small>
    </div>
  )
}

const DrawComponent = ({ setDrawnPolygon, terraDraw, setDrawingMode, drawingMode }: { setDrawnPolygon: (p: any) => void, terraDraw: TerraDraw | undefined, setDrawingMode: (mode: DrawingMode) => void, drawingMode: DrawingMode }) => {

  const handleChange = useCallback(() => {
    const snapshot = terraDraw?.getSnapshot();
    setDrawnPolygon(snapshot);
  }, [terraDraw, setDrawnPolygon]);

  useEffect(() => {
    terraDraw?.on('finish', handleChange)
    return () => {
      terraDraw?.off('finish', handleChange)
    }
  }, [terraDraw, handleChange])


  const handleClick = () => {
    if (drawingMode === DrawingMode.RECTANGLE) {
      setDrawingMode(DrawingMode.STATIC)
    } else {
      setDrawingMode(DrawingMode.RECTANGLE)
    }
  }

  return (
    <button className='flex gap-x-2 items-center cursor-pointer' onClick={handleClick}>
      <DrawIcon className='w-7 h-7' />
      <span className='text-nowrap font-semibold'>AOI</span>
    </button>
  )
}

const CountryComponent = ({ setSelectedCountry }: { selectedCountry: string, setSelectedCountry: (c: string) => void, }) => {

  const contryCodesWithPredictions = COUNTRY_CODES.filter(countryCode => {
    const countryMgrsIds = COUNTRY_CODES_JSON[countryCode];
    return countryMgrsIds.some(mgrsId => PREDICTIONS_GEOJSON.features.some(feature => feature.properties.mgrs_tile_id === mgrsId));
  });

  return (
    <button className='flex gap-x-2 items-center cursor-pointer' >
      <select className='border p-1.5' onChange={(e) => setSelectedCountry(e.target.value)}>
        <option>All</option>
        {
          contryCodesWithPredictions.map((country, id) => <option key={id}>{country}</option>)
        }
      </select>
      <span className='text-nowrap font-semibold'>Country Code</span>
    </button>
  )
}

const DatepickerComponent = ({ date, setDate }: { date: any, setDate: any }) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  return (
    <div className='relative'>
      <div className='flex gap-x-2 items-center cursor-pointer' onClick={() => setShowDatePicker(!showDatePicker)}>
        <img src={CalenderIcon} alt='Locust Finder Logo' className='w-6 max-h-6'></img>
        <span className='text-nowrap font-semibold'>Date</span>
      </div>
      <div className='w-64 absolute top-12 -translate-x-1/2 duration-300'>
        {
          showDatePicker && <Datepicker
            separator='to'
            value={date}
            onChange={(value) => setDate(value)}
          />
        }
      </div>
    </div>
  )
}

const AboutComponent = () => {

  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <VaulDrawer open={open} onOpenChange={setOpen}>
        <div>
          <p className='mb-2'>
            <span className='font-bold'>LocustFinder</span> is a tool developed to help monitor and predict the movement of desert locusts. Desert locusts are a species of short-horned grasshoppers that can form large swarms and cause significant agricultural damage.
          </p>
          <p className='mb-2'>
            This portal was developed as part of the GeoAI Hackathon 2025, an event focused on leveraging geospatial data and AI to solve real-world problems. For more information about the hackathon, visit the <a href='https://geoaihack.com/' target='_blank' rel='noopener noreferrer' className='text-blue-500 underline'>GeoAI Hackathon 2025 website</a>.
          </p>
        </div>
        <OrganizersInfo />
      </VaulDrawer>

      <button onClick={() => setOpen(!open)} className='flex gap-x-2 items-center cursor-pointer'>
        <img src={QuestionIcon} alt='Locust Finder Logo' className='w-6 h-6'></img>
        <span className='text-nowrap font-semibold'>About</span>
      </button>
    </>
  )
}

const DateUpdatedComponent = () => {

  return (
    <div className='top-6  right-6  floating-components'>
      <h1>Last Updated</h1>
      <p className='font-bold'>{new Date().toDateString()}</p>
    </div >
  )
}

const BasemapSwitcher = ({ map }: { map: Map | null }) => {
  const [showBasemap, setShowBasemap] = useState(false);
  const [activeBasemap, setActiveBasemap] = useState('osm');

  useEffect(() => {
    if (!map) return
    if (!map.getLayer(GOOGLE_SATELLITE_BASEMAP_LAYER)) return
    if (activeBasemap === 'osm') {
      map?.setLayoutProperty(GOOGLE_SATELLITE_BASEMAP_LAYER, 'visibility', 'none')
    } else {
      map?.setLayoutProperty(GOOGLE_SATELLITE_BASEMAP_LAYER, 'visibility', 'visible')
    }
    map.moveLayer(GOOGLE_SATELLITE_BASEMAP_LAYER);
    map.moveLayer('predictions-layer');
  }, [map, activeBasemap]);

  return (
    <>
      <button onClick={() => setShowBasemap(!showBasemap)} className='flex gap-x-4 items-center'><img src={Imagery} className='w-6 h-6' alt='Locust Finder Logo'></img>Basemap</button>
      {
        showBasemap && (
          <div className='top-16 right-32 floating-components flex gap-x-4'>
            <button onClick={() => setActiveBasemap('google')} className='flex flex-col items-center justify-center'><img src={GoogleImage} className='w-8 h-8 rounded-full' alt='Locust Finder Logo'></img>Google</button>
            <button onClick={() => setActiveBasemap('osm')} className='flex flex-col items-center justify-center'><img src={OSMImage} className='w-8 h-8 rounded-full' alt='Locust Finder Logo'></img>OpenStreetMap</button>
          </div >
        )
      }
    </>
  )
}


const PredictComponent = ({ handlePredict }: { handlePredict: () => void }) => {

  return (
    <button onClick={handlePredict} className='flex gap-x-2 items-center cursor-pointer'>
      <img src={PredictionIcon} alt='Locust Finder Logo' className='w-6 h-6'></img>
      <span className='text-nowrap font-semibold'>Predict</span>
    </button>

  )
}

const FloatingControls = ({ date, setDate, handlePredict, setDrawnPolygon, map, terraDraw, setDrawingMode, drawingMode, selectedCountry, setSelectedCountry }:
  { date: any, setDate: any, handlePredict: () => void, setDrawnPolygon: (p: any) => void, selectedCountry: string, setSelectedCountry: (c: string) => void, map: Map | null, terraDraw: TerraDraw | undefined, setDrawingMode: (mode: DrawingMode) => void, drawingMode: DrawingMode }) => {
  return (
    <div className='floating-components h-12 top-6 left-1/2  flex gap-x-6 w-fit -translate-x-1/2 items-center'>
      {/* Draw */}
      <CountryComponent selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} />
      <DrawComponent setDrawingMode={setDrawingMode} drawingMode={drawingMode} terraDraw={terraDraw} setDrawnPolygon={setDrawnPolygon} />
      {/* Date month picker */}

      <DatepickerComponent date={date} setDate={setDate} />
      <BasemapSwitcher map={map} />
      <PredictComponent handlePredict={handlePredict} />
      {/* Help */}
      <AboutComponent />
    </div>
  )
}



function App() {

  const { map, mapContainerRef, terraDraw, setDrawingMode, drawingMode } = useMapInstance();
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const [date, setDate] = useState({
    startDate: null,
    endDate: null
  });
  const [loading, setLoading] = useState(false);


  const formatDate = (date) => {
    const d = new Date(date);
    const formattedDate = new Date(d.setMonth(d.getMonth() - 2)).toISOString().split('T')[0];
    return formattedDate
  }
  const handlePredict = () => {
    const drawnBbox = bbox(drawnPolygon[0]);
    const sd = formatDate(date.startDate);
    const ed = formatDate(date.endDate);
    setLoading(true)
    axios.post('https://3773-213-39-19-45.ngrok-free.app/process', {
      start_date: sd,
      end_date: ed,
      cloud_cover: 30,
      bbox: drawnBbox
    })
      .then(response => {
        console.log('Prediction response:', response.data);
        setLoading(false)
      })
      .catch(error => {
        console.error('Error making prediction request:', error);
        setLoading(false)
      });
  }

  return (
    <div ref={mapContainerRef} className='relative w-screen h-screen'>
      <AppInfo />
      <ZoomControl map={map} />
      <LegendControl />
      <DateUpdatedComponent />
      <FloatingControls date={date} setDate={setDate} handlePredict={handlePredict} setDrawnPolygon={setDrawnPolygon} map={map} terraDraw={terraDraw} setDrawingMode={setDrawingMode} drawingMode={drawingMode} selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} />

      {map && <PredictionsLayer map={map} selectedCountry={selectedCountry} />}
      {map && <GoogleBasemapLayer map={map} />}
      {map && <GeoTiffLayers map={map} />}
    </div>

  )
}

export default App
