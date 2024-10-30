import { __, _n, sprintf } from "@wordpress/i18n";
import AssetGallery from "./AssetGallery";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "@wordpress/element";
import AssetApiService from "../../services/AssetApiService";
import { debounce } from "lodash";
import InfiniteScroll from "react-infinite-scroll-component";
import { Checkbox, Button } from "@ntbjs/react-components/inputs";
import { ReactComponent as SvgDownload } from "../../assets/icon/download.svg";
import Loader from "../Loader";
import { clsx } from "clsx";

import Lightbox from "yet-another-react-lightbox";
import { Video, Captions } from "yet-another-react-lightbox/plugins";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import SearchField from "./SearchField";
import insertBlock from "../../lib/insert-block";
import { refreshMediaModal } from "../../lib/media-frame";

const assetService = new AssetApiService();
const searchParams = new URLSearchParams(window.location.search);

export default function AssetSearch() {
  const {
    organization,
    assetsInLibrary: globalAssetsInLibrary,
    source,
  } = window.Mediebank;

  const organizationLogo = organization?.organizationLogos?.[0].filePath || null;

  const assetGalleryRef = useRef(null);

  const [scrollTarget, setScrollTarget] = useState(window);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [assetResult, setAssetResult] = useState(null);
  const [assets, setAssets] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showMiniatureSearchBar, setShowMiniatureSearchBar] = useState(false);
  const [openAsset, setOpenAsset] = useState(null);

  const [addingAssets, setAddingAssets] = useState(false);
  const [assetsWithError, setAssetsWithError] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState([]);
  const [assetsInLibrary, setAssetsInLibrary] = useState(globalAssetsInLibrary);
  const [apiError, setApiError] = useState(false);

  const actionButtonText = useMemo(() => {
    const onlyAssetsInLibrary = selectedAssets.every((asset) =>
      assetsInLibrary.includes(asset.id),
    );
    if (onlyAssetsInLibrary) {
      return __("Sync to WordPress", "mediebank");
    }

    const someAssetsInLibrary = selectedAssets.some((asset) =>
      assetsInLibrary.includes(asset.id),
    );
    if (someAssetsInLibrary) {
      return __("Add/sync to WordPress", "mediebank");
    }

    return __("Add to WordPress", "mediebank");
  }, [selectedAssets]);

  const scrollEvent = () => {
    setShowMiniatureSearchBar(window.scrollY > 69);
  };

  useEffect(() => {
    scrollEvent();
    document.addEventListener("scroll", scrollEvent);

    return () => document.removeEventListener("scroll", scrollEvent);
  }, []);

  useEffect(() => {
    if (source === "wp-blocks-media-frame") {
      setScrollTarget(document.querySelector(".media-frame-content"));
    }
  }, [source]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set("search", searchQuery);
    history.replaceState(null, null, "?" + queryParams.toString());
  }, [searchQuery]);

  const hasMoreAssets = useMemo(() => {
    return (
      assetResult &&
      assetResult["_page"]?.offset <
        assetResult["_page"]?.total - assetResult["_page"]?.limit
    );
  }, [assetResult]);

  const searchAssets = useCallback(
    async (loadMore = false, searchQueryOverride) => {
      if (!loadMore) {
        setSearching(true);

        let scrollTo = window;
        if (source === "wp-blocks-media-frame") {
          scrollTo = document.querySelector(".media-frame-content");
        }

        scrollTo?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }

      assetService
        .query(searchQueryOverride || searchQuery)
        .offset(loadMore ? assets.length : 0)
        .fetch()
        .then((response) => {
          setAssetResult(response);
          setAssets((assets) =>
            loadMore
              ? [...assets, ...(response["_data"] || [])]
              : response["_data"] || [],
          );
        })
        .finally(() => {
          setSearching(false);
        })
        .catch(() => {
          setApiError(true)
        })
    },
    [searchQuery, assets],
  );

  const onAssetClicked = useCallback(
    (asset) => {
      if (source !== "standalone") {
        addToWordPress(asset.key).then();

        return;
      }

      setOpenAsset(asset);
    },
    [source],
  );

  const onSelectedChanged = useCallback(
    (internalSelectedKeys) => {
      const rawAssets = assets.filter((asset) => {
        return internalSelectedKeys.includes(asset.id);
      });

      setSelectedAssets(rawAssets);
    },
    [assets],
  );

  const deselectAllAssets = useCallback(() => {
    setSelectedAssets([]);
  }, [setSelectedAssets]);

  const throttledSearchAssets = useCallback(debounce(searchAssets, 800), []);

  useEffect(() => {
    if (searchQuery.length === 0) {
      searchAssets().then();
      return;
    }

    throttledSearchAssets(false, searchQuery);
  }, [searchQuery]);

  const addToWordPress = async (id) => {
    setAssetsLoading((assetIds) => [...assetIds, id]);

    return assetService.addToWordPress(
      id,
      (id, response) => {
        if (source === "classic-iframe") {
          window.location =
            "media-upload.php?type=image&tab=library&attachment_id=" +
            response.attachment.id;

          return;
        }

        if (source === "wp-blocks-media-frame") {
          // insertBlock(response.attachment);
          refreshMediaModal(response.attachment.id);

          return;
        }

        setAssetsInLibrary((assetIds) => [...assetIds, id]);
        setAssetsWithError((assetIds) => assetIds.filter((x) => x !== id));
      },
      (id) => {
        setAssetsWithError((assetIds) => [...assetIds, id]);
      },
      (id) => {
        setAssetsLoading((assetIds) => assetIds.filter((x) => x !== id));
      },
    );
  };

  const onAssetActionClicked = useCallback(async (asset) => {
    await addToWordPress(asset.key);
  }, []);

  const onSearchFieldClear = useCallback(() => {
    setSearchQuery("");
  }, [setSearchQuery]);

  const addAssets = useCallback(async () => {
    setAddingAssets(true);

    const promises = selectedAssets.map((asset) => addToWordPress(asset.id));

    await Promise.all(promises)
      .catch(() => {
        // silently suppress errors
      })
      .finally(() => {
        setAddingAssets(false);
      });
  }, [selectedAssets]);

  const selectedAssetsText = useMemo(() => {
    return sprintf(
      /* translators: %s amount of selected assets */
      _n(
        "%s asset selected",
        "%s assets selected",
        selectedAssets.length,
        "mediebank",
      ),
      selectedAssets.length,
    );
  }, [_n, selectedAssets.length]);

  return (
    <div className={"mediebank__gallery"}>
      {openAsset !== null && (
        <Lightbox
          open={true}
          close={() => setOpenAsset(null)}
          plugins={[Video, Captions]}
          controller={{ closeOnBackdropClick: true }}
          slides={[
            {
              type: openAsset.fileType,
              src:
                openAsset.fileType === "image"
                  ? openAsset.meta.lightboxUrl
                  : undefined,
              height: openAsset.height,
              width: openAsset.width,
              title: openAsset.title,
              description: openAsset.description,
              sources:
                openAsset.fileType === "video"
                  ? [
                      {
                        src: openAsset.meta.lightboxUrl,
                        type: "video/mp4",
                      },
                    ]
                  : undefined,
              autoPlay: true,
              loop: true,
            },
          ]}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
        />
      )}

      <div
        className={clsx("mediebank__gallery__header", {
          "mediebank__gallery__header--sticky": source !== "standalone",
        })}
      >
        <button
          className={"mediebank__gallery__header__logo"}
          onClick={onSearchFieldClear}
          aria-label={__("Clear search", "mediebank")}
        >
          {organizationLogo && <img
            className={'mediebank__gallery__header__logo__image'}
            src={organizationLogo}
            alt="Logo"
          />}

          <div className={'mediebank__gallery__header__logo__text'}>
            {__('Mediebank', 'mediebank')}
          </div>
        </button>

        <div className={"mediebank__gallery__header__search"}>
          <SearchField
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onClear={onSearchFieldClear}
          />
        </div>

        <div className={"mediebank__gallery__header__user"}></div>
      </div>

      {source === "standalone" && (
        <div className={"mediebank__gallery__action-bar"}>
          <div
            className={clsx("mediebank__gallery__action-bar__search", {
              "mediebank__gallery__action-bar__search--visible":
                showMiniatureSearchBar,
            })}
          >
            <SearchField
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onClear={onSearchFieldClear}
            />
          </div>

          <div className={"mediebank__gallery__action-bar__actions"}>
            <div
              className={"mediebank__gallery__action-bar__actions__selected"}
            >
              <div
                className={
                  "mediebank__gallery__action-bar__actions__selected__amount"
                }
              >
                {selectedAssetsText}
              </div>

              {selectedAssets.length > 0 && (
                <div
                  className={
                    "mediebank__gallery__action-bar__actions__selected__checkbox"
                  }
                >
                  <Checkbox
                    defaultChecked
                    indeterminate
                    name="deselect"
                    onChange={() => deselectAllAssets()}
                  />
                </div>
              )}
            </div>

            {selectedAssets.length > 0 && (
              <div
                className={"mediebank__gallery__action-bar__actions__download"}
              >
                <Button
                  icon={<SvgDownload />}
                  onClick={() => addAssets()}
                  loading={addingAssets}
                >
                  {actionButtonText}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={"mediebank__gallery__assets"}>
        {searching && <Loader />}

        {!searching && !apiError && (
          <InfiniteScroll
            scrollableTarget={scrollTarget}
            next={() => searchAssets(true)}
            hasMore={hasMoreAssets}
            loader={<Loader />}
            dataLength={assets.length}
          >
            <AssetGallery
              ref={assetGalleryRef}
              scrollElement={scrollTarget}
              singleChoice={source !== "standalone"}
              assets={assets}
              assetsInLibrary={assetsInLibrary}
              assetsWithError={assetsWithError}
              assetsLoading={assetsLoading}
              selectedAssets={selectedAssets}
              onSelectedChanged={onSelectedChanged}
              onAssetClicked={onAssetClicked}
              onAssetActionClicked={onAssetActionClicked}
            />
          </InfiniteScroll>
        )}

        {apiError && <div>
          We experienced an error while trying to fetch your assets.
          Please make sure that your Mediebank credentials are valid in the plugin settings.
        </div>}
      </div>
    </div>
  );
}
