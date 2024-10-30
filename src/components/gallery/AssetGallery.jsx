import {__, sprintf} from "@wordpress/i18n";
import { AssetGallery as InternalAssetGallery } from "@ntbjs/react-components/widgets";
import { useMemo } from "@wordpress/element";
import clsx from "clsx";
import { ReactComponent as SvgDownload } from "../../assets/icon/download.svg";
import { ReactComponent as SvgSync } from "../../assets/icon/sync.svg";

const getFileExtensionFromAsset = (asset) => {
  const parts = asset.file?.originalFilename?.split(".");

  return parts.pop()?.toLowerCase();
};

const getFileTypeFromAsset = (asset) => {
  if (asset.file?.mimeType?.includes("video")) {
    return "video";
  }

  if (asset.file?.mimeType?.includes("image")) {
    return "image";
  }

  return "other";
};

const getPreviewFromAsset = (asset, previewSize = 256) => {
  const fileType = getFileTypeFromAsset(asset);
  const previewSizes = Object.keys(asset.previews);

  if (fileType === "other") {
    // Return the biggest possible preview for a file with the type "other"...
    return asset.previews[previewSizes.pop()];
  }

  if (fileType === "image") {
    return asset.previews[previewSize];
  }

  if (previewSize > 256) {
    return asset.previews["mp4_preview"];
  }

  return asset.previews["mp4_thumbnail"];
};

const validWebFormats = [
  // images
  "jpg",
  "jpeg",
  "webp",
  "png",
  "gif",
  "svg",
  // video
  "mp4",
  // sound
  "mp3",
  "wav",
];

export default function AssetGallery({
  singleChoice,
  scrollElement,
  assets,
  assetsInLibrary,
  assetsWithError,
  assetsLoading,
  selectedAssets,
  onSelectedChanged,
  onAssetClicked,
  onAssetActionClicked,
}) {
  // const hasSelectedAssets = useMemo(() => {
  //   return selectedAssets.length > 0
  // }, [selectedAssets])

  const parsedAssets = useMemo(() => {
    return assets.map((asset) => {
      const extension = getFileExtensionFromAsset(asset);
      const invalidWebExtension = !validWebFormats.includes(extension);

      const fileType = getFileTypeFromAsset(asset);

      const smallPreview = getPreviewFromAsset(asset);
      const bigPreview = getPreviewFromAsset(asset, 1024);

      let { height, width } = asset.file;
      if (fileType === "video" && bigPreview) {
        height = bigPreview.height;
        width = bigPreview.width;
      }

      const hasError = assetsWithError.includes(asset.id);
      const inGallery = assetsInLibrary.includes(asset.id);
      const loading = assetsLoading.includes(asset.id);

      let actions = [];
      if (!loading && !singleChoice) {
        actions = [
          {
            title: inGallery
              ? __("Sync", "mediebank")
              : __("Download", "mediebank"),
            icon: inGallery ? <SvgSync /> : <SvgDownload />,
            onClick: (asset) => onAssetActionClicked(asset),
          },
        ];
      }

      // translators: %s file extension/format
      const warningText = sprintf(__('The file format "%s" does not work with WordPress.', "mediebank"), extension);

      const title = asset.headline || __("Missing title", "mediebank")
      const description = asset.description || __("Missing description", "mediebank")

      return {
        key: asset.id,
        previewUrl: smallPreview.url,
        height,
        width,
        fileType: getFileTypeFromAsset(asset),
        title,
        description,
        hasError,
        note: invalidWebExtension ? {
          title: warningText,
          type: 'error'
        } : undefined,
        summary: {
          description,
          title,
          instructions: invalidWebExtension ? warningText : null,
          instructionsType: 'error',
        },
        overlay:
          hasError || inGallery || loading || invalidWebExtension ? (
            <div
              className={clsx("mediebank__gallery__assets__overlay", {
                "mediebank__gallery__assets__overlay--loading": loading,
              })}
            >
              <div
                className={clsx("mediebank__gallery__assets__overlay__label", {
                  "mediebank__gallery__assets__overlay__label--error": hasError,
                })}
              >
                {hasError
                  ? __("Error", "mediebank")
                  : __("In library", "mediebank")}
              </div>
            </div>
          ) : undefined,
        meta: {
          lightboxUrl: bigPreview.url,
        },
        onClick:
          fileType !== "other"
            ? (_, asset) => {
                onAssetClicked(asset);
              }
            : undefined,
        actions,
      };
    });
  }, [assets, assetsInLibrary, assetsWithError, assetsLoading]);

  const selectedAssetKeys = useMemo(() => {
    return selectedAssets.map((asset) => asset.id);
  }, [selectedAssets]);

  return (
    <InternalAssetGallery
      activeSummaryCard={true}
      scrollElement={scrollElement}
      selectedAssetKeys={selectedAssetKeys}
      onSelectedChanged={onSelectedChanged}
      selectable={!singleChoice}
      assets={parsedAssets}
      thumbnailMaxHeight={190}
    />
  );
}
