import { useMemo } from 'react';
import Map, {MapMarkerData} from './Map';


export default function DefMap() {
    
    // Fixed coordinates for Kyiv mapping
    const kyivCenter: [number, number] = [50.4501, 30.5234];

    // 1. Correctly placed high-density mock list generator directly in the Hero hook scope
    const massiveMarkerList = useMemo(() => {
        const list: MapMarkerData[] = [];
        for (let i = 0; i < 100; i++) {
        list.push({
            id: `mass-${i}`,
            lat: kyivCenter[0] + (Math.random() - 0.5) * 0.15,
            lng: kyivCenter[1] + (Math.random() - 0.5) * 0.25,
            title: `Apartment Hub Match №${i + 1}`,
            description: `Premium location option available with high-speed internet links.`,
            price: Math.floor(Math.random() * 2000) + 400,
            currency: '$'
        });
        }
        return list;
    }, []);

    let toggleView = false;
    let viewMode = 'map';

    return (
        <>
        
        <Map center={kyivCenter} zoom={11} markers={massiveMarkerList} />
        </>
    )
}
