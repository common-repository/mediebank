# Mediebank WordPress Plugin

## Development

### Standards

1. Follow the WordPress Coding Guidelines: https://developer.wordpress.org/coding-standards/wordpress-coding-standards/
2. Use `@ntbjs/react-components` for all it's worth.

### Getting started

Clone this repository into your WordPress plugins folder. You should now be able to install it in your WordPress
instance.

In order to run and build the front-end you need to install the front-end dependencies using npm.

```bash
npm i
```

To develop and watch for changes you can now run the following command:

```bash
npm run start
```

**NB:** Because React is running inside of WordPress, we do not have the luxury of development build debugging or
profiling.

### Updating language files

The easiest way to update language files is to first and foremost generate an up-to-date .pot file using wp-cli:

```bash
wp i18n make-pot . languages/mediebank.pot --exclude=node_modules,assets
```

Now you can translate the existing languages, or create new ones, using Loco translate or a similar plugin or tool.

Remember to make a json file from each language after editing the .po files. The json files are used by the front-end.

```bash
wp i18n make-json languages --no-purge --use-map=src/build.map.json
```

## Publishing to wordpress.org

The wordpress.org plugin repository is still stuck in the dark ages. Therefore, we need to use SVN in order to publish
new version of the plugin.

For each new release you need to do a few things:

1. Update the changelog area in `readme.txt` as well as any "Tested up to" or similar values.
2. Update the version number in the header of `mediebank.php`
3. Commit all changes to the SVN trunk. Make sure to not include the `src` or `node_modules` directories.

After you commit to the SVN trunk, a new version should be available on wordpress.org shortly.

## Contact

- Contact Julianne Gløersen for login details to SVN/Wordpress.org. 
