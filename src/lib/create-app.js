import { createRoot, render } from "@wordpress/element";

export default function createApp(element, component) {
  document.body.classList.add("light-theme");

  if (createRoot) {
    const root = createRoot(element);
    root.render(component);
  } else {
    render(component, element);
  }
}
