import React from "react";
import { Icon } from "./Icons";

export function SearchBar({ value, onChange, placeholder = "Search...", filters, children }) {
  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-icon"><Icon name="search" size={16} /></span>
        <input
          type="text"
          className="search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {children && <div className="search-filters">{children}</div>}
    </div>
  );
}
