import AssetSearch from "../components/gallery/AssetSearch";
import NotConfigured from "../components/gallery/NotConfigured";
import clsx from "clsx";

export default function GalleryPage() {
  const { configured, source } = window.Mediebank;

  return (
    <div
      className={clsx("mediebank", {
        "mediebank--standalone": source === "standalone",
      })}
    >
      {configured ? <AssetSearch /> : <NotConfigured />}
    </div>
  );
}
