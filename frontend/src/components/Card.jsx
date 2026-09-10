import React from "react";

export function Card({ title, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {title && <h3 className="card__title">{title}</h3>}
      {children}
    </section>
  );
}
