import { __ } from "@wordpress/i18n";
import { TextInput } from "@ntbjs/react-components/inputs";
import { ReactComponent as SvgSearch } from "../../assets/icon/search.svg";
import { ReactComponent as SvgClear } from "../../assets/icon/clear.svg";

export default function SearchField({ value, onChange, onClear }) {
  return (
    <div className={"mediebank__search-field"}>
      <TextInput value={value} icon={<SvgSearch />} onChange={onChange} />

      {value.length > 0 && (
        <button
          className={"mediebank__search-field__clear"}
          onClick={onClear}
          aria-label={__("Clear search", "mediebank")}
        >
          <SvgClear className={"mediebank__search-field__clear__icon"} />
        </button>
      )}
    </div>
  );
}
