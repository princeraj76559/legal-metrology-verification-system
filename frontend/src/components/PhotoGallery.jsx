import React, { useState } from "react";
import { Modal } from "./Modal";

export function PhotoGallery({ photos = [] }) {
  const [selected, setSelected] = useState(null);

  if (!photos.length) return <p className="muted">No photos uploaded.</p>;

  return (
    <>
      <div className="photo-grid">
        {photos.map((url, i) => (
          <div key={i} className="photo-thumb" onClick={() => setSelected(url)}>
            <img src={url} alt={`Evidence ${i + 1}`} loading="lazy" />
            <span className="photo-label">Photo {i + 1}</span>
          </div>
        ))}
      </div>
      {selected && (
        <Modal title="Evidence Photo" onClose={() => setSelected(null)}>
          <img src={selected} alt="Full size evidence" className="photo-full" />
        </Modal>
      )}
    </>
  );
}
