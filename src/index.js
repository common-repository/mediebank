import "./main.scss";
import GalleryPage from "./pages/GalleryPage";
import SettingsPage from "./pages/SettingsPage";
import { initMediaFrame } from "./lib/media-frame";
import createApp from "./lib/create-app";

initMediaFrame();

if (document.getElementById("mediebank-app")) {
  createApp(document.querySelector("#mediebank-app"), <GalleryPage />);
}

if (document.getElementById("mediebank-settings")) {
  createApp(document.querySelector("#mediebank-settings"), <SettingsPage />);
}
