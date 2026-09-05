'use client';

import { LocateFixed, MapPinOff } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { GpsStatus, RoutePoint } from '@/lib/route';

export function RouteMap({
  points,
  status,
  distanceKm,
  units,
}: {
  points: RoutePoint[];
  status: GpsStatus;
  distanceKm: number;
  units: 'km' | 'mi';
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const lineRef = useRef<import('leaflet').Polyline | null>(null);
  const markerRef = useRef<import('leaflet').CircleMarker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const pointsRef = useRef(points);
  const centeredRef = useRef(false);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    let disposed = false;
    void import('leaflet').then((leaflet) => {
      if (disposed || !containerRef.current) return;
      leafletRef.current = leaflet;
      const existing = pointsRef.current;
      const latest = existing.at(-1);
      const map = leaflet
        .map(containerRef.current, { zoomControl: false })
        .setView(
          latest ? [latest.lat, latest.lng] : [23.6978, 120.9605],
          latest ? 17 : 7,
        );
      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        })
        .addTo(map);
      leaflet.control.zoom({ position: 'bottomright' }).addTo(map);
      lineRef.current = leaflet
        .polyline(
          existing.map((point) => [point.lat, point.lng] as [number, number]),
          {
            color: '#2c6e50',
            weight: 6,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          },
        )
        .addTo(map);
      if (latest)
        markerRef.current = leaflet
          .circleMarker([latest.lat, latest.lng], {
            radius: 7,
            color: '#ffffff',
            weight: 3,
            fillColor: '#2c6e50',
            fillOpacity: 1,
          })
          .addTo(map);
      mapRef.current = map;
      centeredRef.current = Boolean(latest);
      window.setTimeout(() => map.invalidateSize(), 0);
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      lineRef.current = null;
      markerRef.current = null;
      leafletRef.current = null;
      centeredRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    const latest = points.at(-1);
    if (!map || !leaflet || !latest) return;

    const coordinates = points.map(
      (point) => [point.lat, point.lng] as [number, number],
    );
    lineRef.current?.setLatLngs(coordinates);
    if (!markerRef.current)
      markerRef.current = leaflet
        .circleMarker([latest.lat, latest.lng], {
          radius: 7,
          color: '#ffffff',
          weight: 3,
          fillColor: '#2c6e50',
          fillOpacity: 1,
        })
        .addTo(map);
    else markerRef.current.setLatLng([latest.lat, latest.lng]);

    if (!centeredRef.current) {
      map.setView([latest.lat, latest.lng], 17, { animate: false });
      centeredRef.current = true;
    } else map.panTo([latest.lat, latest.lng], { animate: false });
  }, [points]);

  const displayedDistance = units === 'mi' ? distanceKm * 0.621371 : distanceKm;
  const statusText: Record<GpsStatus, string> = {
    idle: 'GPS 尚未啟用',
    requesting: '正在搜尋 GPS',
    active: `GPS 已連線 · ${points.length} 個定位點`,
    paused: '已暫停路線記錄',
    denied: '未允許位置權限',
    unavailable: '此裝置不支援定位',
    error: '暫時無法取得位置',
  };
  const failed = ['denied', 'unavailable', 'error'].includes(status);

  return (
    <div className="route-map-shell">
      <div
        ref={containerRef}
        className="route-map-canvas"
        role="img"
        aria-label={`已記錄路線，距離 ${displayedDistance.toFixed(2)} ${units}`}
      />
      <div
        className={`route-map-status${failed ? ' is-error' : ''}`}
        data-status={status}
      >
        {failed ? <MapPinOff size={16} /> : <LocateFixed size={16} />}
        <span>{statusText[status]}</span>
      </div>
      {points.length === 0 && (
        <div className="route-map-empty">
          {failed ? <MapPinOff size={28} /> : <LocateFixed size={28} />}
          <strong>{failed ? '無法記錄目前路線' : '等待第一個定位點'}</strong>
          <span>
            {failed
              ? '請確認瀏覽器的位置權限後再繼續。'
              : '請移至戶外並保持此畫面開啟。'}
          </span>
        </div>
      )}
      <div className="route-map-summary">
        <span>已完成距離</span>
        <strong>
          {displayedDistance.toFixed(2)} <small>{units}</small>
        </strong>
      </div>
    </div>
  );
}
