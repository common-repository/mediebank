import GalleryPage from "../pages/GalleryPage";
import createApp from "./create-app";

export function initMediaFrame() {
  if (typeof window.wp.media === "undefined") {
    return;
  }

  let mediebankActiveFrameId = "";
  let mediebankActiveFrame = "";

  const mediebankOldMediaFrame = window.wp.media.view.MediaFrame.Post;
  const mediebankOldMediaFrameSelect = window.wp.media.view.MediaFrame.Select;

  wp.media.view.MediaFrame.Select = mediebankOldMediaFrameSelect.extend({
    browseRouter(routerView) {
      mediebankOldMediaFrameSelect.prototype.browseRouter.apply(
        this,
        arguments,
      );
      routerView.set({
        mediebank: {
          text: wp.i18n.__("Mediebank", "mediebank"),
          priority: 120,
        },
      });
    },

    bindHandlers() {
      mediebankOldMediaFrameSelect.prototype.bindHandlers.apply(
        this,
        arguments,
      );
      this.on("content:create:mediebank", this.frameContent, this);
    },

    frameContent() {
      const state = this.state();

      if (state) {
        mediebankActiveFrameId = state.id;
        mediebankActiveFrame = state.frame.el;
      }
    },

    getFrame(id) {
      return this.states.findWhere({ id });
    },
  });

  wp.media.view.MediaFrame.Post = mediebankOldMediaFrame.extend({
    browseRouter(routerView) {
      mediebankOldMediaFrameSelect.prototype.browseRouter.apply(
        this,
        arguments,
      );
      routerView.set({
        mediebank: {
          text: wp.i18n.__("Mediebank", "mediebank"),
          priority: 120,
        },
      });
    },

    bindHandlers() {
      mediebankOldMediaFrame.prototype.bindHandlers.apply(this, arguments);
      this.on("content:create:mediebank", this.frameContent, this);
    },

    frameContent() {
      const state = this.state();

      if (state) {
        mediebankActiveFrameId = state.id;
        mediebankActiveFrame = state.frame.el;
      }
    },

    getFrame(id) {
      return this.states.findWhere({ id });
    },
  });

  const createHTMLWrapper = () => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("mediebank-container");

    const container = document.createElement("div");
    container.classList.add("mediebank-wrapper");

    const frame = document.createElement("div");
    frame.setAttribute(
      "id",
      "mediebank-media-router-" + mediebankActiveFrameId,
    );

    container.appendChild(frame);
    wrapper.appendChild(container);

    return wrapper;
  };

  const renderMediebankTab = () => {
    if (!mediebankActiveFrame) {
      return false;
    }

    const modal = mediebankActiveFrame.querySelector(".media-frame-content");
    if (!modal) {
      return false;
    }

    modal.innerHTML = "";

    const html = createHTMLWrapper();
    modal.appendChild(html);

    const element = modal.querySelector(
      "#mediebank-media-router-" + mediebankActiveFrameId,
    );

    if (!element) {
      return false;
    }

    createApp(element, <GalleryPage />);
  };

  jQuery(document).ready(function ($) {
    if (wp.media) {
      // Open
      wp.media.view.Modal.prototype.on("open", function () {
        if (!mediebankActiveFrame) {
          return false;
        }

        const activeTab = mediebankActiveFrame.querySelector(
          ".media-router button.media-menu-item.active",
        );

        if (activeTab && activeTab.id === "menu-item-mediebank") {
          renderMediebankTab();
        }
      });

      $(document).on(
        "click",
        ".media-router button.media-menu-item",
        function () {
          if (!mediebankActiveFrame) {
            return false;
          }

          const activeTab = mediebankActiveFrame.querySelector(
            ".media-router button.media-menu-item.active",
          );

          if (activeTab && activeTab.id === "menu-item-mediebank") {
            renderMediebankTab();
          }
        },
      );
    }
  });
}

export function refreshMediaModal(attachmentId) {
  if (typeof window.wp.media === "undefined") {
    return;
  }

  // Hacky way to switch tab
  const mediaModalEl = wp.media.frame.el;
  const mediaTab = mediaModalEl.querySelector("#menu-item-browse");
  if (mediaTab) {
    mediaTab.click();
  }

  // Delay to allow for the tab to switch properly before proceeding
  setTimeout(function () {
    if (wp.media.frame.content.get() !== null) {
      wp.media.frame.content.get().collection._requery(true);
    }

    // Set selected image
    const selection = wp.media.frame.state().get("selection");
    const selected = parseInt(attachmentId);
    selection.reset(selected ? [wp.media.attachment(selected)] : []);
  }, 100);
}
