import { __ } from "@wordpress/i18n";
import SearchField from "./SearchField";
import { Button } from "@ntbjs/react-components/inputs";

export default function NotConfigured() {
  return (
    <div className={"mediebank__gallery"}>
      <div className={"mediebank__gallery__header"}>
        <div className={"mediebank__gallery__header__logo"}>
          <div className={"mediebank__gallery__header__logo__text"}>
            {__("Mediebank", "mediebank")}
          </div>
        </div>

        <div className={"mediebank__gallery__header__search"}>
          <SearchField value={""} />
        </div>

        <div className={"mediebank__gallery__header__user"}></div>
      </div>

      <div className={"mediebank__gallery__assets"}>
        <div
          style={{
            textAlign: "center",
          }}
        >
          <h1>{__("Not configured", "mediebank")}</h1>

          <p style={{ marginBottom: "30px" }}>
            {__(
              "You need to configure your Mediebank settings in order to access your gallery.",
              "mediebank",
            )}
          </p>

          <a href="options-general.php?page=mediebank-options">
            <Button>{__("Go to the settings", "mediebank")}</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
