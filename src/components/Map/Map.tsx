import React, { useCallback, useState } from 'react';
import { GoogleMap, LoadScript, Marker  } from '@react-google-maps/api';
import { addDoc, collection, deleteDoc, doc, getDocs, writeBatch, serverTimestamp, updateDoc } from 'firebase/firestore';
import firestore from '../../config/firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
// import MarkerClusterer from '@googlemaps/markerclustererplus';


const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 51.5074,
  lng: -0.1278
};

const Map: React.FC = () => {
  const [markers, setMarkers] = useState<{
    id: string,
    lat: number,
    lng: number,
    label_id: string,
    timestamp: any
  }[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUsedLabelNumber, setLastUsedLabelNumber] = useState<number>(1);
  // const [apiKey, setApiKey] = useState<string | undefined>(undefined);


  const onClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();

      const duplicateMarker = markers.find(marker => marker.lat === clickedLat && marker.lng === clickedLng);

      if (!duplicateMarker) {
        const timestamp = serverTimestamp();

        const newMarker = {
          id: uuidv4(),
          lat: clickedLat,
          lng: clickedLng,
          label_id: `${lastUsedLabelNumber}`,
          timestamp
        };

        try {
          const markerRef = await addDoc(collection(firestore, "Quests"), newMarker);
          newMarker.id = markerRef.id;

          setMarkers([...markers, newMarker]);
          setErrorMessage(null);
          setLastUsedLabelNumber(lastUsedLabelNumber + 1);
        } catch (error) {
          console.error('Error adding marker to Firestore: ', error);
          setErrorMessage('Failed to add the tag. Try again.');
        }
      } else {
        setErrorMessage('You cant add a tag in the same place!');
        setTimeout(() => {
          setErrorMessage(null);
        }, 3000);
      }
    }
  }, [markers, lastUsedLabelNumber]);

  const handleDeleteMarker = async () => {
    if (selectedMarker) {
      try {
        await deleteDoc(doc(firestore, "Quests", selectedMarker));
        const updatedMarkers = markers.filter(marker => marker.id !== selectedMarker);

        let highestLabelNumber = 0;
        updatedMarkers.forEach(marker => {
          const labelNumber = parseInt(marker.label_id);
          if (!isNaN(labelNumber) && labelNumber > highestLabelNumber) {
            highestLabelNumber = labelNumber;
          }
        });

        setMarkers(updatedMarkers);
        setLastUsedLabelNumber(highestLabelNumber + 1);
        setSelectedMarker(null);
        setErrorMessage(null);

      } catch (error) {
        console.error('Error deleting marker from Firestore: ', error);
        setErrorMessage('Failed to add the tag. Try again.');
      }
    }
  };

  const handleDeleteAllMarkers = async () => {
    try {
      const markersRef = collection(firestore, "Quests");
      const querySnapshot = await getDocs(markersRef);
      const batch = writeBatch(firestore);

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      setMarkers([]);
      setLastUsedLabelNumber(1);
      setSelectedMarker(null);
      setErrorMessage(null);

    } catch (error) {
      console.error('Error deleting all markers from Firestore: ', error);
      setErrorMessage('Failed to add the tag. Try again.');
    }
  };

  const handleMarkerDragEnd = async (markerId: string, e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const updatedMarkers = markers.map(marker =>
        marker.id === markerId ? { ...marker, lat: e.latLng!.lat(), lng: e.latLng!.lng() } : marker
      );

      setMarkers(updatedMarkers);

      try {
        await updateDoc(doc(firestore, "Quests", markerId), {
          lat: e.latLng!.lat(),
          lng: e.latLng!.lng()
        });

        setErrorMessage(null);
      } catch (error) {
        console.error('Error updating marker position in Firestore: ', error);
        setErrorMessage('Failed to add the tag. Try again.');
      }
    }
  };

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY || 's';

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onClick={onClick}
      >
        {markers.map((marker, index) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            label={marker.id === selectedMarker ? '' : marker.label_id}
            draggable={true}
            onDragStart={() => console.log('Dragging the marker has begun')}
            onDrag={(e) => {
              if (e.latLng) {
                console.log('Dragging the marker: ', e.latLng.lat(), e.latLng.lng());
              }
            }}
            onDragEnd={(e) => handleMarkerDragEnd(marker.id, e)}
            onClick={() => {
              setSelectedMarker(marker.id === selectedMarker ? null : marker.id);
            }}
          />
        ))}
      </GoogleMap>
      {selectedMarker && (
        <button onClick={handleDeleteMarker} style={{ marginRight: '10px', padding: '5px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#00812A', color: '#fff', fontWeight: '500', letterSpacing: '.5px' }}> Remove marker {markers.find(marker => marker.id === selectedMarker)?.label_id}</button>
      )}
      <button onClick={handleDeleteAllMarkers} style={{ marginTop: '10px', padding: '5px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#00812A', color: '#fff', fontWeight: '500', letterSpacing: '.5px' }}> Remove all markers </button>

      {errorMessage && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {errorMessage}
        </div>
      )}
    </LoadScript>
  );
};

export default Map;
