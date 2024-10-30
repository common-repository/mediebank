<?php
/**
 * Plugin Name: Mediebank
 * Description: Integrates your Mediebank with WordPress
 * Version: 1.0.5
 * Author: NTB AS
 * License: AGPLv3.0 or later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: mediebank
 * Domain Path: /languages
 */

add_action( 'plugins_loaded', 'mediebank_integration_init' );

function mediebank_integration_init() {
    define( 'MEDIEBANK_INTEGRATION_PLUGIN_URL', untrailingslashit( plugins_url( basename( plugin_dir_path( __FILE__ ) ), basename( __FILE__ ) ) ) );
    define( 'MEDIEBANK_INTEGRATION_PLUGIN_PATH', untrailingslashit( plugin_dir_path( __FILE__ ) ) );

    include_once "includes/Mediebank_Helper.php";
    include_once "includes/Mediebank_Api.php";
    require_once "includes/Mediebank.php";
    include_once "includes/Mediebank_Rest_Api.php";

    Mediebank_Api::get_instance();
    Mediebank::get_instance();
    Mediebank_Rest_Api::get_instance();
}
