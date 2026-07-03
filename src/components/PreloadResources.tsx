"use client";

import ReactDOM from "react-dom";

// Warm up the network connection to Firebase while the JS is still parsing, so
// the first config fetch on a cold visit starts sooner. Rendered in the root
// layout; emits <link rel="preconnect"> into <head>.
export function PreloadResources() {
  ReactDOM.preconnect("https://firestore.googleapis.com", {
    crossOrigin: "anonymous",
  });
  ReactDOM.preconnect("https://firebaseinstallations.googleapis.com", {
    crossOrigin: "anonymous",
  });
  ReactDOM.prefetchDNS("https://identitytoolkit.googleapis.com");
  return null;
}
