// // Used ChatpGPT to healp with leaflet code

// import { useEffect, useState } from "react";
// import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// export function la_Map() {
//     const [laGeoJsonData, setGeoJsonData] = useState(null);

//     useEffect(() => {
//         fetch("/los-angeles-county.geojson")
//         .then((response) => response.json())
//         .then((result) => setGeoJsonData(result))
//     }, []);

//     const center = [34.3872, -118.2623];

//     return (
//         <MapContainer center = {center} zoom = {9} style = {{"width": "100%", "height": "100%"}}>
//             <TileLayer
//             attribution = '&copy; OpenStreetMap contributors'
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//             />
//             {laGeoJsonData && (
//                 <GeoJSON
//                 data = {laGeoJsonData}
//                 style = {{color: "blue", weight: 1, fillOpacity: 0.1}}
//                 />
//             )}
//         </MapContainer>
//     );
// }