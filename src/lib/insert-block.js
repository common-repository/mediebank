import { createBlock } from "@wordpress/blocks";
import { dispatch } from "@wordpress/data";

export default function insertBlock(attachment, closeModal = true) {
  const { id = null, url = null, caption = "", alt = "" } = attachment;

  if (!url || !id) {
    return;
  }

  const block = createBlock("core/image", {
    id,
    url,
    caption,
    alt,
  });

  dispatch("core/block-editor").insertBlocks(block);

  if (!closeModal) {
    return;
  }

  const mediaModalEl = document.querySelector(".media-modal");

  const closeBtn = mediaModalEl.querySelector("button.media-modal-close");

  if (!closeBtn) {
    return;
  }

  closeBtn.click();
}
