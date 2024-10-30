import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";
import { useForm } from "react-hook-form";
import { Button, Radio, TextInput } from "@ntbjs/react-components/inputs";
import apiFetch from "@wordpress/api-fetch";

export default function SettingsPage() {
  const { providers, options } = window.Mediebank;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: options,
  });

  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSaved(false);
    setApiError(false);

    const response = await apiFetch({
      path: "/mediebank/v1/options",
      method: "POST",
      data,
    });

    setSubmitting(false);
    setSaved(true);
    setApiError(!response.connected);
  };

  return (
    <div className="mediebank mediebank--settings">
      <h1>Mediebank settings</h1>

      <div className={"mediebank__container"}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={"mediebank__settings"}>
            <h2 style={{ marginTop: 0 }}>
              {__("General settings", "mediebank")}
            </h2>

            <div className={"mediebank__settings__field"}>
              <label
                htmlFor="provider"
                className={"mediebank__settings__field__label"}
              >
                {__("Media archive", "mediebank")} *
              </label>

              <div
                id={"provider"}
                className={"mediebank__settings__field__content"}
              >
                {providers.map((provider) => (
                  <Radio
                    {...register("provider", { required: true })}
                    key={provider.id}
                    label={provider.name}
                    style={{
                      marginBottom: "5px",
                    }}
                    value={provider.id}
                  />
                ))}
              </div>

              {errors.provider && (
                <div className={"mediebank__settings__field__error"}>
                  {__("This field is required", "mediebank")}
                </div>
              )}
            </div>

            <h2 className={"mediebank__settings__header"}>
              {__("API keys", "mediebank")}
            </h2>

            <p>
              {__(
                'Where you need to retrieve your API credentials from depend on which media archive you want to use. Please consult the plugin documentation for detailed instructions.',
                "mediebank",
              )}
            </p>

            <div className={"mediebank__settings__field"}>
              <label
                htmlFor="apiClientId"
                className={"mediebank__settings__field__label"}
              >
                {__("API Client ID", "mediebank")} *
              </label>

              <div className={"mediebank__settings__field__content"}>
                <TextInput
                  error={errors.apiClientId}
                  {...register("apiClientId", { required: true })}
                />
              </div>
            </div>

            <div className={"mediebank__settings__field"}>
              <label
                htmlFor="apiClientId"
                className={"mediebank__settings__field__label"}
              >
                {__("API Client Secret", "mediebank")} *
              </label>

              <div className={"mediebank__settings__field__content"}>
                <TextInput
                  error={errors.apiClientSecret}
                  type={"password"}
                  {...register("apiClientSecret", { required: true })}
                />
              </div>
            </div>

            {saved && !apiError && (
              <div
                className={
                  "mediebank__settings__saved mediebank__settings__saved--success"
                }
              >
                {__(
                  "Settings saved. Successfully connected to the API.",
                  "mediebank",
                )}
              </div>
            )}

            {saved && apiError && (
              <div
                className={
                  "mediebank__settings__saved mediebank__settings__saved--error"
                }
              >
                {__(
                  "There was an error connecting to the API. Please check that your Client ID and Client Secret are correct.",
                  "mediebank",
                )}
              </div>
            )}

            <div className={"mediebank__settings__submit"}>
              <Button loading={submitting}>{__("Save", "mediebank")}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
