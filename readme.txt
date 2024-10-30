=== Mediebank ===
Contributors: developerntbno, EverydayAS, marcuz2k2k
Tags: mediebank, ntb, tt, stt, asset manager
Requires at least: 5.0
Tested up to: 6.7
Stable tag: 1.0.5
Requires PHP: 8.0
License: AGPLv3.0 or later
License URI: https://www.gnu.org/licenses/agpl-3.0.html
This plugin allows you to insert pictures and videos from your Mediebank directly into WordPress articles and pages.

== Description ==

**Disclaimer:** Third party subscription required. Using the features in this plugin requires that your organization has an existing Mediebank subscription.
Get started by contacting the appropriate Mediebank provider for you:
- [Mediebank (NTB)](https://www.ntb.no/bilder/mediebank) ([Privacy policy](https://www.ntb.no/personvernerklaering))
- [Mediebank (TT)](https://tt.se/om/bild/mediebank) ([Privacy policy](https://tt.se/om/gdpr))
- [Kuvapankki (STT)](https://www.viestintapalvelut.fi/stt-kuvapankki) ([Privacy policy](https://stt.fi/tietosuoja/))

This plugin allows you to insert pictures and videos from your Mediebank directly into WordPress articles and pages.

Once the plugin is installed all your Mediebank files become available from the side menu within WordPress. An option to select images and videos directly from the Mediebank become available in both the classic editor and Gutenberg.

**Third party API notice:** This plugin communicates with several Mediebank APIs for the purposes of displaying and downloading media. This is a Machine-To-Machine interaction. It will also report usage of your assets (Mediebank assets ONLY) whenever you use them in an article or page. Here's a list of APIs we communicate with:
- https://api.ntb.no (The Mediebank API Hub proxy – Used to fetch media, download media, and for the media usage reporting).
- https://mediebank.ntb.no/api/v1 (Direct Mediebank API – Used to fetch some details about your organization, like your logo and organization name).
- https://login.sdl.no/oauth/token (The authentication API – Used to fetch an API token for the other APIs).

== Installation ==

To use the plugin you need to do the following:

1. Download and activate the plugin.
2. Configure the plugin's settings and fetch a set of client credentials from the chosen media archive. 
   1. **Mediebank:** You can create a set of API keys in your Mediebank's "Organization Settings" -> "API Clients" area.
   2. **NTB Marketplace:** Contact your Technical Account Manager in order to configure this integration. 
   3. **TT Marketplace:** Contact your Technical Account Manager in order to configure this integration.
3. You can now use your media assets directly from your WordPress installation.

== Compatibility ==

We may add compatibility with more editors, but at the moment we support selecting images via:

- Gutenberg
- The classic editor

== Screenshots ==

1. The Mediebank area accessible in WordPress.
2. You can inspect assets before downloading by clicking on them.
3. See what assets are already in your WordPress library or sync their metadata.
4. Select an image using the image block directly in Gutenberg.
5. Select an image using the legacy editor.

== Changelog ==

= 1.0.5 =
* Fixed: Clarified how the supported media archives work further.

= 1.0.4 =
* Added: Clarified that `provider` refers to where assets are fetched from, a "media archive" if you will.

= 1.0.3 =
* Fix: No longer display the file format compatibility warning in the gallery for file formats where the extension is allowed, but is displayed in uppercase.

= 1.0.2 =
* Fix: make sure that the asset gallery knows we are on the standalone page, as opposed to thinking we are always within the Gutenberg editor.
* Fix: Use `wp.i18n.__` instead of `__` directly.
* Fix: Added padding around te search bar when an organization has a very wide logo.

= 1.0.1 =
* Fix: hardened error handling.

= 1.0.0 =
* Initial release.
